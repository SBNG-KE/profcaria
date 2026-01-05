import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  productionBrowserSourceMaps: false,
  // Reduce bundle size
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['lucide-react'],
  },
  // Optimize webpack for faster compilation
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Faster development builds
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }
    return config;
  },
};

export default nextConfig;
