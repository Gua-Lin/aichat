import { useCallback } from 'react'
import { useChatStore } from '../stores/useChatStore'
import {
  exportSessionAsJSON,
  exportSessionAsMarkdown,
  exportAllSessionsAsJSON,
  exportAllSessionsAsMarkdown,
  downloadFile,
} from '../lib/exportUtils'

type ExportFormat = 'json' | 'markdown'

/**
 * 导出 Hook：提供当前会话/全部会话的导出功能
 */
export function useExport() {
  const sessions = useChatStore(s => s.sessions)
  const currentSessionId = useChatStore(s => s.currentSessionId)

  const currentSession = sessions.find(s => s.id === currentSessionId)

  /** 导出当前会话 */
  const exportCurrentSession = useCallback((format: ExportFormat) => {
    if (!currentSession || currentSession.messages.length === 0) return

    const timestamp = new Date().toISOString().slice(0, 10)
    const safeName = currentSession.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 30)

    if (format === 'json') {
      const content = exportSessionAsJSON(currentSession)
      downloadFile(content, `${safeName}_${timestamp}.json`, 'application/json')
    } else {
      const content = exportSessionAsMarkdown(currentSession)
      downloadFile(content, `${safeName}_${timestamp}.md`, 'text/markdown')
    }
  }, [currentSession])

  /** 导出所有会话 */
  const exportAllSessions = useCallback((format: ExportFormat) => {
    if (sessions.length === 0) return

    const timestamp = new Date().toISOString().slice(0, 10)

    if (format === 'json') {
      const content = exportAllSessionsAsJSON(sessions)
      downloadFile(content, `all_sessions_${timestamp}.json`, 'application/json')
    } else {
      const content = exportAllSessionsAsMarkdown(sessions)
      downloadFile(content, `all_sessions_${timestamp}.md`, 'text/markdown')
    }
  }, [sessions])

  return {
    hasCurrentSession: !!currentSession && currentSession.messages.length > 0,
    hasSessions: sessions.length > 0,
    exportCurrentSession,
    exportAllSessions,
  }
}
