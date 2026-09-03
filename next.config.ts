import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default (phase: string): NextConfig => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    distDir: isDev ? '.next-dev' : '.next',
    output: isDev ? undefined : 'export',
    optimizeFonts: false,
    images: {
      unoptimized: true,
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'xgdmyjzyejjmwdqkufhp.supabase.co',
          pathname: '/storage/v1/object/public/**',
        },
        {
          protocol: 'https',
          hostname: 'images.unsplash.com',
        },
      ],
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
    webpack: (config, { dev }) => {
      if (dev) {
        config.watchOptions = {
          ...config.watchOptions,
          ignored: /node_modules|api_temp_hide|studio_temp_hide|src\/app\/api|src\/app\/studio/
        };
      }
      return config;
    },
  };
};
