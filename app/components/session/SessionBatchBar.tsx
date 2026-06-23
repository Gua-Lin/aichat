'use client'

import { Button } from 'antd'
import { DeleteOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons'

interface Props {
  selectedCount: number
  onSelectAll: () => void
  onBatchDelete: () => void
  onExit: () => void
}

/**
 * 批量操作栏
 * 多选模式时显示在会话列表顶部
 */
export default function SessionBatchBar({
  selectedCount,
  onSelectAll,
  onBatchDelete,
  onExit,
}: Props) {
  return (
    <div className="session-batch-bar">
      <div className="session-batch-left">
        <Button
          type="link"
          size="small"
          icon={<CheckOutlined />}
          onClick={onSelectAll}
          className="session-batch-btn"
        >
          全选
        </Button>
        <span className="session-batch-count">
          已选 {selectedCount} 项
        </span>
      </div>
      <div className="session-batch-right">
        <Button
          type="primary"
          danger
          size="small"
          icon={<DeleteOutlined />}
          disabled={selectedCount === 0}
          onClick={() => {
            if (confirm(`确定要删除选中的 ${selectedCount} 个对话吗？`)) {
              onBatchDelete()
            }
          }}
        >
          删除
        </Button>
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={onExit}
          className="session-batch-btn"
        >
          取消
        </Button>
      </div>
    </div>
  )
}
