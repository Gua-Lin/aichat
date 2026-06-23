'use client'

import { useState } from 'react'
import { Button, Select, Input } from 'antd'
import { ScheduleOutlined } from '@ant-design/icons'
import type { PlanData } from '../../types/chatTypes'

interface Props {
  visible: boolean
  onSubmit: (planData: PlanData) => void
  onCancel: () => void
}

const LEVELS = [
  { value: 'beginner', label: '零基础入门' },
  { value: 'elementary', label: '初级（有基本概念）' },
  { value: 'intermediate', label: '中级（有一定经验）' },
  { value: 'advanced', label: '高级（深入进阶）' },
]

const SCHEDULES = [
  { value: '1周冲刺', label: '1 周冲刺' },
  { value: '2周计划', label: '2 周计划' },
  { value: '1个月', label: '1 个月' },
  { value: '3个月', label: '3 个月' },
  { value: '每天1小时', label: '每天 1 小时' },
  { value: '每天2小时', label: '每天 2 小时' },
]

/**
 * 学习计划输入表单
 * - 学习目标（文本输入）
 * - 当前水平（下拉选择）
 * - 时间安排（下拉选择）
 */
export default function PlanForm({ visible, onSubmit, onCancel }: Props) {
  const [goal, setGoal] = useState('')
  const [level, setLevel] = useState<PlanData['level']>('beginner')
  const [schedule, setSchedule] = useState('1个月')

  if (!visible) return null

  const handleSubmit = () => {
    if (!goal.trim()) return
    onSubmit({
      goal: goal.trim(),
      level,
      schedule,
      tasks: [],
    })
    setGoal('')
    setLevel('beginner')
    setSchedule('1个月')
  }

  return (
    <div className="plan-form">
      <div className="plan-form-header">
        <ScheduleOutlined className="plan-form-icon" />
        <h3 className="plan-form-title">生成学习计划</h3>
      </div>

      <div className="plan-form-body">
        {/* 学习目标 */}
        <div className="plan-form-field">
          <label className="plan-form-label">学习目标</label>
          <Input.TextArea
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="例如：掌握 React Hooks、学习 TypeScript 类型系统..."
            rows={2}
            maxLength={200}
            showCount
          />
        </div>

        {/* 当前水平 */}
        <div className="plan-form-field">
          <label className="plan-form-label">当前水平</label>
          <Select
            value={level}
            onChange={setLevel}
            options={LEVELS}
            style={{ width: '100%' }}
          />
        </div>

        {/* 时间安排 */}
        <div className="plan-form-field">
          <label className="plan-form-label">时间安排</label>
          <Select
            value={schedule}
            onChange={setSchedule}
            options={SCHEDULES}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div className="plan-form-footer">
        <Button onClick={onCancel}>取消</Button>
        <Button
          type="primary"
          icon={<ScheduleOutlined />}
          onClick={handleSubmit}
          disabled={!goal.trim()}
        >
          生成计划
        </Button>
      </div>
    </div>
  )
}
