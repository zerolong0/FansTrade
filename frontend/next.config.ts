import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  // Enable production source maps for better debugging
  productionBrowserSourceMaps: false,
  // Optimize images
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
