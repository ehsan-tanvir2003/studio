
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ScanEye, RadioTower, Binary } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Intel Tools Hub | OSINT Toolkit',
  description: 'Central hub for accessing various OSINT tools like InfoSleuth and Cell Locator.',
};

export default function HubPage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-12">
      <header className="text-center space-y-4">
        <Binary className="mx-auto h-20 w-20 text-primary animate-pulse" />
        <h1 className="text-5xl font-headline font-bold text-primary">Intel Tools Hub</h1>
        <p className="text-xl text-muted-foreground font-code">
          Your Gateway to OSINT &amp; Analysis Tools
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Link href="/info-sleuth" passHref>
          <Card className="bg-card/80 hover:bg-card/100 border-primary/30 hover:border-primary/70 transition-all duration-300 ease-in-out shadow-lg hover:shadow-primary/30 transform hover:scale-105 cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-headline text-primary flex items-center">
                  <ScanEye className="mr-3 h-8 w-8" />
                  InfoSleuth
                </CardTitle>
                <ArrowRight className="h-7 w-7 text-primary" />
              </div>
              <CardDescription className="font-code text-muted-foreground pt-2">
                Scan phone numbers for publicly available information. Uncover connections, social profiles, and more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-accent font-code">Initiate Scan &gt;</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/cell-locator" passHref>
          <Card className="bg-card/80 hover:bg-card/100 border-accent/30 hover:border-accent/70 transition-all duration-300 ease-in-out shadow-lg hover:shadow-accent/30 transform hover:scale-105 cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-headline text-accent flex items-center">
                  <RadioTower className="mr-3 h-8 w-8" />
                  Cell Locator
                </CardTitle>
                <ArrowRight className="h-7 w-7 text-accent" />
              </div>
              <CardDescription className="font-code text-muted-foreground pt-2">
                Pinpoint approximate cell tower locations using LAC & Cell ID for Bangladesh operators.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-primary font-code">Locate Tower &gt;</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-12 p-6 border border-dashed border-muted-foreground/30 rounded-lg bg-card/50 max-w-2xl w-full">
        <h3 className="text-xl font-headline text-center text-muted-foreground mb-3">System Status: <span className="text-green-400">All Systems Operational</span></h3>
        <p className="text-xs text-center font-code text-muted-foreground/70">
          [Last Check: {new Date().toLocaleTimeString()} UTC] - Tools are online and ready for deployment.
        </p>
      </div>
    </div>
  );
}
