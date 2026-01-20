/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // ESLint configuration for production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration for production builds
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    webpackBuildWorker: true, // Re-enable for faster builds
    optimizeCss: true, // Enable CSS optimization
  },
  
  // Reduce hydration mismatches
  swcMinify: true,
  
  // Configure React for better performance
  reactStrictMode: false,
  
  // Optimize images (remove duplicate)
  images: {
    unoptimized: true,
  },
  
  // Development optimizations
  devIndicators: {
    buildActivity: false,
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Development-specific optimizations
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
      
      // Reduce initial compilation time
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }
    
    return config
  },
  
  // Reduce bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
}

export default nextConfig