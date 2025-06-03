
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Camera Analyzer | Intel Tools Suite',
  description: 'Analyze live camera feed for objects, scenes, and activities.',
};

export default function CameraAnalyzerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
