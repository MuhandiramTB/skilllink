import './globals.css';
import type { ReactNode } from 'react';

// The <html>/<body> live in app/[locale]/layout.tsx (locale-aware).
// This root layout only forwards children (required by the App Router).
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
