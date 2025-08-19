import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@monaco-editor/react', 'monaco-editor'],
  webpack: (config, { isServer }) => {
    // Monaco Editor configuration
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      }
    }

    // Optimisation pour React Arborist
    config.resolve.alias = {
      ...config.resolve.alias,
    }

    return config
  },
}

export default nextConfig
