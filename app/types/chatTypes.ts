export type ChatRole = 'user' | 'robot';


export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: number
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

