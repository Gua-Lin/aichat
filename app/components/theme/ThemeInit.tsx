'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/app/stores/useThemeStore';

/**
 * 主题初始化组件（客户端组件）
 * 在首次挂载时读取 localStorage / 系统偏好，应用 data-theme
 * 同时监听系统主题变化
 */
export default function ThemeInit() {
  const initTheme = useThemeStore(s => s.initTheme);

  useEffect(() => {
    const cleanup = initTheme();
    return cleanup;
  }, [initTheme]);

  return null;
}
