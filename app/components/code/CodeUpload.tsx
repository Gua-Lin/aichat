'use client'

import { useState, useRef } from 'react'
import { Button, Tooltip } from 'antd'
import { PaperClipOutlined, CodeOutlined, CloseCircleFilled } from '@ant-design/icons'
import type { CodeAttachment } from '../../types/chatTypes'

interface Props {
  /** 当前附件预览 */
  attachment?: CodeAttachment | null
  /** 附件变化回调 */
  onAttachmentChange: (attachment: CodeAttachment | null) => void
  /** 打开代码插入弹层 */
  onOpenInsertModal: () => void
}

/**
 * 代码上传入口
 * - 📎 附件按钮：读取本地代码文件
 * - </> 代码按钮：打开手动插入弹层
 * - 附件预览条（显示文件名 + 删除）
 */
export default function CodeUpload({ attachment, onAttachmentChange, onOpenInsertModal }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const text = await file.text()
      // 从文件名推测语言
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const langMap: Record<string, string> = {
        ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
        py: 'python', java: 'java', cpp: 'cpp', c: 'c',
        go: 'go', rs: 'rust', html: 'html', css: 'css',
        json: 'json', md: 'markdown', sql: 'sql', sh: 'bash',
      }

      onAttachmentChange({
        language: langMap[ext] || ext || 'text',
        code: text.slice(0, 10000), // 限制 10K 字符
        filename: file.name,
      })
    } catch {
      // 静默失败
    } finally {
      setUploading(false)
      // 清空 input 以支持重复选择同一文件
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    onAttachmentChange(null)
  }

  return (
    <div className="code-upload-wrapper">
      {/* 隐藏的文件选择器 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ts,.tsx,.js,.jsx,.py,.java,.cpp,.c,.go,.rs,.html,.css,.json,.md,.sql,.sh,.txt,.vue,.svelte"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* 附件预览 */}
      {attachment && (
        <div className="code-upload-preview">
          <CodeOutlined className="code-upload-preview-icon" />
          <span className="code-upload-preview-name">
            {attachment.filename || `代码片段 (${attachment.language})`}
          </span>
          <span className="code-upload-preview-lang">{attachment.language}</span>
          <button className="code-upload-remove" onClick={handleRemove} title="移除附件">
            <CloseCircleFilled />
          </button>
        </div>
      )}

      {/* 工具按钮 */}
      <div className="code-upload-buttons">
        <Tooltip title="上传代码文件">
          <button
            className="chat-input-tool-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <PaperClipOutlined />
          </button>
        </Tooltip>
        <Tooltip title="插入代码片段">
          <button
            className="chat-input-tool-btn"
            onClick={onOpenInsertModal}
          >
            <CodeOutlined />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
