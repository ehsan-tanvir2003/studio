
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Image Search | Intel Tools Suite', // Updated title
  description: 'Search for images using a text query via a RapidAPI service.', // Updated description
};

export default function TextImageSearchLayout({ // Renamed layout slightly
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
