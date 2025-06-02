
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'InfoSleuth | People Data Search',
  description: 'Search for individuals using PeopleDataLabs.',
};

export default function InfoSleuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
