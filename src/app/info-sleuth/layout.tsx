
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reverse Image Search | Intel Tools Suite',
  description: 'Upload an image to search for similar images using a RapidAPI service.',
};

export default function ReverseImageSearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
