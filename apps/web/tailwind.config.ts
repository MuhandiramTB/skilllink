import type { Config } from 'tailwindcss';

/**
 * SkillLink design system — "Bold / Bolt energy" (2026).
 * Near-black ink + ONE electric-lime signature (#C8F02F) — the mobility-app look.
 *
 * DUAL-ACCENT ARCHITECTURE (important):
 *  - `brand` (lime) is the SIGNATURE — used on dark grounds, highlights, active
 *    states, the logo, and the hero CTA. Lime is a LIGHT colour, so text ON lime
 *    must be near-black (`ink`), never white. `brand-ink` is that pairing.
 *  - `primary` stays a DARK ink-based action colour so the app's many
 *    white-text buttons stay readable (a lime button with white text is illegible).
 *    So `bg-primary text-white` = the near-black confident button; `bg-brand
 *    text-ink` = the punchy lime CTA. Both are used deliberately.
 * Token names are otherwise unchanged so existing usages keep working.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── SIGNATURE: electric lime (Bolt energy). Use on dark grounds / highlights
        //    / active states / hero CTA. Text ON lime = `ink` (see brand-ink).
        brand: '#C8F02F',
        'brand-600': '#B4DB1E',      // pressed / hover
        'brand-dim': '#A3C81C',      // borders, rings on light
        'brand-soft': '#F2FBD4',     // faint lime tint fill (light mode chips)
        'brand-ink': '#0B0D12',      // the ONLY text colour that goes on lime
        // ── PRIMARY: near-black action colour (keeps white-text buttons readable).
        primary: '#111318',
        'primary-600': '#000000',
        'primary-700': '#000000',
        'primary-soft': '#EEF0F3',   // neutral tinted fill for icon tiles
        accent: '#C8F02F',           // accent === brand (single signature)
        // Legacy Stitch tokens repointed so old usages don't break.
        'secondary-container': '#111318',
        'primary-fixed-dim': '#c7c9f5',
        'primary-fixed': '#e0e2fd',
        'primary-container': '#161826',
        'tertiary-fixed-dim': '#b7c8e1',
        ink: '#0B0D12',              // near-black ground for headings + buttons
        slate: '#5C6470',           // secondary text (neutral, slightly warm)
        'slate-2': '#8A9099',       // tertiary text / captions
        // Neutral surfaces (a hair warmer/cleaner for the bold look)
        surface: '#FAFAFB',
        'surface-2': '#F2F3F5',     // inset rows, table heads
        line: '#E6E8EC',
        'line-soft': '#F0F1F4',     // hairline inside cards
        // Semantic — independent of the signature
        success: '#16A34A',
        warn: '#D97706',
        danger: '#DC2626',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      // Bolder radii — chunkier, more confident interactive shapes.
      borderRadius: { base: '12px', xl2: '18px', pill: '999px' },
      boxShadow: {
        card: '0 1px 2px rgba(11,13,18,0.04), 0 1px 3px rgba(11,13,18,0.06)',
        lift: '0 16px 36px -14px rgba(11,13,18,0.26), 0 6px 12px -6px rgba(11,13,18,0.14)',
        ring: '0 0 0 4px rgba(200,240,47,0.35)',  // lime focus halo
        // A confident lime glow for the signature CTA on dark grounds.
        brand: '0 8px 24px -6px rgba(200,240,47,0.45)',
      },
      letterSpacing: { tightest: '-0.03em', tighter: '-0.02em' },
    },
  },
  plugins: [],
};

export default config;
