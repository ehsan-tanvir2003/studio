
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Image Search | Intel Tools Suite',
  description: 'Search for visually similar images or identify products using an image URL via Real-Time Lens Data API.',
};

export default function ImageSearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
