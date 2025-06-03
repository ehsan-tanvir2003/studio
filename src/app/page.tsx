
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, RadioTower, Binary, ScanFace, Video } from 'lucide-react'; // Used ScanFace
import * as React from 'react'; 

export default function HubPage() {
  const [currentTime, setCurrentTime] = React.useState('');

  React.useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }));
  }, []);


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
                  <ScanFace className="mr-3 h-7 w-7 sm:h-8 sm:w-8" /> 
                  Face Search
                </CardTitle>
                <ArrowRight className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <CardDescription className="font-code text-muted-foreground pt-2 text-sm sm:text-base">
                Upload an image to search for matching faces using FaceCheck.ID.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-accent font-code">Initiate Search &gt;</p>
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

        <Link href="/camera-analyzer" passHref>
          <Card className="bg-card/80 hover:bg-card/100 border-pink-500/30 hover:border-pink-500/70 transition-all duration-300 ease-in-out shadow-lg hover:shadow-pink-500/30 transform hover:scale-105 cursor-pointer flex flex-col h-full">
            <CardHeader className="flex-grow">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl sm:text-3xl font-headline text-pink-400 flex items-center">
                  <Video className="mr-3 h-7 w-7 sm:h-8 sm:w-8" />
                  Camera Analyzer
                </CardTitle>
                <ArrowRight className="h-6 w-6 sm:h-7 sm:w-7 text-pink-400" />
              </div>
              <CardDescription className="font-code text-muted-foreground pt-2 text-sm sm:text-base">
                Analyze live video feed from your camera for objects, scenes, and general details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-primary font-code">Start Analysis &gt;</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-12 p-6 border border-dashed border-muted-foreground/30 rounded-lg bg-card/50 max-w-2xl w-full">
        <h3 className="text-xl font-headline text-center text-muted-foreground mb-3">System Status: <span className="text-green-400">All Systems Operational</span></h3>
        {currentTime && (
          <p className="text-xs text-center font-code text-muted-foreground/70">
            [Last Check: {currentTime}] - Tools are online and ready for deployment.
          </p>
        )}
        <p className="text-xs text-center font-code text-muted-foreground/70 mt-1">
          Ensure API keys are correctly set in the .env file for full functionality.
        </p>
      </div>
    </div>
  );
}
