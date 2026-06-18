import { Button } from 'antd';
import { SendOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, ChatMode } from '../types/chatTypes';
import { ALL_MODES, getModeQuickQuestions } from '../types/chatTypes';
import ChatMessageBubble from './ChatMessageBubble';

interface Props {
  messages: ChatMessage[];
  loading: boolean;
  currentMode: ChatMode | null;
  onSendMessage: (content: string) => void;
  onStopGeneration?: () => void;
  onRetryMessage?: (messageId: string) => void;
}

export default function ChatWindow({
  messages,
  loading,
  currentMode,
  onSendMessage,
  onStopGeneration,
  onRetryMessage,
}: Props) {
  const modeConfig = currentMode ? ALL_MODES.find(m => m.key === currentMode) : null;
  const quickQuestions = currentMode ? getModeQuickQuestions(currentMode) : [];
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

  return (
    <div className="chat-window">
      {/* 消息区域 */}
      <div className="chat-messages-area">
        {messages.length === 0 ? (
          /* ===== 空状态欢迎页 ===== */
          <div className="chat-welcome">
            <div className="chat-welcome-avatar">
              <span style={{ fontSize: 42 }}>{modeConfig ? modeConfig.icon : '🤖'}</span>
            </div>
            <h2 className="chat-welcome-title">
              {modeConfig ? `当前模式：${modeConfig.label}` : '你好，我是 AI 助手'}
            </h2>
            <p className="chat-welcome-subtitle">
              {modeConfig ? modeConfig.subtitle : '有什么我可以帮你的？选择一个模式可以获得更有针对性的帮助'}
            </p>
            {modeConfig && (
              <div className="chat-quick-questions">
                {quickQuestions.map((text, idx) => (
                  <button
                    key={idx}
                    className="chat-quick-card"
                    onClick={() => handleQuickQuestion(text)}
                    disabled={loading}
                  >
                    <span className="chat-quick-card-icon" style={{ fontSize: 18 }}>
                      {['💬', '💡'][idx % 4]}
                    </span>
                    <span className="chat-quick-card-text">{text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => {
            // 机器人消息（最后一条或有错误）显示重试 / 重新生成按钮
            const canRetry =
              message.role === 'robot' &&
              !loading &&
              onRetryMessage !== undefined;

            return (
              <ChatMessageBubble
                key={message.id}
                message={message}
                onRetry={canRetry ? () => onRetryMessage!(message.id) : undefined}
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
