import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { FavoriteItem } from '../types/chatTypes'
import { useChatStore } from './useChatStore'

// ==================== Store 类型定义 ====================

interface FavoriteStoreState {
  /** 所有收藏条目 */
  favorites: FavoriteItem[]

  /** 检查某条消息是否已收藏 */
  isFavorited: (messageId: string) => boolean
  /** 切换收藏状态（收藏/取消收藏） */
  toggleFavorite: (sessionId: string, messageId: string) => void
  /** 删除指定收藏条目 */
  removeFavorite: (favoriteId: string) => void
  /** 搜索收藏内容 */
  searchFavorites: (keyword: string) => FavoriteItem[]
}

// ==================== Zustand Store ====================

export const useFavoriteStore = create<FavoriteStoreState>()(
  persist(
    (set, get) => ({
      favorites: [],

      isFavorited: (messageId: string) => {
        return get().favorites.some(f => f.messageId === messageId)
      },

      toggleFavorite: (sessionId: string, messageId: string) => {
        const { favorites } = get()
        const existing = favorites.find(f => f.messageId === messageId)

        if (existing) {
          // 取消收藏：从列表移除 + 更新消息的 favorited 标记
          set({ favorites: favorites.filter(f => f.messageId !== messageId) })
          useChatStore.getState().updateSessions(
            sessions => sessions.map(s =>
              s.id === sessionId
                ? {
                    ...s,
                    messages: s.messages.map(m =>
                      m.id === messageId ? { ...m, favorited: false } : m
                    ),
                  }
                : s
            )
          )
        } else {
          // 收藏：从 chatStore 查找消息内容，创建快照
          const sessions = useChatStore.getState().sessions
          const session = sessions.find(s => s.id === sessionId)
          if (!session) return

          const message = session.messages.find(m => m.id === messageId)
          if (!message) return

          // 找到该机器人消息前面的用户问题
          const msgIndex = session.messages.findIndex(m => m.id === messageId)
          const userQuestion = session.messages
            .slice(0, msgIndex)
            .reverse()
            .find(m => m.role === 'user')?.content || ''

          const favoriteItem: FavoriteItem = {
            id: uuidv4(),
            sessionId,
            sessionTitle: session.title,
            messageId,
            content: message.content,
            userQuestion,
            createdAt: Date.now(),
          }

          set({ favorites: [favoriteItem, ...favorites] })

          // 更新消息的 favorited 标记
          useChatStore.getState().updateSessions(
            sessions => sessions.map(s =>
              s.id === sessionId
                ? {
                    ...s,
                    messages: s.messages.map(m =>
                      m.id === messageId ? { ...m, favorited: true } : m
                    ),
                  }
                : s
            )
          )
        }
      },

      removeFavorite: (favoriteId: string) => {
        const { favorites } = get()
        const item = favorites.find(f => f.id === favoriteId)
        if (!item) return

        set({ favorites: favorites.filter(f => f.id !== favoriteId) })

        // 同步更新消息的 favorited 标记
        useChatStore.getState().updateSessions(
          sessions => sessions.map(s =>
            s.id === item.sessionId
              ? {
                  ...s,
                  messages: s.messages.map(m =>
                    m.id === item.messageId ? { ...m, favorited: false } : m
                  ),
                }
              : s
          )
        )
      },

      searchFavorites: (keyword: string) => {
        const { favorites } = get()
        if (!keyword.trim()) return favorites

        const kw = keyword.toLowerCase()
        return favorites.filter(f =>
          f.content.toLowerCase().includes(kw) ||
          f.userQuestion.toLowerCase().includes(kw) ||
          f.sessionTitle.toLowerCase().includes(kw)
        )
      },
    }),
    {
      name: 'chat_favorites',
      partialize: (state) => ({ favorites: state.favorites }),
    }
  )
)
