
import type {NextConfig} from 'next';

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

export default nextConfig;
