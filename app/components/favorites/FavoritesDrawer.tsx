'use client'

import { useState, useMemo } from 'react'
import { Drawer, Input, Empty, Tag, Tooltip, Popconfirm } from 'antd'
import { SearchOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons'
import { useFavoriteStore } from '../../stores/useFavoriteStore'
import type { FavoriteItem } from '../../types/chatTypes'

interface Props {
  visible: boolean
  onClose: () => void
  onJumpToMessage?: (sessionId: string, messageId: string) => void
}

/**
 * 收藏夹抽屉
 * - 搜索收藏内容
 * - 按会话分组展示
 * - 点击跳转到原消息
 * - 取消收藏
 */
export default function FavoritesDrawer({ visible, onClose, onJumpToMessage }: Props) {
  const favorites = useFavoriteStore(s => s.favorites)
  const searchFavorites = useFavoriteStore(s => s.searchFavorites)
  const removeFavorite = useFavoriteStore(s => s.removeFavorite)

  const [keyword, setKeyword] = useState('')

  const filteredList = useMemo(() => searchFavorites(keyword), [searchFavorites, keyword, favorites])

  // 按会话分组
  const grouped = useMemo(() => {
    const map = new Map<string, { sessionTitle: string; items: FavoriteItem[] }>()
    for (const item of filteredList) {
      const existing = map.get(item.sessionId)
      if (existing) {
        existing.items.push(item)
      } else {
        map.set(item.sessionId, { sessionTitle: item.sessionTitle, items: [item] })
      }
    }
    return Array.from(map.entries())
  }, [filteredList])

  const handleJump = (item: FavoriteItem) => {
    onJumpToMessage?.(item.sessionId, item.messageId)
    onClose()
  }

  const handleRemove = (favoriteId: string) => {
    removeFavorite(favoriteId)
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <Drawer
      title={`收藏夹 (${favorites.length})`}
      open={visible}
      onClose={() => { onClose(); setKeyword('') }}
      width={400}
      className="favorites-drawer"
    >
      {/* 搜索 */}
      <Input
        placeholder="搜索收藏内容..."
        prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
        value={keyword}
        onChange={e => setKeyword(e.target.value)}
        allowClear
        className="favorites-search"
        style={{ marginBottom: 16 }}
      />

      {grouped.length === 0 ? (
        <Empty
          description={keyword ? '没有找到匹配的收藏' : '暂无收藏内容'}
          style={{ padding: '40px 0' }}
        />
      ) : (
        <div className="favorites-list">
          {grouped.map(([sessionId, group]) => (
            <div key={sessionId} className="favorites-group">
              <div className="favorites-group-title">
                <MessageOutlined style={{ marginRight: 6 }} />
                {group.sessionTitle}
                <Tag style={{ marginLeft: 8 }} color="blue">{group.items.length}</Tag>
              </div>

              {group.items.map(item => (
                <div key={item.id} className="favorites-item">
                  {/* 用户问题 */}
                  {item.userQuestion && (
                    <div className="favorites-item-question">
                      <span className="favorites-item-q-icon">Q</span>
                      {item.userQuestion.length > 60
                        ? item.userQuestion.slice(0, 60) + '...'
                        : item.userQuestion}
                    </div>
                  )}

                  {/* 收藏内容预览 */}
                  <div
                    className="favorites-item-content"
                    onClick={() => handleJump(item)}
                    title="点击跳转到原消息"
                  >
                    {item.content.length > 150
                      ? item.content.slice(0, 150) + '...'
                      : item.content}
                  </div>

                  {/* 底部操作 */}
                  <div className="favorites-item-footer">
                    <span className="favorites-item-date">{formatDate(item.createdAt)}</span>
                    <div className="favorites-item-actions">
                      <Tooltip title="跳转到原消息">
                        <button
                          className="favorites-action-btn"
                          onClick={() => handleJump(item)}
                        >
                          查看
                        </button>
                      </Tooltip>
                      <Popconfirm
                        title="确定取消收藏？"
                        onConfirm={() => handleRemove(item.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <button className="favorites-action-btn favorites-action-danger">
                          <DeleteOutlined />
                        </button>
                      </Popconfirm>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Drawer>
  )
}
