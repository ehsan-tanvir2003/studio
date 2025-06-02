
"use client";

import { useState, useEffect } from 'react';
import PersonSearchForm from '@/components/app/person-search-form';
import ReportDisplay from '@/components/app/report-display';
import type { PDLPersonSearchOutput } from '@/ai/flows/pdl-person-search-flow'; // Updated import
import { performPersonSearch } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ScanEye, UserSearch, FileScan, Network, ShieldCheck, Loader2, DatabaseZap } from "lucide-react";

const scanningIcons = [
  UserSearch,
  DatabaseZap, 
  FileScan,
  Network,
  ShieldCheck,
];

export default function InfoSleuthPage() {
  const [report, setReport] = useState<PDLPersonSearchOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScanningIconIndex, setCurrentScanningIconIndex] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isLoading) {
      intervalId = setInterval(() => {
        setCurrentScanningIconIndex((prevIndex) => (prevIndex + 1) % scanningIcons.length);
      }, 300); 
    } else {
      clearInterval(intervalId);
    }
    return () => clearInterval(intervalId);
  }, [isLoading]);

  const handleScan = async (fullName: string, city: string) => {
    setIsLoading(true);
    setReport(null);
    setError(null);
    setCurrentScanningIconIndex(0); 
    try {
      const result = await performPersonSearch(fullName, city);
      if ('error' in result) {
        setError(result.error);
      } else {
        setReport(result);
      }
    } catch (e) {
      setError("An unexpected error occurred while initiating the scan.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentIcon = scanningIcons[currentScanningIconIndex];

  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4">
      <header className="mb-10 sm:mb-12 text-center">
        <ScanEye className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">InfoSleuth</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          PeopleDataLabs Profile Enrichment
        </p>
      </header>

      <main className="w-full max-w-3xl space-y-12"> {/* Increased max-width for better report display */}
        <div>
          <PersonSearchForm onSubmit={handleScan} isLoading={isLoading} />
          
          {error && (
            <Alert variant="destructive" className="mt-6 shadow-md border-destructive/70 bg-destructive/10">
              <Terminal className="h-5 w-5 text-destructive" />
              <AlertTitle className="font-headline text-destructive">Scan Error</AlertTitle>
              <AlertDescription className="font-code text-destructive/90">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="mt-8 text-center py-10 bg-card/50 rounded-lg shadow-md border border-primary/30">
              <div role="status" className="flex flex-col items-center space-y-4">
                <div className="relative h-16 w-16">
                    {scanningIcons.map((Icon, index) => (
                        <Icon 
                            key={index}
                            className={`absolute top-0 left-0 h-16 w-16 text-primary transition-opacity duration-200 ease-in-out ${index === currentScanningIconIndex ? 'opacity-100 animate-pulse' : 'opacity-0'}`}
                        />
                    ))}
                </div>
                <p className="text-lg text-primary font-code font-medium">
                  [ENRICHING_PROFILE_FROM_PEOPLEDATALABS...]
                </p>
                <p className="text-sm text-muted-foreground font-code">Fetching detailed information // Please wait...</p>
                 <Loader2 className="w-6 h-6 text-muted-foreground animate-spin"/>
              </div>
            </div>
          )}
          
          {report && !isLoading && <ReportDisplay report={report} />}
        </div>
      </main>
    </div>
  );
}
    
