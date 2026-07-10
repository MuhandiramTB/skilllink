'use client';

/**
 * Last-resort error boundary. Replaces the ROOT layout when a catastrophic error
 * occurs (even the locale layout failed), so it must render its own <html>/<body>.
 * Deliberately dependency-free + inline-styled — no tokens/CSS are guaranteed here.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', background: '#FBFBFD', color: '#0B0D12' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: '#EEF0FE', color: '#4F46E5', display: 'grid', placeItems: 'center', marginBottom: 20, fontSize: 30, fontWeight: 800 }}>S</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Something went wrong</h1>
          <p style={{ color: '#64707D', fontSize: 14, maxWidth: 360, marginTop: 8 }}>
            SkillLink hit an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ marginTop: 24, border: 'none', borderRadius: 10, background: '#4F46E5', color: '#fff', padding: '12px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Try again
          </button>
          {error.digest && <p style={{ marginTop: 24, fontFamily: 'monospace', fontSize: 11, color: '#8A93A0' }}>Ref: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
