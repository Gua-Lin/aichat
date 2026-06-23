'use client'

import { useState } from 'react'
import {
  PushpinFilled,
  MessageOutlined,
  InboxOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons'
import type { ChatSession } from '../../types/chatTypes'
import SessionItem from './SessionItem'

interface Props {
  /** 分组标题 */
  title: string
  /** 分组图标 */
  icon: 'pinned' | 'normal' | 'archived'
  /** 该分组下的会话列表 */
  sessions: ChatSession[]
  /** 当前选中会话 ID */
  currentSessionId: string | null
  /** 是否批量模式 */
  isBatchMode: boolean
  /** 已选中 ID 集合 */
  selectedIds: Set<string>
  /** 是否默认折叠 */
  defaultCollapsed?: boolean
  /** 事件回调 */
  onSelect: (sessionId: string) => void
  onToggleSelect: (sessionId: string) => void
  onRename: (sessionId: string, newTitle: string) => void
  onTogglePin: (sessionId: string) => void
  onToggleArchive: (sessionId: string) => void
  onDelete: (sessionId: string) => void
}

const ICON_MAP = {
  pinned: <PushpinFilled />,
  normal: <MessageOutlined />,
  archived: <InboxOutlined />,
}

/**
 * 会话分组容器
 * 支持折叠/展开（归档组默认折叠）
 */
export default function SessionGroup({
  title,
  icon,
  sessions,
  currentSessionId,
  isBatchMode,
  selectedIds,
  defaultCollapsed = false,
  onSelect,
  onToggleSelect,
  onRename,
  onTogglePin,
  onToggleArchive,
  onDelete,
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  if (sessions.length === 0) return null

  return (
    <div className="session-group">
      <div className="session-group-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="session-group-icon">{ICON_MAP[icon]}</span>
        <span className="session-group-title">{title}</span>
        <span className="session-group-count">({sessions.length})</span>
        <span className="session-group-arrow">
          {collapsed ? <RightOutlined /> : <DownOutlined />}
        </span>
      </div>
      {!collapsed && (
        <div className="session-group-items">
          {sessions.map(session => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={currentSessionId === session.id}
              isBatchMode={isBatchMode}
              isSelected={selectedIds.has(session.id)}
              onSelect={onSelect}
              onToggleSelect={onToggleSelect}
              onRename={onRename}
              onTogglePin={onTogglePin}
              onToggleArchive={onToggleArchive}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
