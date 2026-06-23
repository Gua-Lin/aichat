'use client'

import { useState } from 'react'
import { Tag, Tooltip } from 'antd'
import { ScheduleOutlined, CheckCircleOutlined, CheckCircleFilled } from '@ant-design/icons'
import type { PlanData } from '../../types/chatTypes'

interface Props {
  planData: PlanData
  onToggleTask?: (taskIndex: number) => void
}

const LEVEL_LABELS: Record<PlanData['level'], { text: string; color: string }> = {
  beginner: { text: '零基础', color: 'green' },
  elementary: { text: '初级', color: 'blue' },
  intermediate: { text: '中级', color: 'orange' },
  advanced: { text: '高级', color: 'red' },
}

/**
 * 学习计划展示卡片
 * - 展示目标/水平/时间安排摘要
 * - 任务列表（可勾选完成）
 */
export default function PlanCard({ planData, onToggleTask }: Props) {
  const [expanded, setExpanded] = useState(true)
  const levelInfo = LEVEL_LABELS[planData.level]
  const completedCount = planData.tasks.filter(t => t.completed).length
  const totalCount = planData.tasks.length

  return (
    <div className="plan-card">
      {/* 摘要头部 */}
      <div className="plan-card-header" onClick={() => setExpanded(!expanded)}>
        <ScheduleOutlined className="plan-card-icon" />
        <div className="plan-card-summary">
          <span className="plan-card-goal">{planData.goal}</span>
          <div className="plan-card-meta">
            <Tag color={levelInfo.color}>{levelInfo.text}</Tag>
            <Tag>{planData.schedule}</Tag>
            {totalCount > 0 && (
              <span className="plan-card-progress">
                {completedCount}/{totalCount} 已完成
              </span>
            )}
          </div>
        </div>
        <span className={`plan-card-arrow ${expanded ? 'expanded' : ''}`}>▾</span>
      </div>

      {/* 任务列表 */}
      {expanded && planData.tasks.length > 0 && (
        <div className="plan-card-tasks">
          {planData.tasks.map((task, index) => (
            <div
              key={index}
              className={`plan-task-item ${task.completed ? 'completed' : ''}`}
              onClick={() => onToggleTask?.(index)}
            >
              <span className="plan-task-check">
                {task.completed
                  ? <CheckCircleFilled style={{ color: 'var(--primary)' }} />
                  : <CheckCircleOutlined />}
              </span>
              <span className="plan-task-text">{task.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* 无任务时的提示 */}
      {expanded && planData.tasks.length === 0 && (
        <div className="plan-card-empty">
          等待 AI 生成学习计划...
        </div>
      )}
    </div>
  )
}
