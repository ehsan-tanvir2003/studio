
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
      // Added for FaceCheck.ID thumbnails - adjust if their CDN hostnames vary
      {
        protocol: 'https',
        hostname: 'facecheck.id', 
        port: '',
        pathname: '/**', 
      },
       {
        protocol: 'https',
        hostname: 'cdn.facecheck.id', // Common CDN pattern
        port: '',
        pathname: '/**',
      },
      // Add other potential hostnames if FaceCheck.ID uses multiple for thumbnails
    ],
  },
};

export default nextConfig;
