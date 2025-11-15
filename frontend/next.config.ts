import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Enable production source maps for better debugging
  productionBrowserSourceMaps: false,
  // Optimize images
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
