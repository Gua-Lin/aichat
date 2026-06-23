import type { ChatSession } from '../types/chatTypes'

/**
 * 将单个会话导出为 JSON 格式
 */
export function exportSessionAsJSON(session: ChatSession): string {
  const exportData = {
    title: session.title,
    createdAt: new Date(session.createdAt).toISOString(),
    updatedAt: new Date(session.updatedAt).toISOString(),
    messageCount: session.messages.length,
    messages: session.messages.map(m => ({
      role: m.role === 'user' ? '用户' : 'AI',
      content: m.content,
      time: new Date(m.timestamp).toLocaleString('zh-CN'),
    })),
  }
  return JSON.stringify(exportData, null, 2)
}

/**
 * 将单个会话导出为 Markdown 格式
 */
export function exportSessionAsMarkdown(session: ChatSession): string {
  const lines: string[] = []

  lines.push(`# ${session.title}`)
  lines.push('')
  lines.push(`> 创建时间：${new Date(session.createdAt).toLocaleString('zh-CN')}`)
  lines.push(`> 消息数量：${session.messages.length}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  for (const msg of session.messages) {
    const role = msg.role === 'user' ? '👤 **用户**' : '🤖 **AI 助手**'
    const time = new Date(msg.timestamp).toLocaleString('zh-CN')
    lines.push(`### ${role}`)
    lines.push(`_${time}_`)
    lines.push('')
    lines.push(msg.content)
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * 将所有会话导出为 JSON
 */
export function exportAllSessionsAsJSON(sessions: ChatSession[]): string {
  const exportData = sessions.map(session => ({
    title: session.title,
    createdAt: new Date(session.createdAt).toISOString(),
    messages: session.messages.map(m => ({
      role: m.role === 'user' ? '用户' : 'AI',
      content: m.content,
      time: new Date(m.timestamp).toLocaleString('zh-CN'),
    })),
  }))
  return JSON.stringify(exportData, null, 2)
}

/**
 * 将所有会话导出为 Markdown
 */
export function exportAllSessionsAsMarkdown(sessions: ChatSession[]): string {
  const parts: string[] = []

  parts.push('# 所有会话记录')
  parts.push('')
  parts.push(`> 导出时间：${new Date().toLocaleString('zh-CN')}`)
  parts.push(`> 会话总数：${sessions.length}`)
  parts.push('')
  parts.push('---')
  parts.push('')

  for (const session of sessions) {
    parts.push(`## ${session.title}`)
    parts.push('')
    for (const msg of session.messages) {
      const role = msg.role === 'user' ? '👤 **用户**' : '🤖 **AI 助手**'
      parts.push(`### ${role}`)
      parts.push(msg.content)
      parts.push('')
    }
    parts.push('---')
    parts.push('')
  }

  return parts.join('\n')
}

/**
 * 触发浏览器文件下载
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
