
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reverse Image Search | Intel Tools Suite', // Updated title
  description: 'Search with an image to find matches using a RapidAPI service.', // Updated description
};

export default function ReverseImageSearchLayout({ // Renamed layout
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
