
import type {NextConfig} from 'next';
import withPWA from 'next-pwa';

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  // The 'disable' property is removed to enable PWA in development mode
};

const nextConfig: NextConfig = {
  output: 'standalone', // Added for optimized deployment
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allows all hostnames for https
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**', // Allows all hostnames for http
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(pwaConfig)(nextConfig);
