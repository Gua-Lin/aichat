'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SessionItem from './SessionItem'
import type { ChatSession } from '../../types/chatTypes'

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
 * 可拖拽的 SessionItem 包装器
 * 使用 @dnd-kit/sortable 的 useSortable Hook
 */
export default function SortableSessionItem(props: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.session.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto' as const,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SessionItem {...props} />
    </div>
  )
}
