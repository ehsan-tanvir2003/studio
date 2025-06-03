
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Caller ID Checker | Intel Tools Suite',
  description: 'Look up phone number details using the Eyecon RapidAPI service.',
};

export default function CallerIdCheckerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
