/**
 * 搜索工具函数
 * - searchMessages: 在所有会话中搜索消息
 * - highlightText: 提取匹配片段并高亮
 */

import type { ChatSession, ChatRole } from '../types/chatTypes'

/** 搜索结果条目 */
export interface SearchResult {
  sessionId: string
  sessionTitle: string
  messageId: string
  content: string
  matchedText: string
  contextBefore: string
  contextAfter: string
  role: ChatRole
  timestamp: number
}

/**
 * 在所有会话的消息中搜索关键词
 * @param sessions 会话列表
 * @param keyword 搜索关键词（不区分大小写）
 * @returns 按时间倒序排列的搜索结果
 */
export function searchMessages(
  sessions: ChatSession[],
  keyword: string,
): SearchResult[] {
  if (!keyword.trim()) return []

  const kw = keyword.toLowerCase()
  const results: SearchResult[] = []

  for (const session of sessions) {
    for (const msg of session.messages) {
      const lower = msg.content.toLowerCase()
      let startIdx = lower.indexOf(kw)

      while (startIdx !== -1) {
        const endIdx = startIdx + kw.length
        const contextRange = 40 // 前后各取 40 字符作为上下文

        const contextBefore = msg.content.slice(Math.max(0, startIdx - contextRange), startIdx)
        const matchedText = msg.content.slice(startIdx, endIdx)
        const contextAfter = msg.content.slice(endIdx, endIdx + contextRange)

        results.push({
          sessionId: session.id,
          sessionTitle: session.title,
          messageId: msg.id,
          content: msg.content,
          matchedText,
          contextBefore,
          contextAfter,
          role: msg.role,
          timestamp: msg.timestamp,
        })

        // 继续查找后续匹配（同一消息可能多次命中）
        startIdx = lower.indexOf(kw, endIdx)
      }
    }
  }

  // 按时间倒序（最近的在前）
  results.sort((a, b) => b.timestamp - a.timestamp)
  return results
}

/**
 * 高亮文本片段提取
 * 返回 before / match / after 三段，用于渲染高亮
 */
export function highlightText(
  text: string,
  keyword: string,
): { before: string; match: string; after: string } {
  if (!keyword.trim()) return { before: '', match: '', after: text }

  const idx = text.toLowerCase().indexOf(keyword.toLowerCase())
  if (idx === -1) return { before: text, match: '', after: '' }

  return {
    before: text.slice(0, idx),
    match: text.slice(idx, idx + keyword.length),
    after: text.slice(idx + keyword.length),
  }
}
