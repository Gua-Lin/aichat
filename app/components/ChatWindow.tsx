import { Button } from 'antd';
import { SendOutlined, RobotOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../types/chatTypes';
import ChatMessageBubble from './ChatMessageBubble';

interface Props {
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (content: string) => void;
  onStopGeneration?: () => void;
  onRetryMessage?: (messageId: string) => void;
}

/** 快捷问题列表 */
const QUICK_QUESTIONS = [
  { id: 'q1', text: 'React 组件怎么拆分？' },
  { id: 'q2', text: 'useState 和 useEffect 有什么区别？' },
  { id: 'q3', text: '帮我制定 7 天 React 学习计划'},
  { id: 'q4', text: '帮我检查这段代码' },
];

export default function ChatWindow({
  messages,
  loading,
  onSendMessage,
  onStopGeneration,
  onRetryMessage,
}: Props) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 自动调整 textarea 高度
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  const handleSend = useCallback(() => {
    if (inputValue.trim() && !loading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  }, [inputValue, loading, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = (text: string) => {
    if (!loading) {
      onSendMessage(text);
    }
  };

  const handleRetry = useCallback(
    (messageId: string) => {
      if (onRetryMessage) {
        onRetryMessage(messageId);
      }
    },
    [onRetryMessage],
  );

  return (
    <div className="chat-window">
      {/* 消息区域 */}
      <div className="chat-messages-area">
        {messages.length === 0 ? (
          /* ===== 空状态欢迎页 ===== */
          <div className="chat-welcome">
            <div className="chat-welcome-avatar">
              <RobotOutlined />
            </div>
            <h2 className="chat-welcome-title">你好，我是你的 React 学习助手</h2>
            <p className="chat-welcome-subtitle">你可以问我：</p>
            <div className="chat-quick-questions">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q.id}
                  className="chat-quick-card"
                  onClick={() => handleQuickQuestion(q.text)}
                  disabled={loading}
                >
                  <span className="chat-quick-card-text">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, idx) => {
            const isLastAssistant =
              message.role === 'robot' && idx === messages.length - 1;
            return (
              <ChatMessageBubble
                key={message.id}
                message={message}
                onRetry={isLastAssistant ? () => handleRetry(message.id) : undefined}
              />
            );
          })
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="chat-loading-row">
            <div className="chat-loading-dot">
              <span />
              <span />
              <span />
            </div>
            <span className="chat-loading-text">AI 正在思考...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="chat-input-area">
        <div className="chat-input-inner">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题..."
            className="chat-input-textarea"
            rows={1}
            maxLength={2000}
            disabled={loading}
          />
          {loading && onStopGeneration ? (
            <Button
              danger
              icon={<PauseCircleOutlined />}
              onClick={onStopGeneration}
              className="chat-stop-btn"
            />
          ) : (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!inputValue.trim() || loading}
              className="chat-send-btn"
            />
          )}
        </div>
      </div>
    </div>
  );
}
