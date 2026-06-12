import { useState , useEffect , useCallback , useRef } from "react"
import type { ChatMessage , ChatSession , ChatMode } from "../types/chatTypes"
import { v4 as uuidv4 } from 'uuid';

//声明用作localStorage的key，避免硬编码字符串，方便维护和修改
const STORAGE_KEY = 'chat_sessions'

//生成唯一ID的函数，使用uuid库生成随机ID，确保每条消息和会话都有唯一标识
function generateId() : string {
  return uuidv4();
}

//根据用户消息内容生成会话标题的函数，截取前20个字符作为标题，如果内容较长则添加省略号
function generateTitle(content: string) : string {
    return content.length > 20 ? content.substring(0, 20) + '...' : content
}

export function useChatStore() {
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [currentMode, setCurrentMode] = useState<ChatMode | null>(null)
    const [loading, setLoading] = useState(false)

    const currentSessionIdRef = useRef(currentSessionId)
    const currentModeRef = useRef(currentMode)
    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        currentModeRef.current = currentMode
    }, [currentMode])

    useEffect(() => {
                currentSessionIdRef.current = currentSessionId
        }, [currentSessionId])

    //加载本地存储的聊天记录
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

    //seesions变化时，保存聊天记录到本地存储
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
        }else {
            localStorage.removeItem(STORAGE_KEY)
        }
    }, [sessions])

    const generateSessionData = ():ChatSession =>(
        {
            id: generateId(),
            title: '新会话',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        }

    )

        //如果没有当前会话，创建一个新的会话
    const createNewSession = useCallback(() => {
        const newSession = generateSessionData() 
        setSessions(prev => [newSession, ...prev])
        setCurrentSessionId(newSession.id)    
        return newSession.id;    
    }, [])

    const sendMessage = useCallback(async(content: string) => {
    if(!content.trim()) return;

    // 如果正在生成，不允许重复发送
    if (loading) return;

    //创建用户消息对象
    let sessionId = currentSessionIdRef.current

    if (!sessionId) {
        const newSession= generateSessionData()
        sessionId = newSession.id
        //批量更新State
        setSessions(prev => [newSession, ...prev])
        setCurrentSessionId(newSession.id)
    }

    const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content:content.trim(),
        timestamp: Date.now()
    }

    // 更新会话消息和标题（使用函数式更新）
    setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
            const newTitle = s.title === '新会话'?generateTitle(userMessage.content):s.title
            const updatedMessages = [...s.messages, userMessage]
            return {
                ...s,
                messages: updatedMessages,
                title: newTitle,
                updatedAt: Date.now()
            }
        }
        return s
    }))

    setLoading(true)

    // 创建 AbortController 用于停止生成
    const controller = new AbortController()
    abortRef.current = controller

    try {
        // 模拟异步请求，支持中断
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(resolve, 500)
            controller.signal.addEventListener('abort', () => {
                clearTimeout(timer)
                reject(new DOMException('Aborted', 'AbortError'))
            })
        })

        let replyContent = mockReply(userMessage.content, currentModeRef.current)

        const robotMessage: ChatMessage = {
            id: generateId(),
            role: 'robot',
            content: replyContent,
            timestamp: Date.now()
        }

        setSessions(prev => prev.map(s => s.id === sessionId ? {
            ...s,
            messages: [...s.messages, robotMessage],
            updatedAt: Date.now()
        } : s))
    } catch (err: unknown) {
        // 用户主动停止 — 不添加机器人消息，只结束 loading
        if (err instanceof DOMException && err.name === 'AbortError') {
            // 什么都不做，用户主动停止了
        }
    } finally {
        setLoading(false)
        abortRef.current = null
    }

}, [loading])

    const stopGeneration = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort()
        }
    }, [])

    //切换会话
    const switchSession = useCallback((sessionId: string) => {
        setCurrentSessionId(sessionId)
    }, [])

    //清空当前会话消息
    const clearCurrentSession = useCallback(() => {
        const sessionId = currentSessionIdRef.current
        if (!sessionId) return;
        setSessions(prev => prev.map(s => s.id === sessionId ? {
            ...s,
            messages: [],
            updatedAt: Date.now()
        } : s))
    }, [])

    //删除会话
    const deleteSession = useCallback((sessionId: string) => {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        if (currentSessionIdRef.current === sessionId) {
            setCurrentSessionId(null)
        }
    }, [])


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
    }
}


function mockReply(input: string, mode: ChatMode | null) {
   if (input.includes("React")) {
   return "React 的核心是组件、状态和 props。建议你先从组件拆分开始练习。"
 }

 if (input.includes("useEffect")) {
   return "useEffect 适合处理副作用，比如请求数据、监听事件、定时器等。"
 }

 return "我现在还是一个模拟 AI，后续可以接入真实大模型接口。"
}