import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { PromptTemplate, TemplateCategory } from '../types/chatTypes'

// ==================== 内置模板数据 ====================

const BUILTIN_TEMPLATES: PromptTemplate[] = [
  {
    id: 'builtin-explain-react',
    name: 'React 概念解释',
    description: '用通俗语言解释 React 核心概念',
    icon: '⚛️',
    category: '学习',
    systemPrompt: '你是一个耐心的 React 老师。请用通俗易懂的语言、比喻和实例来解释 React 概念，让初学者也能轻松理解。',
    source: 'builtin',
    createdAt: 0,
    usageCount: 0,
  },
  {
    id: 'builtin-interview-frontend',
    name: '前端面试模拟',
    description: '模拟真实前端面试场景',
    icon: '🎤',
    category: '面试',
    systemPrompt: '你是一个资深前端面试官。请依次提出面试问题，等候选人回答后进行追问和点评，最后给出评分和改进建议。',
    source: 'builtin',
    createdAt: 0,
    usageCount: 0,
  },
  {
    id: 'builtin-code-review',
    name: '代码审查',
    description: '逐行分析代码，找出问题和优化点',
    icon: '🔍',
    category: '编程',
    systemPrompt: '你是一个严格的代码审查专家。请逐行分析用户提供的代码，指出潜在 bug、性能问题、安全隐患和不规范写法，并给出修正代码和解释。',
    source: 'builtin',
    createdAt: 0,
    usageCount: 0,
  },
  {
    id: 'builtin-writing-blog',
    name: '博客文章助手',
    description: '帮你撰写技术博客文章',
    icon: '✍️',
    category: '写作',
    systemPrompt: '你是一个技术博客写作助手。根据用户提供的主题，帮助撰写结构清晰、内容丰富的技术文章，包含引言、正文、代码示例和总结。',
    source: 'builtin',
    createdAt: 0,
    usageCount: 0,
  },
  {
    id: 'builtin-plan-roadmap',
    name: '学习路线规划',
    description: '制定分阶段的学习计划',
    icon: '🗺️',
    category: '学习',
    systemPrompt: '你是一个学习规划师。根据用户的目标和当前水平，制定分阶段的学习路线，包含每日任务、里程碑、推荐资源和检验方式。',
    source: 'builtin',
    createdAt: 0,
    usageCount: 0,
  },
  {
    id: 'builtin-general-translate',
    name: '通用翻译助手',
    description: '中英文互译并解释用法',
    icon: '🌐',
    category: '通用',
    systemPrompt: '你是一个翻译助手。请将用户提供的文本在中英文之间互译，并解释关键词汇和语法结构。保持翻译自然流畅。',
    source: 'builtin',
    createdAt: 0,
    usageCount: 0,
  },
]

// ==================== Store 类型定义 ====================

interface TemplateStoreState {
  /** 所有模板（内置 + 自建） */
  templates: PromptTemplate[]
  /** 搜索关键词 */
  searchKeyword: string
  /** 当前筛选分类 */
  activeCategory: TemplateCategory | '全部'

  /** 设置搜索关键词 */
  setSearchKeyword: (kw: string) => void
  /** 设置筛选分类 */
  setActiveCategory: (cat: TemplateCategory | '全部') => void
  /** 获取过滤后的模板列表 */
  getFilteredTemplates: () => PromptTemplate[]
  /** 创建自建模板 */
  createTemplate: (data: Omit<PromptTemplate, 'id' | 'source' | 'createdAt' | 'usageCount'>) => void
  /** 更新自建模板 */
  updateTemplate: (id: string, data: Partial<PromptTemplate>) => void
  /** 删除自建模板（内置模板不可删除） */
  deleteTemplate: (id: string) => void
  /** 使用模板：返回 systemPrompt 并增加使用计数 */
  useTemplate: (id: string) => string | null
}

// ==================== Zustand Store ====================

export const useTemplateStore = create<TemplateStoreState>()(
  persist(
    (set, get) => ({
      templates: BUILTIN_TEMPLATES,
      searchKeyword: '',
      activeCategory: '全部',

      setSearchKeyword: (kw: string) => {
        set({ searchKeyword: kw })
      },

      setActiveCategory: (cat: TemplateCategory | '全部') => {
        set({ activeCategory: cat })
      },

      getFilteredTemplates: () => {
        const { templates, searchKeyword, activeCategory } = get()
        let result = templates

        // 分类过滤
        if (activeCategory !== '全部') {
          result = result.filter(t => t.category === activeCategory)
        }

        // 关键词搜索（匹配名称和描述）
        if (searchKeyword.trim()) {
          const kw = searchKeyword.toLowerCase()
          result = result.filter(t =>
            t.name.toLowerCase().includes(kw) ||
            t.description.toLowerCase().includes(kw)
          )
        }

        // 排序：内置在前，自建按创建时间倒序
        return [...result].sort((a, b) => {
          if (a.source !== b.source) return a.source === 'builtin' ? -1 : 1
          if (a.source === 'custom') return b.createdAt - a.createdAt
          return b.usageCount - a.usageCount
        })
      },

      createTemplate: (data) => {
        const newTemplate: PromptTemplate = {
          ...data,
          id: uuidv4(),
          source: 'custom',
          createdAt: Date.now(),
          usageCount: 0,
        }
        set(state => ({ templates: [...state.templates, newTemplate] }))
      },

      updateTemplate: (id: string, data: Partial<PromptTemplate>) => {
        set(state => ({
          templates: state.templates.map(t =>
            t.id === id && t.source === 'custom'
              ? { ...t, ...data }
              : t
          ),
        }))
      },

      deleteTemplate: (id: string) => {
        set(state => ({
          templates: state.templates.filter(t => t.id !== id || t.source !== 'custom'),
        }))
      },

      useTemplate: (id: string) => {
        const template = get().templates.find(t => t.id === id)
        if (!template) return null

        // 增加使用计数
        set(state => ({
          templates: state.templates.map(t =>
            t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t
          ),
        }))

        return template.systemPrompt
      },
    }),
    {
      name: 'custom_templates',
      partialize: (state) => ({ templates: state.templates }),
      // 合并策略：保留内置模板 + 用户自建模板
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<TemplateStoreState> | undefined
        const customTemplates = (persisted?.templates || []).filter(t => t.source === 'custom')
        return {
          ...currentState,
          ...(persisted || {}),
          templates: [...BUILTIN_TEMPLATES, ...customTemplates],
        }
      },
    }
  )
)
