
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Face Recognition Search | Intel Tools Suite',
  description: 'Upload an image to search for matching faces using the FaceCheck.ID API.',
};

export default function FaceRecognitionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
