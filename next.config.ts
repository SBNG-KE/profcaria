import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {

  outputFileTracingRoot: path.join(__dirname),

  // Ondwira is one application. Keep legacy URLs only as entry redirects while
  // their underlying data workflows are migrated into the unified shell.
  async redirects() {
    return [
      {
        source: '/professional/:path*',
        destination: '/social',
        permanent: false,
      },
      {
        source: '/employer/:path*',
        destination: '/work',
        permanent: false,
      },
    ];
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
  // Server external packages for Transformers.js
  serverExternalPackages: ['@xenova/transformers', 'onnxruntime-node'],
  // Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
        ],
      },
    ];
  },
  // Optimize webpack for faster compilation
  webpack: (config, { dev }) => {
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
