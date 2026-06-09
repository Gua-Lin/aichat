import { Button, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons';
import type { ChatSession } from "../types/chatTypes";

interface Props {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewSession: () => void
  onDeleteSession?: (sessionId: string) => void
}

export default function SessionList({ sessions, currentSessionId, onSelectSession, onNewSession, onDeleteSession }: Props) {
  return (
    <div className="session-list-wrapper">
      <div className="session-list-header">
        <span className="session-list-title">
          <MessageOutlined />
          会话列表
        </span>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={onNewSession}
          className="session-list-new-btn"
        >
          新建
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
          <Empty description="暂无会话">
            <Button type="primary" onClick={onNewSession}>
              开始新对话
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="session-list-items">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`session-list-item ${
                currentSessionId === session.id ? 'session-list-item-active' : ''
              }`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="session-item-title">{session.title}</div>
                  <div className="session-item-desc">{session.messages.length} 条消息</div>
                </div>
                {onDeleteSession && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    className="session-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
