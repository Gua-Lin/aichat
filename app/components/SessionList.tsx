'use client';

import { useCallback } from 'react';
import { Button, Empty } from 'antd';
import { PlusOutlined, MessageOutlined } from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSessionManager } from '../hooks/useSessionManager';
import { useChatStore } from '../stores/useChatStore';
import SessionSearchBar from './session/SessionSearchBar';
import SessionGroup from './session/SessionGroup';
import SessionBatchBar from './session/SessionBatchBar';
import SortableSessionItem from './session/SortableSessionItem';

/**
 * 会话列表（Batch 3 增强版）
 * - 搜索过滤
 * - 置顶/全部/归档分组
 * - 拖拽排序（@dnd-kit）
 * - 批量选择删除
 * - 双击重命名 / 右键菜单
 */
export default function SessionList() {
  const createNewSession = useChatStore(s => s.createNewSession);
  const switchSession = useChatStore(s => s.switchSession);
  const deleteSession = useChatStore(s => s.deleteSession);
  const currentSessionId = useChatStore(s => s.currentSessionId);

  const {
    pinnedSessions,
    normalSessions,
    archivedSessions,
    searchKeyword,
    setSearchKeyword,
    renameSession,
    togglePin,
    toggleArchive,
    reorderSessions,
    isBatchMode,
    enterBatchMode,
    exitBatchMode,
    selectedIds,
    toggleSelect,
    selectAll,
    batchDelete,
  } = useSessionManager();

  // @dnd-kit 传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        reorderSessions(active.id as string, over.id as string);
      }
    },
    [reorderSessions],
  );

  const handleNewSession = useCallback(() => {
    createNewSession();
  }, [createNewSession]);

  const hasAnySessions =
    pinnedSessions.length > 0 || normalSessions.length > 0 || archivedSessions.length > 0;

  // 可拖拽的会话 ID（仅普通会话，置顶会话不参与拖拽排序）
  const sortableIds = normalSessions.map(s => s.id);

  return (
    <div className="session-list-wrapper">
      <div className="session-list-header">
        <span className="session-list-title">
          <MessageOutlined />
          会话列表
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {!isBatchMode && hasAnySessions && (
            <Button
              type="text"
              size="small"
              onClick={enterBatchMode}
              className="session-list-new-btn"
            >
              ☑ 选择
            </Button>
          )}
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleNewSession}
            className="session-list-new-btn"
          >
            新建
          </Button>
        </div>
      </div>

      {/* 批量操作栏 */}
      {isBatchMode && (
        <SessionBatchBar
          selectedCount={selectedIds.size}
          onSelectAll={selectAll}
          onBatchDelete={batchDelete}
          onExit={exitBatchMode}
        />
      )}

      {/* 搜索栏 */}
      {hasAnySessions && (
        <SessionSearchBar keyword={searchKeyword} onKeywordChange={setSearchKeyword} />
      )}

      {!hasAnySessions ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
          <Empty description="暂无会话">
            <Button type="primary" onClick={handleNewSession}>
              开始新对话
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="session-list-items">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {/* 置顶分组 */}
            <SessionGroup
              title="置顶"
              icon="pinned"
              sessions={pinnedSessions}
              currentSessionId={currentSessionId}
              isBatchMode={isBatchMode}
              selectedIds={selectedIds}
              onSelect={switchSession}
              onToggleSelect={toggleSelect}
              onRename={renameSession}
              onTogglePin={togglePin}
              onToggleArchive={toggleArchive}
              onDelete={deleteSession}
            />

            {/* 普通会话（可拖拽排序） */}
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {normalSessions.length > 0 && (
                <div className="session-group">
                  {pinnedSessions.length > 0 && (
                    <div className="session-group-header" style={{ cursor: 'default' }}>
                      <span className="session-group-icon"><MessageOutlined /></span>
                      <span className="session-group-title">全部会话</span>
                      <span className="session-group-count">({normalSessions.length})</span>
                    </div>
                  )}
                  <div className="session-group-items">
                    {normalSessions.map(session => (
                      <SortableSessionItem
                        key={session.id}
                        session={session}
                        isActive={currentSessionId === session.id}
                        isBatchMode={isBatchMode}
                        isSelected={selectedIds.has(session.id)}
                        onSelect={switchSession}
                        onToggleSelect={toggleSelect}
                        onRename={renameSession}
                        onTogglePin={togglePin}
                        onToggleArchive={toggleArchive}
                        onDelete={deleteSession}
                      />
                    ))}
                  </div>
                </div>
              )}
            </SortableContext>
          </DndContext>

          {/* 已归档分组（不可拖拽） */}
          <SessionGroup
            title="已归档"
            icon="archived"
            sessions={archivedSessions}
            currentSessionId={currentSessionId}
            isBatchMode={isBatchMode}
            selectedIds={selectedIds}
            defaultCollapsed
            onSelect={switchSession}
            onToggleSelect={toggleSelect}
            onRename={renameSession}
            onTogglePin={togglePin}
            onToggleArchive={toggleArchive}
            onDelete={deleteSession}
          />
        </div>
      )}
    </div>
  );
}
