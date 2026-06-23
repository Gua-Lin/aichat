'use client'

import { Input } from 'antd'
import { SearchOutlined, CloseCircleOutlined } from '@ant-design/icons'

interface Props {
  keyword: string
  onKeywordChange: (kw: string) => void
}

/**
 * 会话搜索输入框
 * 放置在会话列表顶部，实时过滤会话
 */
export default function SessionSearchBar({ keyword, onKeywordChange }: Props) {
  return (
    <div className="session-search-bar">
      <Input
        placeholder="搜索会话..."
        prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
        suffix={
          keyword ? (
            <CloseCircleOutlined
              style={{ color: 'var(--text-tertiary)', cursor: 'pointer' }}
              onClick={() => onKeywordChange('')}
            />
          ) : null
        }
        value={keyword}
        onChange={e => onKeywordChange(e.target.value)}
        allowClear={false}
        className="session-search-input"
      />
    </div>
  )
}
