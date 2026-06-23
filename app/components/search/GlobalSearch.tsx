'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Modal, Input, Empty } from 'antd'
import { SearchOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useChatStore } from '../../stores/useChatStore'
import { searchMessages, highlightText } from '../../lib/searchUtils'
import type { SearchResult } from '../../lib/searchUtils'

interface Props {
  visible: boolean
  onClose: () => void
  onJumpToMessage: (sessionId: string, messageId: string) => void
}

/**
 * 全局消息搜索弹层
 * - Ctrl+K 快捷键唤起
 * - 实时搜索所有会话消息
 * - 点击结果跳转到对应会话
 */
export default function GlobalSearch({ visible, onClose, onJumpToMessage }: Props) {
  const sessions = useChatStore(s => s.sessions)
  const switchSession = useChatStore(s => s.switchSession)
  const [keyword, setKeyword] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // 搜索（无防抖，弹层内每次输入立即响应）
  const results = useMemo(
    () => searchMessages(sessions, keyword),
    [sessions, keyword],
  )

  // 按会话分组
  const groupedResults = useMemo(() => {
    const groups = new Map<string, { sessionTitle: string; items: SearchResult[] }>()
    for (const r of results) {
      if (!groups.has(r.sessionId)) {
        groups.set(r.sessionId, { sessionTitle: r.sessionTitle, items: [] })
      }
      groups.get(r.sessionId)!.items.push(r)
    }
    return Array.from(groups.entries())
  }, [results])

  // 关闭时清空搜索
  useEffect(() => {
    if (!visible) {
      setKeyword('')
      setSelectedIndex(0)
    }
  }, [visible])

  // 点击结果跳转
  const handleSelect = useCallback((sessionId: string, messageId: string) => {
    switchSession(sessionId)
    onJumpToMessage(sessionId, messageId)
    onClose()
  }, [switchSession, onJumpToMessage, onClose])

  // 键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      const r = results[selectedIndex]
      handleSelect(r.sessionId, r.messageId)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [results, selectedIndex, handleSelect, onClose])

  // 扁平化结果索引
  let flatIndex = -1

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={560}
      centered
      className="global-search-modal"
      destroyOnHidden
    >
      <div className="global-search-container">
        <Input
          autoFocus
          placeholder="搜索所有会话消息..."
          prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
          suffix={
            keyword ? (
              <CloseCircleOutlined
                style={{ color: 'var(--text-tertiary)', cursor: 'pointer' }}
                onClick={() => setKeyword('')}
              />
            ) : null
          }
          value={keyword}
          onChange={e => {
            setKeyword(e.target.value)
            setSelectedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          className="global-search-input"
          size="large"
        />

        <div className="global-search-results">
          {keyword.trim() && results.length === 0 && (
            <Empty description="未找到匹配的消息" style={{ padding: '24px 0' }} />
          )}

          {groupedResults.map(([sessionId, group]) => (
            <div key={sessionId} className="global-search-group">
              <div className="global-search-group-title">
                📂 {group.sessionTitle}
              </div>
              {group.items.map((item) => {
                flatIndex++
                const idx = flatIndex
                const hl = highlightText(
                  item.contextBefore + item.matchedText + item.contextAfter,
                  keyword,
                )
                return (
                  <div
                    key={`${item.messageId}-${idx}`}
                    className={`global-search-item ${idx === selectedIndex ? 'global-search-item-active' : ''}`}
                    onClick={() => handleSelect(item.sessionId, item.messageId)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <span className="global-search-item-role">
                      {item.role === 'user' ? '👤' : '🤖'}
                    </span>
                    <span className="global-search-item-text">
                      {item.contextBefore && <span>...</span>}
                      <span>{hl.before}</span>
                      {hl.match && (
                        <mark className="global-search-highlight">{hl.match}</mark>
                      )}
                      <span>{hl.after}</span>
                      {item.contextAfter && <span>...</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}

          {!keyword.trim() && (
            <div className="global-search-hint">
              输入关键词搜索所有会话中的消息内容
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
