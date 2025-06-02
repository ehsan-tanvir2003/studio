
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'InfoSleuth - Phone Number Intelligence',
  description: 'Gather intelligence about mobile numbers from public sources. OSINT tool for phone number analysis.',
};

export default function InfoSleuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
