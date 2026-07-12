// next.config.js
import path from "path";
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload'
        },
      ],
    },
  ],
    turbopack: {
    // Set the root to your project's directory
    root: path.join(__dirname),
  },
};

// module.exports = nextConfig
module.exports = withBundleAnalyzer(nextConfig);