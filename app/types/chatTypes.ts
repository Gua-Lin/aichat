export type ChatRole = 'user' | 'robot';

/** 学习模式标识 */
export type ChatMode = 'explain' | 'interview' | 'codeReview' | 'plan' | 'summary';

/** 模式配置 */
export interface ModeConfig {
  key: ChatMode;
  label: string;
  subtitle: string;          // 欢迎页副标题
  icon: string;              // emoji 图标
  systemPrompt: string;      // 模式描述
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: number
  /** 机器人消息携带的错误信息（仅当消息为错误提示时存在） */
  error?: ChatErrorMessage
}

/** 机器人回复中的结构化错误信息 */
export interface ChatErrorMessage {
  /** 错误类型，用于前端区分展示 */
  type: ChatErrorType
  /** 人类可读的错误描述 */
  message: string
}

/** 后端返回的错误类型枚举 */
export type ChatErrorType =
  | 'API_KEY_MISSING'
  | 'INVALID_REQUEST'
  | 'API_RATE_LIMIT'
  | 'API_AUTH_FAILED'
  | 'API_TIMEOUT'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

/** 所有可用模式 */
export const ALL_MODES: ModeConfig[] = [
  {
    key: 'explain',
    label: '解释模式',
    subtitle: '用通俗语言解释概念',
    icon: '📖',
    systemPrompt: '你是一个耐心的老师，请用通俗易懂的语言解释概念。多用比喻、例子和分层讲解，让对方轻松理解。',
  },
  {
    key: 'interview',
    label: '面试模式',
    subtitle: '像面试官一样提问',
    icon: '🎤',
    systemPrompt: '你是一个资深前端面试官。请以问答形式考察对方的知识掌握程度，先提一个问题，听完回答后再追问细节，最后给出评分和建议。',
  },
  {
    key: 'codeReview',
    label: '纠错模式',
    subtitle: '帮我检查代码问题',
    icon: '🔍',
    systemPrompt: '你是一个严格的代码审查者。逐行分析代码，指出潜在问题、安全隐患、性能瓶颈、不规范写法，并给出修正代码和解释。',
  },
  {
    key: 'plan',
    label: '计划模式',
    subtitle: '帮我生成学习计划',
    icon: '📋',
    systemPrompt: '你是一个学习规划师。根据对方的目标和时间安排，制定详细的、分步骤的学习计划，包含每日任务、里程碑、推荐资源和检验方式。',
  },
  {
    key: 'summary',
    label: '总结模式',
    subtitle: '帮我总结知识点',
    icon: '📝',
    systemPrompt: '你是一个知识提炼专家。把复杂的内容整理成结构清晰的要点、思维导图式总结，突出核心概念和它们之间的联系。',
  },
];

/** 根据模式获取快捷问题 */
export function getModeQuickQuestions(mode: ChatMode): string[] {
  switch (mode) {
    case 'explain':
      return [
        '请用简单的方式解释 React 组件',
        '什么是闭包？请用比喻说明',
      ];
    case 'interview':
      return [
        '开始 React 面试，问我几个常见问题',
        '考察一下我对虚拟 DOM 的理解',
      ];
    case 'codeReview':
      return [
        '帮我看看这段代码有什么问题',
        '这段代码的性能可以优化吗？',
      ];
    case 'plan':
      return [
        '给我一个前端进阶学习路线',
        '我每天只有 1 小时，怎么学 TypeScript？',
      ];
    case 'summary':
      return [
        '帮我总结 React Hooks 的核心知识点',
        '总结一下 JavaScript 异步编程的几种方式',
      ];
  }
}

/** 错误类型对应的中文提示（供 UI 直接展示） */
export function getErrorDisplayText(type: ChatErrorType, message?: string): string {
  const map: Record<ChatErrorType, string> = {
    API_KEY_MISSING: '⚙️ API Key 未配置，请联系管理员在 `.env.local` 中设置 OPENAI_API_KEY',
    INVALID_REQUEST: '❌ 请求格式错误，请刷新页面后重试',
    API_RATE_LIMIT: '⏳ API 调用频率过高，请稍等片刻后再试',
    API_AUTH_FAILED: '🔑 API Key 无效或已过期，请检查配置',
    API_TIMEOUT: '⏰ 请求超时，AI 响应时间过长，请稍后重试',
    API_ERROR: '⚠️ AI 服务暂时不可用，请稍后重试',
    NETWORK_ERROR: '🌐 无法连接到 AI 服务，请检查网络连接',
    UNKNOWN: '❓ 发生未知错误，请稍后重试',
  };
  return message || map[type] || map.UNKNOWN;
}

/** 判断错误类型是否支持重试 */
export function isRetryableError(type: ChatErrorType): boolean {
  return ['API_TIMEOUT', 'API_ERROR', 'NETWORK_ERROR', 'API_RATE_LIMIT'].includes(type);
}
