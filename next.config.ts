
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/maps/api/streetview/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org', // Added wikimedia
        port: '',
        pathname: '/**',
      },
      // Add other potential hostnames if your chosen RapidAPI service
      // returns image thumbnails from specific domains.
      // Example:
      // {
      //   protocol: 'https',
      //   hostname: 'some-cdn.rapidapi.com', 
      //   port: '',
      //   pathname: '/**', 
      // },
    ],
  },
};

export default nextConfig;
