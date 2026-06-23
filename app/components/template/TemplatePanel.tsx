'use client'

import { useState, useMemo } from 'react'
import { Drawer, Input, Button, Empty } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import { useTemplateStore } from '../../stores/useTemplateStore'
import type { PromptTemplate, TemplateCategory } from '../../types/chatTypes'
import TemplateCard from './TemplateCard'
import TemplateForm from './TemplateForm'

const CATEGORIES: (TemplateCategory | '全部')[] = ['全部', '学习', '编程', '写作', '面试', '通用']

interface Props {
  visible: boolean
  onClose: () => void
  onUseTemplate: (systemPrompt: string) => void
}

/**
 * 模板面板抽屉
 * - 搜索 + 分类筛选
 * - 内置模板 + 自建模板
 * - 创建/编辑/删除自建模板
 */
export default function TemplatePanel({ visible, onClose, onUseTemplate }: Props) {
  const templates = useTemplateStore(s => s.templates)
  const searchKeyword = useTemplateStore(s => s.searchKeyword)
  const activeCategory = useTemplateStore(s => s.activeCategory)
  const setSearchKeyword = useTemplateStore(s => s.setSearchKeyword)
  const setActiveCategory = useTemplateStore(s => s.setActiveCategory)
  const getFilteredTemplates = useTemplateStore(s => s.getFilteredTemplates)
  const createTemplate = useTemplateStore(s => s.createTemplate)
  const updateTemplate = useTemplateStore(s => s.updateTemplate)
  const deleteTemplate = useTemplateStore(s => s.deleteTemplate)
  const useTemplate = useTemplateStore(s => s.useTemplate)

  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null)

  const filteredTemplates = useMemo(() => getFilteredTemplates(), [getFilteredTemplates, templates, searchKeyword, activeCategory])

  const handleUse = (id: string) => {
    const systemPrompt = useTemplate(id)
    if (systemPrompt) {
      onUseTemplate(systemPrompt)
      onClose()
    }
  }

  const handleEdit = (template: PromptTemplate) => {
    setEditingTemplate(template)
    setShowForm(true)
  }

  const handleSave = (data: Omit<PromptTemplate, 'id' | 'source' | 'createdAt' | 'usageCount'>) => {
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, data)
    } else {
      createTemplate(data)
    }
    setShowForm(false)
    setEditingTemplate(null)
  }

  const handleDelete = (id: string) => {
    deleteTemplate(id)
  }

  return (
    <Drawer
      title="Prompt 模板"
      open={visible}
      onClose={() => {
        onClose()
        setShowForm(false)
        setEditingTemplate(null)
      }}
      width={420}
      className="template-drawer"
    >
      {showForm ? (
        <TemplateForm
          editingTemplate={editingTemplate}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false)
            setEditingTemplate(null)
          }}
        />
      ) : (
        <div className="template-panel-content">
          {/* 搜索 */}
          <Input
            placeholder="搜索模板..."
            prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            allowClear
            className="template-panel-search"
          />

          {/* 分类标签 */}
          <div className="template-panel-categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`template-category-tag ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 模板列表 */}
          <div className="template-panel-list">
            {filteredTemplates.length === 0 ? (
              <Empty description="没有找到匹配的模板" style={{ padding: '24px 0' }} />
            ) : (
              filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={handleUse}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>

          {/* 创建按钮 */}
          <div className="template-panel-footer">
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingTemplate(null)
                setShowForm(true)
              }}
              block
            >
              创建我的模板
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  )
}
