import { useState, useCallback } from 'react';
import { UserOutlined, RobotOutlined, CopyOutlined, CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage } from '../types/chatTypes';
import { getErrorDisplayText, isRetryableError } from '../types/chatTypes';

interface Props {
  message: ChatMessage;
  onRetry?: () => void;
}

/** 代码块组件 */
function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: 静默失败
    }
  }, [value]);

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">{language || 'code'}</span>
        <button className="code-block-copy-btn" onClick={handleCopy}>
          {copied ? <><CheckOutlined /> 已复制</> : <><CopyOutlined /> 复制</>}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '0 0 8px 8px',
          fontSize: '13px',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

/** 消息操作栏 - 仅助手消息显示 */
function MessageActions({ content, onRetry }: { content: string; onRetry?: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [content]);

  return (
    <div className="message-actions">
      <button className="message-action-btn" onClick={handleCopy} title="复制">
        {copied ? <CheckOutlined />  : <CopyOutlined />}
      </button>
      {onRetry && (
        <button className="message-action-btn" onClick={onRetry} title="重新生成">
          <ReloadOutlined />
        </button>
      )}
    </div>
  );
}

/** 错误消息卡片 */
function ErrorCard({ error, onRetry }: { error: NonNullable<ChatMessage['error']>; onRetry?: () => void }) {
  const displayText = getErrorDisplayText(error.type, error.message);
  const canRetry = isRetryableError(error.type);

  return (
    <div className="error-card">
      <div className="error-card-content">
        <span className="error-card-text">{displayText}</span>
      </div>
      {canRetry && onRetry && (
        <button className="error-card-retry-btn" onClick={onRetry}>
          <ReloadOutlined /> 重试
        </button>
      )}
    </div>
  );
}

export default function ChatMessageBubble({ message, onRetry }: Props) {
  const isUser = message.role === 'user';
  const hasError = !!message.error;
  const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`message-bubble-row ${isUser ? 'user' : 'robot'}`}>
      <div className="message-bubble-inner">
        {/* 头像 */}
        <div className={`message-avatar ${isUser ? 'message-avatar-user' : 'message-avatar-robot'}`}>
          {isUser ? <UserOutlined /> : <RobotOutlined />}
        </div>

        {/* 消息内容 */}
        <div className="message-body">
          {hasError ? (
            /* 错误卡片 */
            <ErrorCard error={message.error!} onRetry={onRetry} />
          ) : (
            /* 正常消息卡片 */
            <div className={`message-card ${isUser ? 'message-card-user' : 'message-card-robot'}`}>
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeStr = String(children).replace(/\n$/, '');
                      // 判断是否为代码块（有语言标记）
                      if (match) {
                        return <CodeBlock language={match[1]} value={codeStr} />;
                      }
                      // 行内代码
                      return (
                        <code className="inline-code" {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre({ children }) {
                      return <>{children}</>;
                    },
                    // 表格样式
                    table({ children }) {
                      return <div className="table-wrapper"><table>{children}</table></div>;
                    },
                    // 链接在新窗口打开
                    a({ href, children }) {
                      return (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* 时间 + 操作栏（错误消息不显示操作栏） */}
          <div className="message-footer">
            <span className="message-time">{time}</span>
            {!hasError && <MessageActions content={message.content} onRetry={onRetry} />}
          </div>
        </div>
      </div>
    </div>
  );
}
