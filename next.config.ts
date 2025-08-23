
import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,

});

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

export default withPWA(nextConfig);
