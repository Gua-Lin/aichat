'use client';

import { useThemeStore } from '@/app/stores/useThemeStore';

/**
 * 主题切换按钮
 * - 点击在 light / dark 之间切换
 * - 显示当前主题图标（🌙 / ☀️）
 */
export default function ThemeToggle() {
  const resolvedTheme = useThemeStore(s => s.resolvedTheme);
  const toggleTheme = useThemeStore(s => s.toggleTheme);

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      title={resolvedTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
      aria-label="切换主题"
    >
      <span className="theme-toggle-icon">
        {resolvedTheme === 'dark' ? '☀️' : '🌙'}
      </span>
    </button>
  );
}
