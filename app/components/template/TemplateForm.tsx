'use client'

import { useState, useEffect } from 'react'
import { Input, Select, Button } from 'antd'
import type { PromptTemplate, TemplateCategory } from '../../types/chatTypes'

const { TextArea } = Input

const CATEGORIES: TemplateCategory[] = ['学习', '编程', '写作', '面试', '通用']

const EMOJI_OPTIONS = ['📖', '💻', '🎤', '✍️', '🗺️', '🌐', '🔍', '📋', '📝', '🤖', '🎯', '💡']

interface Props {
  /** 编辑时传入已有模板 */
  editingTemplate?: PromptTemplate | null
  onSave: (data: Omit<PromptTemplate, 'id' | 'source' | 'createdAt' | 'usageCount'>) => void
  onCancel: () => void
}

/**
 * 创建/编辑模板表单
 * - 名称、分类、图标（emoji 选择）、描述、System Prompt
 */
export default function TemplateForm({ editingTemplate, onSave, onCancel }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<TemplateCategory>('学习')
  const [icon, setIcon] = useState('📖')
  const [description, setDescription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')

  // 编辑模式：填充已有数据
  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name)
      setCategory(editingTemplate.category)
      setIcon(editingTemplate.icon)
      setDescription(editingTemplate.description)
      setSystemPrompt(editingTemplate.systemPrompt)
    } else {
      setName('')
      setCategory('学习')
      setIcon('📖')
      setDescription('')
      setSystemPrompt('')
    }
  }, [editingTemplate])

  const handleSubmit = () => {
    if (!name.trim() || !description.trim() || !systemPrompt.trim()) return
    onSave({
      name: name.trim(),
      category,
      icon,
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
    })
  }

  const isValid = name.trim() && description.trim() && systemPrompt.trim()

  return (
    <div className="template-form">
      <h3 className="template-form-title">
        {editingTemplate ? '编辑模板' : '创建新模板'}
      </h3>

      <div className="template-form-fields">
        <div className="template-form-field">
          <label>模板名称</label>
          <Input
            placeholder="例如：React 学习导师"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
          />
        </div>

        <div className="template-form-field">
          <label>分类</label>
          <Select
            value={category}
            onChange={setCategory}
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
            style={{ width: '100%' }}
          />
        </div>

        <div className="template-form-field">
          <label>图标</label>
          <div className="template-form-emoji-picker">
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                type="button"
                className={`template-form-emoji-btn ${icon === emoji ? 'active' : ''}`}
                onClick={() => setIcon(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="template-form-field">
          <label>描述（一句话）</label>
          <Input
            placeholder="例如：用通俗语言讲解 React 概念"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={50}
          />
        </div>

        <div className="template-form-field">
          <label>System Prompt</label>
          <TextArea
            placeholder="AI 的角色设定和行为规范..."
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            rows={4}
            maxLength={500}
            showCount
          />
        </div>
      </div>

      <div className="template-form-actions">
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" onClick={handleSubmit} disabled={!isValid}>
          {editingTemplate ? '保存修改' : '创建模板'}
        </Button>
      </div>
    </div>
  )
}
