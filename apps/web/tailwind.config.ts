import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0F766E', // teal — trust (design-system.md)
        accent: '#F59E0B', // amber
        'accent-2': '#0D9488', // deeper teal for the wordmark
        success: '#16A34A',
        danger: '#DC2626',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Space Grotesk', 'system-ui', 'sans-serif'],
      },
      borderRadius: { base: '12px' },
    },
  },
  plugins: [],
};

export default config;
