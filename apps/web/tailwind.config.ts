import type { Config } from 'tailwindcss';

/**
 * SkillLink design system — "Modern SaaS / clean" (2026).
 * Near-white ground + near-black ink + a single electric-indigo accent. Neutrals
 * carry a cool slate bias toward the accent (picked, not defaulted). Semantic
 * colors are kept separate from the accent so state always reads on its own.
 *
 * Token names (primary/accent/success/danger) are unchanged from the previous
 * system so every existing `text-primary`/`bg-primary` usage adopts the new
 * palette without edits — only the values moved. New tokens (slate-2, surface-2,
 * line-soft, primary-soft) add the extra rungs a clean UI needs.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand accent — the one bold note. Electric indigo reads as "software
        // product" more than the flatter blue did, still trustworthy for bookings.
        primary: '#4F46E5',
        'primary-600': '#4338CA',
        'primary-700': '#3730A3',
        'primary-soft': '#EEF0FE', // tinted fill for icon tiles / soft chips (light)
        accent: '#4F46E5', // collapse onto the single accent
        // Stitch palette tokens used by ported designs (login panel, dashboard).
        'secondary-container': '#4F46E5',
        'primary-fixed-dim': '#c7c9f5',
        'primary-fixed': '#e0e2fd',
        'primary-container': '#161826',
        'tertiary-fixed-dim': '#b7c8e1',
        ink: '#0B0D12', // near-black ground for headings + primary buttons
        slate: '#64707D', // cool secondary text (nudged toward the indigo)
        'slate-2': '#8A93A0', // tertiary text / captions
        // Cool-biased neutral surfaces
        surface: '#FBFBFD',
        'surface-2': '#F3F4F8', // deeper fill: inset rows, table heads
        line: '#E8EAEE',
        'line-soft': '#F1F3F6', // hairline inside cards (divider rows)
        // Semantic — independent of the accent
        success: '#16A34A',
        warn: '#D97706',
        danger: '#DC2626',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { base: '10px', xl2: '14px' },
      boxShadow: {
        // Layered, restrained depth — the "clean SaaS" card look. Two stacked
        // low-alpha shadows read crisper than one soft blur; lift on hover.
        card: '0 1px 2px rgba(11,13,18,0.04), 0 1px 3px rgba(11,13,18,0.06)',
        lift: '0 12px 28px -12px rgba(11,13,18,0.22), 0 4px 10px -6px rgba(11,13,18,0.12)',
        ring: '0 0 0 4px #EEF0FE', // focus/active halo in the accent tint
      },
      letterSpacing: { tightest: '-0.03em' },
    },
  },
  plugins: [],
};

export default config;
