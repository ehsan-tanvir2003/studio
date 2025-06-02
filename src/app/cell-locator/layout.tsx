
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cell Tower Locator | Bangladesh',
  description: 'Find approximate cell tower locations in Bangladesh using LAC, Cell ID, and operator MNC.',
};

export default function CellLocatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
