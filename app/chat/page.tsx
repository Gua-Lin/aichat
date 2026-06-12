'use client';

import { Layout } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import ChatWindow from "../components/ChatWindow";
import SessionList from "../components/SessionList";
import ModeSelector from "../components/ModeSelector";
import { useChatStore } from "../store/useChatStore";
import '../styles/chatStyles.css';

const { Sider, Content } = Layout;

export default function ChatPage() {
  const {
    sessions,
    currentSessionId,
    currentMode,
    loading,
    sendMessage,
    stopGeneration,
    createNewSession,
    switchSession,
    deleteSession,
    setMode,
  } = useChatStore();

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  const handleNewSession = () => {
    createNewSession();
  };

  const handleSelectSession = (sessionId: string) => {
    switchSession(sessionId);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('确定要删除这个对话吗？')) {
      deleteSession(sessionId);
    }
  };

  return (
    <Layout className="chatbot-page">
      <Sider width={300} theme="light" className="chatbot-sider">
        <div className="chatbot-brand">
          <RobotOutlined className="chatbot-brand-icon" />
          <span className="chatbot-brand-text">AI ChatBot</span>
        </div>
        <SessionList
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
        />
      </Sider>
      <Content className="chatbot-content">
        <ModeSelector
          currentMode={currentMode}
          onModeChange={setMode}
        />
        <div className="chatbot-content-body">
          <ChatWindow
            messages={currentSession?.messages || []}
            loading={loading}
            currentMode={currentMode}
            onSendMessage={sendMessage}
            onStopGeneration={stopGeneration}
          />
        </div>
      </Content>
    </Layout>
  );
}