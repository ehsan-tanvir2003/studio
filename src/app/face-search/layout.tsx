
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Face Recognition Search | Intel Tools Suite',
  description: 'Perform reverse image searches for faces using FaceCheck.ID.',
};

export default function FaceSearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
