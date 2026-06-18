import { useState, useEffect, useCallback, useRef } from "react"
import type { ChatMessage, ChatSession, ChatMode, ChatErrorType } from "../types/chatTypes"
import { v4 as uuidv4 } from 'uuid';

/** localStorage 存储 key，避免硬编码 */
const STORAGE_KEY = 'chat_sessions'

/** 单次请求最大重试次数（网络抖动时自动重试） */
const MAX_RETRIES = 1

function generateId(): string {
  return uuidv4();
}

function generateTitle(content: string): string {
  return content.length > 20 ? content.substring(0, 20) + '...' : content
}

export function useChatStore() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [currentMode, setCurrentMode] = useState<ChatMode | null>(null)
  const [loading, setLoading] = useState(false)

  const currentSessionIdRef = useRef(currentSessionId)
  const currentModeRef = useRef(currentMode)
  const sessionsRef = useRef(sessions)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => { currentModeRef.current = currentMode }, [currentMode])
  useEffect(() => { currentSessionIdRef.current = currentSessionId }, [currentSessionId])
  useEffect(() => { sessionsRef.current = sessions }, [sessions])

  // 加载本地存储
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const loadedSessions = JSON.parse(stored) as ChatSession[]
      setSessions(loadedSessions)
      if (loadedSessions.length > 0) {
        setCurrentSessionId(loadedSessions[0].id)
      }
    }
  }, [])

  // 保存本地存储
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [sessions])

  const generateSessionData = (): ChatSession => ({
    id: generateId(),
    title: '新会话',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  })

  const createNewSession = useCallback(() => {
    const newSession = generateSessionData()
    setSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    return newSession.id;
  }, [])

  /**
   * 将机器人消息（含可选错误信息）写入当前会话
   */
  const appendRobotMessage = useCallback(
    (sessionId: string, robotId: string, content: string, error?: ChatMessage['error']) => {
      setSessions(prev => prev.map(s =>
        s.id === sessionId
          ? {
            ...s,
            messages: [...s.messages, {
              id: robotId,
              role: 'robot' as const,
              content,
              timestamp: Date.now(),
              ...(error ? { error } : {}),
            }],
            updatedAt: Date.now(),
          }
          : s
      ))
    }, [])

  /**
   * 更新指定机器人消息的内容（用于流式追加）
   */
  const updateRobotMessage = useCallback(
    (sessionId: string, robotId: string, content: string) => {
      setSessions(prev => prev.map(s =>
        s.id === sessionId
          ? {
            ...s,
            messages: s.messages.map(m =>
              m.id === robotId ? { ...m, content } : m
            ),
            updatedAt: Date.now(),
          }
          : s
      ))
    }, [])

  /**
   * 解析后端返回的 JSON 错误体
   */
  async function parseErrorResponse(response: Response): Promise<{ type: ChatErrorType; message: string }> {
    try {
      const json = await response.json()
      return {
        type: (json.errorType as ChatErrorType) || 'UNKNOWN',
        message: (json.error as string) || '请求失败',
      }
    } catch {
      return { type: 'UNKNOWN', message: `请求失败（HTTP ${response.status}）` }
    }
  }

  /**
   * 核心流式请求逻辑，支持重试
   */
  const streamChat = useCallback(async (
    sessionId: string,
    robotId: string,
    contextMessages: { role: 'user' | 'assistant'; content: string }[],
    signal: AbortSignal,
    retryCount = 0,
  ): Promise<void> => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: contextMessages,
        mode: currentModeRef.current,
      }),
      signal,
    })

    if (!response.ok) {
      const { type, message } = await parseErrorResponse(response)

      // 可重试的错误 + 还未用完重试次数 → 自动重试
      const retryableTypes: ChatErrorType[] = ['API_TIMEOUT', 'NETWORK_ERROR', 'API_RATE_LIMIT']
      if (retryableTypes.includes(type) && retryCount < MAX_RETRIES) {
        // 等待 1 秒后重试
        await new Promise(r => setTimeout(r, 1000))
        return streamChat(sessionId, robotId, contextMessages, signal, retryCount + 1)
      }

      // 不可重试或重试用尽：写入错误消息
      appendRobotMessage(sessionId, robotId, '', { type, message })
      return
    }

    // SSE 流式读取
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let accumulated = ''

    // 先插入空的机器人消息占位
    appendRobotMessage(sessionId, robotId, '')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const dataStr = trimmed.slice(5).trim()
        if (dataStr === '[DONE]') continue

        try {
          const parsed = JSON.parse(dataStr)
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) {
            accumulated += delta
            updateRobotMessage(sessionId, robotId, accumulated)
          }
        } catch {
          // 跳过无法解析的行
        }
      }
    }

    // 流结束时若内容为空，写入兜底提示
    if (!accumulated) {
      updateRobotMessage(sessionId, robotId, '（AI 未返回内容，请点击重试）')
    }
  }, [appendRobotMessage, updateRobotMessage])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    if (loading) return;

    let sessionId = currentSessionIdRef.current
    if (!sessionId) {
      const newSession = generateSessionData()
      sessionId = newSession.id
      setSessions(prev => [newSession, ...prev])
      setCurrentSessionId(newSession.id)
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now()
    }

    // 更新会话消息和标题
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const newTitle = s.title === '新会话' ? generateTitle(userMessage.content) : s.title
        return {
          ...s,
          messages: [...s.messages, userMessage],
          title: newTitle,
          updatedAt: Date.now()
        }
      }
      return s
    }))

    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    // 构建上下文消息数组
    const currentSession = sessionsRef.current.find(s => s.id === sessionId)
    const contextMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...(currentSession?.messages || []).map(m => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage.content },
    ]

    const robotId = generateId()

    try {
      await streamChat(sessionId, robotId, contextMessages, controller.signal)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // 用户主动停止：保留已生成内容
        return
      }

      // 未预期的异常（如 fetch 本身抛错）：降级为本地模拟
      const replyContent = mockReply(userMessage.content)
      appendRobotMessage(sessionId, robotId, replyContent)
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [loading, streamChat, appendRobotMessage])

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
  }, [])

  const switchSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId)
  }, [])

  const clearCurrentSession = useCallback(() => {
    const sessionId = currentSessionIdRef.current
    if (!sessionId) return;
    setSessions(prev => prev.map(s => s.id === sessionId ? {
      ...s,
      messages: [],
      updatedAt: Date.now()
    } : s))
  }, [])

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (currentSessionIdRef.current === sessionId) {
      setCurrentSessionId(null)
    }
  }, [])

  /**
   * 重新生成：删除指定机器人消息，重新发送上一条用户消息
   */
  const retryMessage = useCallback(async (robotMessageId: string) => {
    if (loading) return;

    const sessionId = currentSessionIdRef.current
    if (!sessionId) return;

    const session = sessionsRef.current.find(s => s.id === sessionId)
    if (!session) return;

    const robotIdx = session.messages.findIndex(m => m.id === robotMessageId)
    if (robotIdx === -1) return;

    // 找到机器人消息前面的用户消息
    const userMsg = session.messages
      .slice(0, robotIdx)
      .reverse()
      .find(m => m.role === 'user')
    if (!userMsg) return;

    // 删除机器人消息
    setSessions(prev => prev.map(s =>
      s.id === sessionId
        ? { ...s, messages: s.messages.filter(m => m.id !== robotMessageId), updatedAt: Date.now() }
        : s
    ))

    // 重新发送
    setLoading(true)
    const controller = new AbortController()
    abortRef.current = controller

    const currentSession = sessionsRef.current.find(s => s.id === sessionId)
    const contextMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...(currentSession?.messages || [])
        .filter(m => m.id !== robotMessageId)
        .map(m => ({
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content,
        })),
    ]

    const newRobotId = generateId()

    try {
      await streamChat(sessionId, newRobotId, contextMessages, controller.signal)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const replyContent = mockReply(userMsg.content)
      appendRobotMessage(sessionId, newRobotId, replyContent)
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [loading, streamChat, appendRobotMessage])

  const setMode = useCallback((mode: ChatMode | null) => {
    setCurrentMode(mode)
  }, [])

  return {
    sessions,
    currentSessionId,
    currentMode,
    loading,
    sendMessage,
    stopGeneration,
    createNewSession,
    switchSession,
    clearCurrentSession,
    deleteSession,
    setMode,
    retryMessage,
  }
}

function mockReply(input: string) {
  if (input.includes("React")) {
    return "React 的核心是组件、状态和 props。建议你先从组件拆分开始练习。"
  }
  if (input.includes("useEffect")) {
    return "useEffect 适合处理副作用，比如请求数据、监听事件、定时器等。"
  }
  return "我现在还是一个模拟 AI，后续可以接入真实大模型接口。"
}
