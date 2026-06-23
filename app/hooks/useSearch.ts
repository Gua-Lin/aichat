'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useChatStore } from '../stores/useChatStore'
import { searchMessages, type SearchResult } from '../lib/searchUtils'

export interface UseSearchReturn {
  results: SearchResult[]
  keyword: string
  setKeyword: (kw: string) => void
  isSearching: boolean
  clearSearch: () => void
}

/**
 * 全局消息搜索 Hook
 * - 订阅 useChatStore 的 sessions
 * - 300ms 防抖后执行搜索
 * - 返回搜索结果和关键词控制
 */
export function useSearch(): UseSearchReturn {
  const sessions = useChatStore(s => s.sessions)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 300ms 防抖
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedKeyword(keyword)
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [keyword])

  const results = useMemo(
    () => searchMessages(sessions, debouncedKeyword),
    [sessions, debouncedKeyword],
  )

  const isSearching = debouncedKeyword.trim().length > 0

  const clearSearch = () => {
    setKeyword('')
    setDebouncedKeyword('')
  }

  return { results, keyword, setKeyword, isSearching, clearSearch }
}
