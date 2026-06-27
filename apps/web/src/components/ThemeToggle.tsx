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
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      className="flex h-9 w-9 items-center justify-center rounded-base border text-gray-600 hover:border-primary dark:border-gray-600 dark:text-gray-300"
    >
      {theme === 'dark' ? (
        // sun
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-[18px] w-[18px]" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // moon
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
