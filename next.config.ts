
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
  // Ensure that TypeScript and ESLint errors are not ignored during builds
  // typescript: {
  //   ignoreBuildErrors: false,
  // },
  // eslint: {
  //   ignoreDuringBuilds: false,
  // },
};

export default nextConfig;
