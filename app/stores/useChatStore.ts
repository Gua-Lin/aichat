import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage, ChatSession, ChatMode, ChatErrorType } from '../types/chatTypes'
import { v4 as uuidv4 } from 'uuid'

/** 单次请求最大重试次数（网络抖动时自动重试） */
const MAX_RETRIES = 1

function generateId(): string {
  return uuidv4()
}

function generateTitle(content: string): string {
  return content.length > 20 ? content.substring(0, 20) + '...' : content
}

/** 模块级 abort 控制器（非 React 状态，不需要持久化） */
let abortController: AbortController | null = null

// ==================== Store 类型定义 ====================

interface ChatStoreState {
  // === State ===
  sessions: ChatSession[]
  currentSessionId: string | null
  currentMode: ChatMode | null
  loading: boolean

  // === Actions ===
  sendMessage: (content: string) => Promise<void>
  stopGeneration: () => void
  retryMessage: (robotMessageId: string) => Promise<void>
  createNewSession: () => string
  switchSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  clearCurrentSession: () => void
  setMode: (mode: ChatMode | null) => void

  /** V5: 外部批量更新 sessions（供 useSessionManager 调用） */
  updateSessions: (updater: (prev: ChatSession[]) => ChatSession[]) => void

  /** 内部：将机器人消息写入会话 */
  appendRobotMessage: (sessionId: string, robotId: string, content: string, error?: ChatMessage['error']) => void
  /** 内部：更新指定机器人消息内容（流式追加） */
  updateRobotMessage: (sessionId: string, robotId: string, content: string) => void
  /** 内部：核心流式请求，支持重试 */
  streamChat: (
    sessionId: string,
    robotId: string,
    contextMessages: { role: 'user' | 'assistant'; content: string }[],
    signal: AbortSignal,
    retryCount?: number,
  ) => Promise<void>
}

// ==================== Zustand Store ====================

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      // --- 初始状态 ---
      sessions: [],
      currentSessionId: null,
      currentMode: null,
      loading: false,

      // --- 会话 CRUD ---

      createNewSession: () => {
        const newSession: ChatSession = {
          id: generateId(),
          title: '新会话',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set(state => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newSession.id,
        }))
        return newSession.id
      },

      switchSession: (sessionId: string) => {
        set({ currentSessionId: sessionId })
      },

      deleteSession: (sessionId: string) => {
        const { currentSessionId } = get()
        set(state => ({
          sessions: state.sessions.filter(s => s.id !== sessionId),
          currentSessionId: currentSessionId === sessionId ? null : currentSessionId,
        }))
      },

      clearCurrentSession: () => {
        const { currentSessionId } = get()
        if (!currentSessionId) return
        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === currentSessionId
              ? { ...s, messages: [], updatedAt: Date.now() }
              : s
          ),
        }))
      },

      setMode: (mode: ChatMode | null) => {
        set({ currentMode: mode })
      },

      /** V5: 外部批量更新 sessions */
      updateSessions: (updater) => {
        set(state => ({ sessions: updater(state.sessions) }))
      },

      // --- 消息内部操作 ---

      /** 将机器人消息写入当前会话 */
      appendRobotMessage: (sessionId: string, robotId: string, content: string, error?: ChatMessage['error']) => {
        set(state => ({
          sessions: state.sessions.map(s =>
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
          ),
        }))
      },

      /** 更新指定机器人消息的内容（流式追加） */
      updateRobotMessage: (sessionId: string, robotId: string, content: string) => {
        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map(m =>
                    m.id === robotId ? { ...m, content } : m
                  ),
                  updatedAt: Date.now(),
                }
              : s
          ),
        }))
      },

      // --- 流式请求核心逻辑 ---

      /** 核心流式请求，支持重试 */
      streamChat: async (
        sessionId: string,
        robotId: string,
        contextMessages: { role: 'user' | 'assistant'; content: string }[],
        signal: AbortSignal,
        retryCount = 0,
      ): Promise<void> => {
        const { currentMode } = get()

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: contextMessages,
            mode: currentMode,
          }),
          signal,
        })

        if (!response.ok) {
          const errorInfo = await parseErrorResponse(response)

          // 可重试的错误 + 未用完重试次数 → 自动重试
          const retryableTypes: ChatErrorType[] = ['API_TIMEOUT', 'NETWORK_ERROR', 'API_RATE_LIMIT']
          if (retryableTypes.includes(errorInfo.type) && retryCount < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, 1000))
            return get().streamChat(sessionId, robotId, contextMessages, signal, retryCount + 1)
          }

          // 不可重试或重试用尽：写入错误消息
          get().appendRobotMessage(sessionId, robotId, '', { type: errorInfo.type, message: errorInfo.message })
          return
        }

        // SSE 流式读取
        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let accumulated = ''

        // 先插入空的机器人消息占位
        get().appendRobotMessage(sessionId, robotId, '')

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
                get().updateRobotMessage(sessionId, robotId, accumulated)
              }
            } catch {
              // 跳过无法解析的行
            }
          }
        }

        // 流结束时若内容为空，写入兜底提示
        if (!accumulated) {
          get().updateRobotMessage(sessionId, robotId, '（AI 未返回内容，请点击重试）')
        }
      },

      // --- 公开 Action ---

      sendMessage: async (content: string) => {
        const { sessions, currentSessionId, loading } = get()
        if (!content.trim() || loading) return

        let sessionId = currentSessionId
        if (!sessionId) {
          sessionId = get().createNewSession()
        }

        const userMessage: ChatMessage = {
          id: generateId(),
          role: 'user',
          content: content.trim(),
          timestamp: Date.now(),
        }

        // 更新会话消息和标题
        set(state => ({
          sessions: state.sessions.map(s => {
            if (s.id === sessionId) {
              const newTitle = s.title === '新会话' ? generateTitle(userMessage.content) : s.title
              return {
                ...s,
                messages: [...s.messages, userMessage],
                title: newTitle,
                updatedAt: Date.now(),
              }
            }
            return s
          }),
        }))

        set({ loading: true })

        const controller = new AbortController()
        abortController = controller

        // 构建上下文消息数组
        const currentSession = get().sessions.find(s => s.id === sessionId)
        const contextMessages: { role: 'user' | 'assistant'; content: string }[] = [
          ...(currentSession?.messages || []).map(m => ({
            role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user' as const, content: userMessage.content },
        ]

        const robotId = generateId()

        try {
          await get().streamChat(sessionId!, robotId, contextMessages, controller.signal)
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            // 用户主动停止：保留已生成内容
            return
          }
          // 未预期的异常：降级为本地模拟
          const replyContent = mockReply(userMessage.content)
          get().appendRobotMessage(sessionId!, robotId, replyContent)
        } finally {
          set({ loading: false })
          abortController = null
        }

        // 首轮对话完成后，异步调用 AI 标题生成（不阻塞 UI）
        const updatedSession = get().sessions.find(s => s.id === sessionId)
        const userMsgCount = updatedSession?.messages.filter(m => m.role === 'user').length || 0
        if (userMsgCount === 1 && !updatedSession?.titleGenerated) {
          const robotMsg = updatedSession?.messages.find(m => m.role === 'robot' && m.content)
          if (robotMsg?.content) {
            generateAITitle(sessionId!, userMessage.content, robotMsg.content)
          }
        }
      },

      stopGeneration: () => {
        if (abortController) {
          abortController.abort()
        }
      },

      retryMessage: async (robotMessageId: string) => {
        const { currentSessionId, sessions, loading } = get()
        if (loading || !currentSessionId) return

        const session = sessions.find(s => s.id === currentSessionId)
        if (!session) return

        const robotIdx = session.messages.findIndex(m => m.id === robotMessageId)
        if (robotIdx === -1) return

        // 找到机器人消息前面的用户消息
        const userMsg = session.messages
          .slice(0, robotIdx)
          .reverse()
          .find(m => m.role === 'user')
        if (!userMsg) return

        // 删除机器人消息
        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === currentSessionId
              ? { ...s, messages: s.messages.filter(m => m.id !== robotMessageId), updatedAt: Date.now() }
              : s
          ),
        }))

        // 重新发送
        set({ loading: true })
        const controller = new AbortController()
        abortController = controller

        const updatedSession = get().sessions.find(s => s.id === currentSessionId)
        const contextMessages: { role: 'user' | 'assistant'; content: string }[] = [
          ...(updatedSession?.messages || [])
            .filter(m => m.id !== robotMessageId)
            .map(m => ({
              role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
              content: m.content,
            })),
        ]

        const newRobotId = generateId()

        try {
          await get().streamChat(currentSessionId, newRobotId, contextMessages, controller.signal)
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === 'AbortError') return
          const replyContent = mockReply(userMsg.content)
          get().appendRobotMessage(currentSessionId, newRobotId, replyContent)
        } finally {
          set({ loading: false })
          abortController = null
        }
      },
    }),
    {
      name: 'chat_sessions',
      // 只持久化数据字段，action 不需要存储
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        currentMode: state.currentMode,
      }),
    }
  )
)

// ==================== 辅助函数 ====================

/** 解析后端返回的 JSON 错误体 */
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

/** 本地模拟回复（API 异常时的兆底降级） */
function mockReply(input: string) {
  if (input.includes('React')) {
    return 'React 的核心是组件、状态和 props。建议你先从组件拆分开始练习。'
  }
  if (input.includes('useEffect')) {
    return 'useEffect 适合处理副作用，比如请求数据、监听事件、定时器等。'
  }
  return '我现在还是一个模拟 AI，后续可以接入真实大模型接口。'
}

/**
 * 异步调用 AI 标题生成接口，失败时静默降级保留截断标题
 */
async function generateAITitle(sessionId: string, userMessage: string, assistantReply: string) {
  try {
    const res = await fetch('/api/generate-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage, assistantReply }),
    })
    if (!res.ok) return
    const data = await res.json()
    if (data.title) {
      useChatStore.getState().updateSessions(
        sessions => sessions.map(s =>
          s.id === sessionId
            ? { ...s, title: data.title, titleGenerated: true }
            : s
        )
      )
    }
  } catch {
    // 静默降级，保留截断标题
  }
}
