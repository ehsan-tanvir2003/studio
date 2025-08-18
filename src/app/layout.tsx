
"use client";

import * as React from 'react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Navbar from '@/components/app/navbar';
import { Separator } from '@/components/ui/separator';
import SplashScreen from '@/components/app/splash-screen';

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
        <meta name="application-name" content="Tower Locator" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tower Locator" />
        <meta name="description" content="Find approximate cell tower locations in Bangladesh." />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2B5797" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="shortcut icon" href="/favicon.ico" />
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
              {children}
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
