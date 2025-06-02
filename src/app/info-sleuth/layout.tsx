
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Profile Synthesizer | Intel Suite',
  description: 'Generate an illustrative OSINT-style person profile using AI.',
};

export default function AiProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
