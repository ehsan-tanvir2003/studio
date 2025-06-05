
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Navbar from '@/components/app/navbar'; // New import
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Intel Tools Hub | OSINT Toolkit', // Moved title from page.tsx to here as it's a client component now
  description: 'Central hub for accessing various OSINT tools like PDL People Search and Cell Locator.', // Moved description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground" suppressHydrationWarning>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="py-8 text-center text-muted-foreground text-xs sm:text-sm space-y-1">
            <p>&copy; {new Date().getFullYear()} Intel Tools Suite. All rights reserved.</p>
            <p>Information is gathered from publicly available sources and is for informational purposes only.</p>
            <p>Cell Tower Location data provided by Unwired Labs.</p>
            <Separator className="my-3 w-1/2 mx-auto bg-border" />
            <p className="font-code">Developed By Flg Offr Ehsan</p>
            <p className="font-code">Bangladesh Air Force</p>
            <p className="font-code">Technical Support Lt Jabid Hasan</p>
            <p className="font-code">Bangladesh Army</p>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
