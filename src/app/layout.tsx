
"use client";

import * as React from 'react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Navbar from '@/components/app/navbar'; 
import { Separator } from '@/components/ui/separator';
import SplashScreen from '@/components/app/splash-screen';
import CellLocatorPage from './cell-locator/page';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500); // 2.5 seconds splash screen
    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground" suppressHydrationWarning={true}>
        {loading ? (
          <SplashScreen />
        ) : (
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
              <CellLocatorPage />
            </main>
            <footer className="py-8 text-center text-muted-foreground text-xs sm:text-sm space-y-1">
              <p>&copy; {new Date().getFullYear()} Tower Locator. All rights reserved.</p>
              <p>Information is gathered from publicly available sources and is for informational purposes only.</p>
              <p>Cell Tower Location data provided by Unwired Labs.</p>
              <Separator className="my-3 w-1/2 mx-auto bg-border" />
              <p className="font-code">Developed By Flg Offr Ehsan</p>
              <p className="font-code">Bangladesh Air Force</p>
              <p className="font-code">Technical Support Lt Jabid Hasan</p>
              <p className="font-code">Bangladesh Army</p>
            </footer>
          </div>
        )}
        <Toaster />
      </body>
    </html>
  );
}
