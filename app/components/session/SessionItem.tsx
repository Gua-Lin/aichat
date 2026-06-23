'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button, Input, Dropdown, Checkbox } from 'antd'
import {
  DeleteOutlined,
  PushpinOutlined,
  PushpinFilled,
  InboxOutlined,
  EditOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import type { ChatSession } from '../../types/chatTypes'
import type { MenuProps } from 'antd'

interface Props {
  session: ChatSession
  isActive: boolean
  isBatchMode: boolean
  isSelected: boolean
  onSelect: (sessionId: string) => void
  onToggleSelect: (sessionId: string) => void
  onRename: (sessionId: string, newTitle: string) => void
  onTogglePin: (sessionId: string) => void
  onToggleArchive: (sessionId: string) => void
  onDelete: (sessionId: string) => void
}

/**
 * 单个会话项
 * - 双击标题 → 内联编辑
 * - 右键菜单 → 重命名/置顶/归档/删除
 * - 批量模式下显示 checkbox
 * - Ctrl+Click → 多选
 */
export default function SessionItem({
  session,
  isActive,
  isBatchMode,
  isSelected,
  onSelect,
  onToggleSelect,
  onRename,
  onTogglePin,
  onToggleArchive,
  onDelete,
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(session.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // 双击进入编辑
  const handleDoubleClick = useCallback(() => {
    setEditTitle(session.title)
    setIsEditing(true)
  }, [session.title])

  // 保存标题
  const handleSave = useCallback(() => {
    setIsEditing(false)
    if (editTitle.trim() && editTitle.trim() !== session.title) {
      onRename(session.id, editTitle.trim())
    }
  }, [editTitle, session.id, session.title, onRename])

  // 点击会话
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isBatchMode) {
      onToggleSelect(session.id)
    } else if (e.ctrlKey || e.metaKey) {
      onToggleSelect(session.id)
    } else {
      onSelect(session.id)
    }
  }, [isBatchMode, session.id, onSelect, onToggleSelect])

  // 右键菜单
  const contextMenuItems: MenuProps['items'] = [
    {
      key: 'rename',
      icon: <EditOutlined />,
      label: '重命名',
      onClick: () => {
        setEditTitle(session.title)
        setIsEditing(true)
      },
    },
    {
      key: 'pin',
      icon: session.pinned ? <PushpinFilled /> : <PushpinOutlined />,
      label: session.pinned ? '取消置顶' : '置顶',
      onClick: () => onTogglePin(session.id),
    },
    {
      key: 'archive',
      icon: <InboxOutlined />,
      label: session.archived ? '取消归档' : '归档',
      onClick: () => onToggleArchive(session.id),
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => {
        if (confirm('确定要删除这个对话吗？')) {
          onDelete(session.id)
        }
      },
    },
  ]

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div
        className={`session-item ${isActive ? 'session-item-active' : ''} ${
          isSelected ? 'session-item-selected' : ''
        }`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        data-session-id={session.id}
      >
        {/* 批量模式 checkbox */}
        {isBatchMode && (
          <Checkbox
            checked={isSelected}
            onClick={e => e.stopPropagation()}
            onChange={() => onToggleSelect(session.id)}
            className="session-item-checkbox"
          />
        )}

        <div className="session-item-content">
          {isEditing ? (
            <Input
              ref={inputRef as never}
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={handleSave}
              onPressEnter={handleSave}
              size="small"
              className="session-item-edit-input"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div className="session-item-title">
              {session.pinned && <PushpinFilled className="session-item-pin-icon" />}
              <span className="session-item-title-text">{session.title}</span>
            </div>
          )}
          <div className="session-item-desc">
            {session.messages.length} 条消息
          </div>
        </div>

        {/* hover 操作按钮（非编辑态） */}
        {!isEditing && !isBatchMode && (
          <div className="session-item-actions">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              className="session-item-delete-btn"
              onClick={e => {
                e.stopPropagation()
                if (confirm('确定要删除这个对话吗？')) {
                  onDelete(session.id)
                }
              }}
            />
          </div>
        )}
      </div>
    </Dropdown>
  )
}
