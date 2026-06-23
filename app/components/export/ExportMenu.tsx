'use client'

import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import {
  CodeOutlined,
  FileTextOutlined,
  BookOutlined,
} from '@ant-design/icons'
import { useExport } from '../../hooks/useExport'

interface Props {
  /** 按钮展示方式 */
  render: (onClick: () => void) => React.ReactNode
}

/**
 * 导出菜单
 * - 当前会话导出（JSON / Markdown）
 * - 全部会话导出（JSON / Markdown）
 */
export default function ExportMenu({ render }: Props) {
  const {
    hasCurrentSession,
    hasSessions,
    exportCurrentSession,
    exportAllSessions,
  } = useExport()

  const menuItems: MenuProps['items'] = [
    {
      key: 'current-json',
      icon: <CodeOutlined />,
      label: '当前会话 - JSON',
      disabled: !hasCurrentSession,
      onClick: () => exportCurrentSession('json'),
    },
    {
      key: 'current-md',
      icon: <FileTextOutlined />,
      label: '当前会话 - Markdown',
      disabled: !hasCurrentSession,
      onClick: () => exportCurrentSession('markdown'),
    },
    { type: 'divider' },
    {
      key: 'all-json',
      icon: <CodeOutlined />,
      label: '全部会话 - JSON',
      disabled: !hasSessions,
      onClick: () => exportAllSessions('json'),
    },
    {
      key: 'all-md',
      icon: <BookOutlined />,
      label: '全部会话 - Markdown',
      disabled: !hasSessions,
      onClick: () => exportAllSessions('markdown'),
    },
  ]

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
      {render(() => {})}
    </Dropdown>
  )
}
