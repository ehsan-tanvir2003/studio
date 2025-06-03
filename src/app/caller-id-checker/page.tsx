
"use client";

import { useState } from 'react';
import CallerIdForm from '@/components/app/caller-id-form';
import CallerIdResultsDisplay from '@/components/app/caller-id-results-display';
import type { CallerIdSearchOutput } from '@/ai/flows/caller-id-search-flow';
import { searchCallerIdDetails } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Smartphone, Terminal, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CallerIdCheckerPage() {
  const [results, setResults] = useState<CallerIdSearchOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (phoneNumber: string) => {
    setIsLoading(true);
    setResults(null);
    setError(null);

    try {
      const response = await searchCallerIdDetails(phoneNumber);
      if (!response.success && (response.error || response.message)) {
        const errorMessage = response.error || response.message || "Caller ID API request failed.";
        setError(errorMessage);
        setResults(null);
        toast({
          variant: "destructive",
          title: "Caller ID Error",
          description: errorMessage,
        });
      } else if (!response.success) {
        setError("An unknown error occurred with the Caller ID API.");
        setResults(null);
         toast({
          variant: "destructive",
          title: "Caller ID Error",
          description: "An unknown error occurred.",
        });
      }
      else {
        setResults(response);
        if(!response.data) {
            toast({
                title: "No Information Found",
                description: response.message || `No details found for ${phoneNumber}.`,
            });
        } else {
             toast({
                title: "Search Complete",
                description: response.message || `Details retrieved for ${phoneNumber}.`,
            });
        }
      }
    } catch (e) {
      const errMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errMessage);
      console.error(e);
      setResults(null);
      toast({
        variant: "destructive",
        title: "Search Exception",
        description: errMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4">
      <header className="mb-10 sm:mb-12 text-center">
        <Smartphone className="mx-auto h-16 w-16 text-primary mb-4" /> 
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">Caller ID Checker</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Enter a phone number to fetch available details using Eyecon API.
        </p>
         <p className="text-xs text-muted-foreground/70 mt-2 font-code">
          Ensure RAPIDAPI_KEY and RAPIDAPI_EYECON_HOST are configured.
        </p>
      </header>

      <main className="w-full max-w-2xl space-y-12">
        <div>
          <CallerIdForm
            onSubmit={handleSearch} 
            isLoading={isLoading}
          />
          
          {isLoading && (
            <div className="mt-8 text-center py-10 bg-card/50 rounded-lg shadow-md border border-primary/30">
              <div role="status" className="flex flex-col items-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin"/>
                <p className="text-lg text-primary font-code font-medium">
                  [FETCHING_CALLER_ID_INFO...]
                </p>
                <p className="text-sm text-muted-foreground font-code">Please wait while details are retrieved.</p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="mt-6 shadow-md border-destructive/70 bg-destructive/10">
              <Terminal className="h-5 w-5 text-destructive" />
              <AlertTitle className="font-headline text-destructive">Search Error</AlertTitle>
              <AlertDescription className="font-code text-destructive/90">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {results && !isLoading && <CallerIdResultsDisplay results={results} />} 
        </div>
      </main>
    </div>
  );
}
