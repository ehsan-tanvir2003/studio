
"use client";

import CameraFeedAnalyzer from '@/components/app/camera-feed-analyzer';
import { Video } from 'lucide-react';

export default function CameraAnalyzerPage() {
  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4">
      <header className="mb-10 sm:mb-12 text-center">
        <Video className="mx-auto h-16 w-16 text-purple-500 mb-4" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-purple-500">Live Camera Analyzer</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Process real-time details from your camera feed.
        </p>
      </header>

      <main className="w-full max-w-3xl">
        <CameraFeedAnalyzer />
      </main>
    </div>
  );
}
