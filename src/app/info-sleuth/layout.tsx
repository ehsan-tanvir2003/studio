
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'InfoSleuth - Person Intel Analysis',
  description: 'Gather OSINT about individuals based on name and city. Illustrative tool.',
};

export default function InfoSleuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}

    