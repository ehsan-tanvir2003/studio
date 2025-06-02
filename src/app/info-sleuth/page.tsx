
"use client";

import { useState } from 'react';
import PhoneNumberForm from '@/components/app/phone-number-form';
import ReportDisplay from '@/components/app/report-display';
import type { NumberScanOutput } from '@/ai/flows/number-scan';
import { performNumberScan } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ScanEye } from "lucide-react";
import type { Metadata } from 'next';

// It's not possible to export Metadata from client components.
// Create a layout.tsx for this route or handle metadata differently if needed.
// For now, title will be set by RootLayout or a potential info-sleuth/layout.tsx

export default function InfoSleuthPage() {
  const [report, setReport] = useState<NumberScanOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleScan = async (phoneNumber: string) => {
    setIsLoading(true);
    setReport(null);
    setError(null);
    try {
      const result = await performNumberScan(phoneNumber);
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

  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4">
      <header className="mb-10 sm:mb-12 text-center">
        <ScanEye className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">InfoSleuth</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Phone Number OSINT Analysis
        </p>
      </header>

      <main className="w-full max-w-2xl space-y-12">
        <div>
          <PhoneNumberForm onSubmit={handleScan} isLoading={isLoading} />
          
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
            <div className="mt-8 text-center py-10 bg-card/50 rounded-lg shadow-md">
              <div role="status" className="flex flex-col items-center">
                <svg aria-hidden="true" className="w-10 h-10 text-muted-foreground animate-spin fill-primary" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <p className="mt-4 text-lg text-primary font-code font-medium">
                  [AI_CORE_SCANNING_PUBLIC_NETWORKS...]
                </p>
                <p className="text-sm text-muted-foreground font-code">Hold tight // This may take a moment...</p>
              </div>
            </div>
          )}
          
          {report && !isLoading && <ReportDisplay report={report} />}
        </div>
      </main>
    </div>
  );
}
