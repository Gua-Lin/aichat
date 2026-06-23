'use client'

import { Badge, Button } from 'antd'
import { PlayCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { PromptTemplate } from '../../types/chatTypes'

interface Props {
  template: PromptTemplate
  onUse: (id: string) => void
  onEdit?: (template: PromptTemplate) => void
  onDelete?: (id: string) => void
}

/**
 * 模板卡片
 * - 展示图标、名称、描述、使用次数
 * - 内置模板不可删除/编辑
 * - 自建模板可编辑/删除
 */
export default function TemplateCard({ template, onUse, onEdit, onDelete }: Props) {
  const isCustom = template.source === 'custom'

  return (
    <div className="template-card">
      <div className="template-card-header">
        <span className="template-card-icon">{template.icon}</span>
        <span className="template-card-name">{template.name}</span>
        {isCustom && <Badge count="自建" style={{ backgroundColor: 'var(--primary)', fontSize: 10 }} />}
      </div>
      <p className="template-card-desc">{template.description}</p>
      <div className="template-card-footer">
        <span className="template-card-count">使用 {template.usageCount} 次</span>
        <div className="template-card-actions">
          <Button
            type="primary"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => onUse(template.id)}
          >
            使用
          </Button>
          {isCustom && onEdit && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(template)}
            />
          )}
          {isCustom && onDelete && (
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                if (confirm(`确定要删除模板「${template.name}」吗？`)) {
                  onDelete(template.id)
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
