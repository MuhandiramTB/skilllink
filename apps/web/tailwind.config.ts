import type { Config } from 'tailwindcss';

/**
 * SkillLink design system — "Bold marketplace" (2026 redesign).
 * Near-black ink ground + a single electric-blue accent. Neutrals carry a cool
 * slate bias toward the accent (picked, not defaulted). Semantic colors are kept
 * separate from the accent so state always reads on its own.
 *
 * Token names (primary/accent/success/danger) are unchanged from the previous
 * system so every existing `text-primary`/`bg-primary` usage adopts the new
 * palette without edits — only the values moved.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand accent — the one bold note. `primary` repointed teal → electric blue.
        primary: '#1D4ED8',
        'primary-600': '#1D4ED8',
        'primary-700': '#1E40AF',
        accent: '#1D4ED8', // was amber; collapse onto the single accent
        ink: '#0B0D12', // near-black ground for headings + primary buttons
        slate: '#5B6472', // cool secondary text
        // Cool-biased neutral surfaces
        surface: '#F6F7F9',
        line: '#E4E7EC',
        // Semantic — independent of the accent
        success: '#15803D',
        warn: '#B45309',
        danger: '#DC2626',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { base: '10px', xl2: '16px' },
      boxShadow: {
        // Restrained depth: barely-there at rest, a confident lift on hover.
        card: '0 1px 2px rgba(11,13,18,0.04)',
        lift: '0 8px 24px -8px rgba(11,13,18,0.18)',
      },
      letterSpacing: { tightest: '-0.03em' },
    },
  },
  plugins: [],
};

export default config;
