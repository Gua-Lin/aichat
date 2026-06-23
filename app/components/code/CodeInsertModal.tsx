'use client'

import { useState } from 'react'
import { Modal, Select, Button } from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import type { CodeAttachment } from '../../types/chatTypes'

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'tsx', label: 'TSX' },
  { value: 'jsx', label: 'JSX' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'text', label: '纯文本' },
]

interface Props {
  visible: boolean
  onClose: () => void
  onInsert: (attachment: CodeAttachment) => void
}

/**
 * 手动插入代码弹层
 * - 选择语言
 * - 粘贴代码内容
 * - 确认插入
 */
export default function CodeInsertModal({ visible, onClose, onInsert }: Props) {
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState('')

  const handleConfirm = () => {
    if (!code.trim()) return
    onInsert({ language, code: code.trim() })
    setCode('')
    onClose()
  }

  const handleClose = () => {
    setCode('')
    onClose()
  }

  return (
    <Modal
      title={
        <span>
          <CodeOutlined style={{ marginRight: 8 }} />
          插入代码片段
        </span>
      }
      open={visible}
      onCancel={handleClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleClose}>取消</Button>,
        <Button
          key="insert"
          type="primary"
          icon={<CodeOutlined />}
          onClick={handleConfirm}
          disabled={!code.trim()}
        >
          插入
        </Button>,
      ]}
      className="code-insert-modal"
    >
      <div className="code-insert-form">
        {/* 语言选择 */}
        <div className="code-insert-lang-row">
          <label className="code-insert-label">编程语言</label>
          <Select
            value={language}
            onChange={setLanguage}
            options={LANGUAGES}
            style={{ width: 200 }}
            showSearch
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>

        {/* 代码输入 */}
        <div className="code-input-area">
          <label className="code-insert-label">代码内容</label>
          <textarea
            className="code-insert-textarea"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="在此粘贴或输入代码..."
            rows={12}
            spellCheck={false}
          />
        </div>
      </div>
    </Modal>
  )
}
