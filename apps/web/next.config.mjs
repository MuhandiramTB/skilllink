import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produce a self-contained server bundle (.next/standalone) for a small Docker
  // image — only the files actually needed to run are emitted.
  output: 'standalone',
};

export default withNextIntl(nextConfig);
