
import type {NextConfig} from 'next';
import withPWA from 'next-pwa';

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

// PWA configuration is applied by wrapping the main Next.js config.
export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})(nextConfig);
