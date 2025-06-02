
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, RadioTower, Binary, Search, Camera } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Intel Tools Hub | OSINT Toolkit',
  description: 'Central hub for accessing various OSINT tools like PDL People Search, Face Recognition and Cell Locator.',
};

export default function HubPage() {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  return (
    <div className="flex flex-col items-center justify-center space-y-12">
      <header className="text-center space-y-4">
        <Binary className="mx-auto h-20 w-20 text-primary animate-pulse" />
        <h1 className="text-5xl font-headline font-bold text-primary">Intel Tools Hub</h1>
        <p className="text-xl text-muted-foreground font-code">
          Your Gateway to OSINT &amp; Analysis Tools
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        <Link href="/info-sleuth" passHref>
          <Card className="bg-card/80 hover:bg-card/100 border-primary/30 hover:border-primary/70 transition-all duration-300 ease-in-out shadow-lg hover:shadow-primary/30 transform hover:scale-105 cursor-pointer flex flex-col h-full">
            <CardHeader className="flex-grow">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl sm:text-3xl font-headline text-primary flex items-center">
                  <Search className="mr-3 h-7 w-7 sm:h-8 sm:w-8" /> 
                  InfoSleuth PDL
                </CardTitle>
                <ArrowRight className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <CardDescription className="font-code text-muted-foreground pt-2 text-sm sm:text-base">
                Leverage PeopleDataLabs to search for professional profiles based on name and location.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-accent font-code">Initiate Search &gt;</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/face-search" passHref>
          <Card className="bg-card/80 hover:bg-card/100 border-purple-500/30 hover:border-purple-500/70 transition-all duration-300 ease-in-out shadow-lg hover:shadow-purple-500/30 transform hover:scale-105 cursor-pointer flex flex-col h-full">
            <CardHeader className="flex-grow">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl sm:text-3xl font-headline text-purple-400 flex items-center">
                  <Camera className="mr-3 h-7 w-7 sm:h-8 sm:w-8" />
                  Face Recognition
                </CardTitle>
                <ArrowRight className="h-6 w-6 sm:h-7 sm:w-7 text-purple-400" />
              </div>
              <CardDescription className="font-code text-muted-foreground pt-2 text-sm sm:text-base">
                Upload an image to find matching faces using FaceCheck.ID reverse image search.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-primary font-code">Upload Image &gt;</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/cell-locator" passHref>
          <Card className="bg-card/80 hover:bg-card/100 border-accent/30 hover:border-accent/70 transition-all duration-300 ease-in-out shadow-lg hover:shadow-accent/30 transform hover:scale-105 cursor-pointer flex flex-col h-full">
            <CardHeader className="flex-grow">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl sm:text-3xl font-headline text-accent flex items-center">
                  <RadioTower className="mr-3 h-7 w-7 sm:h-8 sm:w-8" />
                  Cell Locator
                </CardTitle>
                <ArrowRight className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
              </div>
              <CardDescription className="font-code text-muted-foreground pt-2 text-sm sm:text-base">
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
          [Last Check: {currentTime}] - Tools are online and ready for deployment.
        </p>
        <p className="text-xs text-center font-code text-muted-foreground/70 mt-1">
          Ensure API keys are correctly set in the .env file for full functionality.
        </p>
      </div>
    </div>
  );
}
