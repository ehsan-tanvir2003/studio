
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Business Search | Intel Tools Suite',
  description: 'Upload documents and search for business information.',
};

export default function BusinessSearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
