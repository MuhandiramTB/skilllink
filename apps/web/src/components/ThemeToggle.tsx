'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'skilllink_theme';

/** Applies the persisted theme to <html> as a class (Tailwind darkMode: 'class'). */
export function applyStoredTheme() {
  if (typeof window === 'undefined') return;
  const t = (window.localStorage.getItem(KEY) as Theme) ?? 'light';
  document.documentElement.classList.toggle('dark', t === 'dark');
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const t = (window.localStorage.getItem(KEY) as Theme) ?? 'light';
    setTheme(t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    window.localStorage.setItem(KEY, next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light or dark theme"
      className="rounded-base border px-2 py-1 text-xs font-medium text-gray-600 hover:border-primary dark:border-gray-600 dark:text-gray-300"
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
