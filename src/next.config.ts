
import type {NextConfig} from 'next';
import withPWA from 'next-pwa';

// Define the PWA configuration separately
const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
};

// Define the main Next.js configuration
const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

// To prevent a known type error with next-pwa, we destructre i18n out.
const { i18n, ...nextConfigWithoutI18n } = nextConfig;

// Wrap the modified config with the PWA plugin
export default withPWA(pwaConfig)(nextConfigWithoutI18n);
