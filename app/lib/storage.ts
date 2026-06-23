/**
 * localStorage 统一封装
 * - 统一 key 管理，避免硬编码散落
 * - 安全读写，自动 JSON 序列化/反序列化
 * - 容量溢出时自动清理旧数据并重试
 */

/** 所有 localStorage key 集中管理 */
export const STORAGE_KEYS = {
  SESSIONS: 'chat_sessions',
  TEMPLATES: 'custom_templates',
  FAVORITES: 'chat_favorites',
  THEME: 'theme_preference',
} as const

/** localStorage 总容量上限（约 5MB，保守估计） */
const MAX_STORAGE_BYTES = 4.5 * 1024 * 1024

/** 安全阈值：超过此比例时触发警告 */
const WARNING_RATIO = 0.8

/**
 * 从 localStorage 安全读取 JSON 数据
 * @param key 存储 key
 * @param fallback 读取失败时的默认值
 */
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch (e) {
    console.warn(`[storage] 读取 ${key} 失败，使用默认值`, e)
    return fallback
  }
}

/**
 * 安全写入 localStorage（自动 JSON 序列化）
 * @param key 存储 key
 * @param data 要存储的数据
 * @returns 是否写入成功
 */
export function saveToStorage<T>(key: string, data: T): boolean {
  try {
    const serialized = JSON.stringify(data)
    return safeSetItem(key, serialized)
  } catch (e) {
    console.warn(`[storage] 序列化 ${key} 失败`, e)
    return false
  }
}

/**
 * 安全写入单个 key，捕获 QuotaExceededError
 */
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn(`[storage] localStorage 写入失败: ${key}，尝试清理旧数据`)
      return cleanupAndRetry(key, value)
    }
    return false
  }
}

/**
 * 容量溢出时清理旧数据并重试
 * 策略：对 sessions 数据清理最旧 20% 会话的消息内容（保留会话结构）
 */
function cleanupAndRetry(key: string, value: string): boolean {
  if (key === STORAGE_KEYS.SESSIONS) {
    try {
      const sessions = JSON.parse(value) as Array<{
        id: string
        messages: unknown[]
        updatedAt: number
      }>
      // 按 updatedAt 升序排列，清理最旧 20% 会话的消息内容
      const sorted = [...sessions].sort((a, b) => a.updatedAt - b.updatedAt)
      const cutoff = Math.ceil(sorted.length * 0.2)
      const idsToClean = new Set(sorted.slice(0, cutoff).map(s => s.id))
      const cleaned = sessions.map(s =>
        idsToClean.has(s.id)
          ? { ...s, messages: s.messages.slice(-5) } // 仅保留最近 5 条
          : s
      )
      localStorage.setItem(key, JSON.stringify(cleaned))
      console.warn(`[storage] 已清理 ${cutoff} 个旧会话的消息内容`)
      return true
    } catch {
      return false
    }
  }
  return false
}

/**
 * 获取当前 localStorage 使用量（字节）
 */
export function getStorageUsage(): { used: number; total: number; ratio: number } {
  let used = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key)
      used += key.length + (value?.length || 0)
    }
  }
  // 乘以 2 因为 localStorage 存储 UTF-16 字符
  const usedBytes = used * 2
  return {
    used: usedBytes,
    total: MAX_STORAGE_BYTES,
    ratio: usedBytes / MAX_STORAGE_BYTES,
  }
}

/**
 * 检查 localStorage 使用率是否超过警告阈值
 */
export function isStorageWarning(): boolean {
  const { ratio } = getStorageUsage()
  return ratio >= WARNING_RATIO
}

/**
 * 删除指定 key 的 localStorage 数据
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.warn(`[storage] 删除 ${key} 失败`, e)
  }
}
