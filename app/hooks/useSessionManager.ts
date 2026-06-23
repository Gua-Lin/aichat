'use client'

import { useState, useMemo, useCallback } from 'react'
import { useChatStore } from '../stores/useChatStore'
import type { ChatSession } from '../types/chatTypes'

export interface UseSessionManagerReturn {
  /** 过滤+排序后的展示列表（置顶在前、非归档、搜索过滤后） */
  displaySessions: ChatSession[]
  /** 置顶会话列表 */
  pinnedSessions: ChatSession[]
  /** 普通会话列表（非置顶、非归档） */
  normalSessions: ChatSession[]
  /** 已归档会话列表 */
  archivedSessions: ChatSession[]

  // --- 搜索 ---
  searchKeyword: string
  setSearchKeyword: (kw: string) => void

  // --- 会话操作 ---
  renameSession: (sessionId: string, newTitle: string) => void
  togglePin: (sessionId: string) => void
  toggleArchive: (sessionId: string) => void

  // --- 拖拽排序 ---
  reorderSessions: (activeId: string, overId: string) => void

  // --- 批量模式 ---
  isBatchMode: boolean
  enterBatchMode: () => void
  exitBatchMode: () => void
  selectedIds: Set<string>
  toggleSelect: (sessionId: string) => void
  selectAll: () => void
  batchDelete: () => void
}

/**
 * 会话管理计算型 Hook
 * - 订阅 useChatStore 的 sessions
 * - 提供列表 UI 操作（重命名/置顶/归档/排序/批量）
 * - 操作结果写回 chatStore
 */
export function useSessionManager(): UseSessionManagerReturn {
  const sessions = useChatStore(s => s.sessions)
  const updateSessions = useChatStore(s => s.updateSessions)
  const deleteSession = useChatStore(s => s.deleteSession)
  const currentSessionId = useChatStore(s => s.currentSessionId)

  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState('')

  // 批量模式
  const [isBatchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ==================== 过滤 + 排序 ====================

  const filteredSessions = useMemo(() => {
    let list = sessions

    // 搜索过滤（标题 + 消息内容）
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase()
      list = list.filter(s =>
        s.title.toLowerCase().includes(kw) ||
        s.messages.some(m => m.content.toLowerCase().includes(kw))
      )
    }

    // 按 sortOrder 排序（有值的在前），同组按 updatedAt 降序
    return [...list].sort((a, b) => {
      const sa = a.sortOrder ?? 0
      const sb = b.sortOrder ?? 0
      if (sa !== sb) return sb - sa
      return b.updatedAt - a.updatedAt
    })
  }, [sessions, searchKeyword])

  const pinnedSessions = useMemo(
    () => filteredSessions.filter(s => s.pinned && !s.archived),
    [filteredSessions],
  )

  const normalSessions = useMemo(
    () => filteredSessions.filter(s => !s.pinned && !s.archived),
    [filteredSessions],
  )

  const archivedSessions = useMemo(
    () => filteredSessions.filter(s => s.archived),
    [filteredSessions],
  )

  const displaySessions = useMemo(
    () => [...pinnedSessions, ...normalSessions, ...archivedSessions],
    [pinnedSessions, normalSessions, archivedSessions],
  )

  // ==================== 会话操作 ====================

  const renameSession = useCallback((sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    updateSessions(sessions =>
      sessions.map(s =>
        s.id === sessionId
          ? { ...s, title: newTitle.trim(), titleGenerated: false, updatedAt: Date.now() }
          : s
      )
    )
  }, [updateSessions])

  const togglePin = useCallback((sessionId: string) => {
    updateSessions(sessions =>
      sessions.map(s =>
        s.id === sessionId
          ? { ...s, pinned: !s.pinned, updatedAt: Date.now() }
          : s
      )
    )
  }, [updateSessions])

  const toggleArchive = useCallback((sessionId: string) => {
    updateSessions(sessions =>
      sessions.map(s =>
        s.id === sessionId
          ? { ...s, archived: !s.archived, pinned: s.archived ? s.pinned : false, updatedAt: Date.now() }
          : s
      )
    )
  }, [updateSessions])

  // ==================== 拖拽排序 ====================

  const reorderSessions = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return
    updateSessions(sessions => {
      const list = [...sessions]
      const activeIdx = list.findIndex(s => s.id === activeId)
      const overIdx = list.findIndex(s => s.id === overId)
      if (activeIdx === -1 || overIdx === -1) return sessions

      const [moved] = list.splice(activeIdx, 1)
      list.splice(overIdx, 0, moved)

      // 重新计算 sortOrder（从大到小，第一个最大）
      return list.map((s, idx) => ({
        ...s,
        sortOrder: list.length - idx,
      }))
    })
  }, [updateSessions])

  // ==================== 批量模式 ====================

  const enterBatchMode = useCallback(() => {
    setBatchMode(true)
    setSelectedIds(new Set())
  }, [])

  const exitBatchMode = useCallback(() => {
    setBatchMode(false)
    setSelectedIds(new Set())
  }, [])

  const toggleSelect = useCallback((sessionId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    // 选中所有非归档的可见会话
    const visibleIds = [...pinnedSessions, ...normalSessions].map(s => s.id)
    setSelectedIds(new Set(visibleIds))
  }, [pinnedSessions, normalSessions])

  const batchDelete = useCallback(() => {
    if (selectedIds.size === 0) return
    selectedIds.forEach(id => deleteSession(id))
    exitBatchMode()
  }, [selectedIds, deleteSession, exitBatchMode])

  return {
    displaySessions,
    pinnedSessions,
    normalSessions,
    archivedSessions,
    searchKeyword,
    setSearchKeyword,
    renameSession,
    togglePin,
    toggleArchive,
    reorderSessions,
    isBatchMode,
    enterBatchMode,
    exitBatchMode,
    selectedIds,
    toggleSelect,
    selectAll,
    batchDelete,
  }
}
