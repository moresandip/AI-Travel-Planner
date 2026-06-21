import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === '1';

const nextConfig: NextConfig = {
  ...(isVercel ? {} : { output: 'export' }),
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
