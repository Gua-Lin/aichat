'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConfigProvider, Layout, theme as antTheme, Button, Tooltip, Modal } from 'antd';
import { RobotOutlined, AppstoreOutlined, StarOutlined, ExportOutlined, SearchOutlined, ScheduleOutlined } from '@ant-design/icons';
import ChatWindow from "../components/ChatWindow";
import SessionList from "../components/SessionList";
import ModeSelector from "../components/ModeSelector";
import GlobalSearch from "../components/search/GlobalSearch";
import TemplatePanel from "../components/template/TemplatePanel";
import FavoritesDrawer from "../components/favorites/FavoritesDrawer";
import ExportMenu from "../components/export/ExportMenu";
import PlanForm from "../components/plan/PlanForm";
import PlanCard from "../components/plan/PlanCard";
import type { PlanData } from "../types/chatTypes";
import { useChatStore } from "../stores/useChatStore";
import { useFavoriteStore } from "../stores/useFavoriteStore";
import { useThemeStore } from "../stores/useThemeStore";
import ThemeToggle from "../components/theme/ThemeToggle";
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
    setMode,
    retryMessage,
  } = useChatStore();

  const resolvedTheme = useThemeStore(s => s.resolvedTheme);
  const algorithm = resolvedTheme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm;

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  // GlobalSearch 状态
  const [searchVisible, setSearchVisible] = useState(false);
  const [templateVisible, setTemplateVisible] = useState(false);
  const [favoritesVisible, setFavoritesVisible] = useState(false);
  const [planFormVisible, setPlanFormVisible] = useState(false);

  const toggleFavorite = useFavoriteStore(s => s.toggleFavorite);

  // Ctrl+K 快捷键唤起全局搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleJumpToMessage = useCallback((sessionId: string, messageId: string) => {
    // 跳转到目标消息（滚动到对应位置）
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-message-id="${messageId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // 短暂高亮效果
        (el as HTMLElement).style.transition = 'background 0.3s ease';
        (el as HTMLElement).style.background = 'var(--active-bg)';
        setTimeout(() => {
          (el as HTMLElement).style.background = '';
        }, 2000);
      }
    });
  }, []);

  const handleUseTemplate = useCallback((systemPrompt: string) => {
    if (!currentSessionId) {
      useChatStore.getState().createNewSession();
    }
    useChatStore.getState().sendMessage(systemPrompt);
  }, [currentSessionId]);

  // 解释代码：将代码发送给 AI 请求解释
  const handleExplainCode = useCallback((language: string, code: string) => {
    const prompt = `请解释以下 ${language} 代码：\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n请逐行分析代码的作用，解释关键概念和可能的改进点。`;
    if (!currentSessionId) {
      useChatStore.getState().createNewSession();
    }
    useChatStore.getState().sendMessage(prompt);
  }, [currentSessionId]);

  // 学习计划提交
  const handlePlanSubmit = useCallback((planData: PlanData) => {
    const levelText: Record<string, string> = {
      beginner: '零基础入门',
      elementary: '初级',
      intermediate: '中级',
      advanced: '高级',
    };
    const prompt = `请为我制定一个学习计划：\n\n- 学习目标：${planData.goal}\n- 当前水平：${levelText[planData.level]}\n- 时间安排：${planData.schedule}\n\n请给出详细的分阶段学习路线，包含每日任务、里程碑、推荐资源和检验方式。`;
    if (!currentSessionId) {
      useChatStore.getState().createNewSession();
    }
    useChatStore.getState().sendMessage(prompt);
    setPlanFormVisible(false);
  }, [currentSessionId]);

  return (
    <ConfigProvider theme={{ algorithm }}>
      <Layout className="chatbot-page">
        <Sider width={300} theme={resolvedTheme === 'dark' ? 'dark' : 'light'} className="chatbot-sider">
          <div className="chatbot-brand">
            <RobotOutlined className="chatbot-brand-icon" />
            <span className="chatbot-brand-text">AI ChatBot</span>
            <ThemeToggle />
          </div>
          <SessionList />
        </Sider>
        <Content className="chatbot-content">
          <ModeSelector
            currentMode={currentMode}
            onModeChange={setMode}
          />
          {/* 工具栏：模板 + 收藏 + 导出 + 搜索 */}
          <div className="chat-toolbar">
            <Tooltip title="Prompt 模板">
              <Button
                type="text"
                icon={<AppstoreOutlined />}
                onClick={() => setTemplateVisible(true)}
                className="chat-toolbar-btn"
              />
            </Tooltip>
            <Tooltip title="收藏夹">
              <Button
                type="text"
                icon={<StarOutlined />}
                onClick={() => setFavoritesVisible(true)}
                className="chat-toolbar-btn"
              />
            </Tooltip>
            <ExportMenu
              render={(onClick) => (
                <Tooltip title="导出">
                  <Button
                    type="text"
                    icon={<ExportOutlined />}
                    onClick={onClick}
                    className="chat-toolbar-btn"
                  />
                </Tooltip>
              )}
            />
            <Tooltip title="全局搜索 (Ctrl+K)">
              <Button
                type="text"
                icon={<SearchOutlined />}
                onClick={() => setSearchVisible(true)}
                className="chat-toolbar-btn"
              />
            </Tooltip>
            <Tooltip title="生成学习计划">
              <Button
                type="text"
                icon={<ScheduleOutlined />}
                onClick={() => setPlanFormVisible(true)}
                className="chat-toolbar-btn"
              />
            </Tooltip>
          </div>
          <div className="chatbot-content-body">
            <ChatWindow
              messages={currentSession?.messages || []}
              loading={loading}
              currentMode={currentMode}
              currentSessionId={currentSessionId}
              onSendMessage={sendMessage}
              onStopGeneration={stopGeneration}
              onRetryMessage={retryMessage}
              onToggleFavorite={toggleFavorite}
              onExplainCode={handleExplainCode}
            />
          </div>
        </Content>
      </Layout>

      {/* 全局搜索弹层 */}
      <GlobalSearch
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onJumpToMessage={handleJumpToMessage}
      />

      {/* 模板面板 */}
      <TemplatePanel
        visible={templateVisible}
        onClose={() => setTemplateVisible(false)}
        onUseTemplate={handleUseTemplate}
      />

      {/* 收藏夹抽屉 */}
      <FavoritesDrawer
        visible={favoritesVisible}
        onClose={() => setFavoritesVisible(false)}
        onJumpToMessage={handleJumpToMessage}
      />

      {/* 学习计划表单弹层 */}
      <Modal
        title={null}
        open={planFormVisible}
        onCancel={() => setPlanFormVisible(false)}
        footer={null}
        width={440}
      >
        <PlanForm
          visible={planFormVisible}
          onSubmit={handlePlanSubmit}
          onCancel={() => setPlanFormVisible(false)}
        />
      </Modal>
    </ConfigProvider>
  );
}
