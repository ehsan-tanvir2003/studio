
"use client";

import { useState } from 'react';
import RapidApiTextQueryForm from '@/components/app/RapidApiTextQueryForm'; // Updated import
import RapidApiResultsDisplay from '@/components/app/rapidapi-results-display';
import type { RapidApiTextImageSearchOutput } from '@/ai/flows/rapidapi-text-image-search-flow'; // Updated import
import { searchWithRapidApiAction } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileSearch, Terminal, Loader2 } from "lucide-react"; // Changed Icon
import { useToast } from "@/hooks/use-toast";

export default function TextImageSearchPage() { // Renamed component slightly for clarity
  const [results, setResults] = useState<RapidApiTextImageSearchOutput | null>(null); // Updated type
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const [searchedImage, setSearchedImage] = useState<string | null>(null); // No longer needed for text search
  const { toast } = useToast();

  const handleSearch = async (query: string, limit?: number) => { // Accepts query and optional limit
    setIsLoading(true);
    setResults(null);
    setError(null);
    // setSearchedImage(null); // No longer applicable

    try {
      // Pass query and limit to the action
      const response = await searchWithRapidApiAction(query, limit); 
      if (!response.success && (response.error || response.message)) {
        const errorMessage = response.error || response.message || "RapidAPI request failed.";
        setError(errorMessage);
        setResults(null);
        toast({
          variant: "destructive",
          title: "RapidAPI Error",
          description: errorMessage,
        });
      } else if (!response.success) {
        setError("An unknown error occurred with RapidAPI.");
        setResults(null);
         toast({
          variant: "destructive",
          title: "RapidAPI Error",
          description: "An unknown error occurred.",
        });
      }
      else {
        setResults(response);
        if(!response.matches || response.matches.length === 0) {
            toast({
                title: "No Matches Found",
                description: response.message || "RapidAPI did not find any matches for your query.",
            });
        } else {
             toast({
                title: "Search Complete",
                description: response.message || `RapidAPI found ${response.matches.length} potential match(es).`,
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
        <FileSearch className="mx-auto h-16 w-16 text-primary mb-4" /> {/* Changed Icon */}
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">Image Search Engine</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Enter a query to find relevant images using the Real Time Image Search API.
        </p>
         <p className="text-xs text-muted-foreground/70 mt-2 font-code">
          Ensure RAPIDAPI_KEY and RAPIDAPI_HOST (real-time-image-search.p.rapidapi.com) are correctly configured.
        </p>
      </header>

      <main className="w-full max-w-2xl space-y-12">
        <div>
          <RapidApiTextQueryForm // Using the new form component
            onSubmit={handleSearch} 
            isLoading={isLoading}
          />
          
          {isLoading && (
            <div className="mt-8 text-center py-10 bg-card/50 rounded-lg shadow-md border border-primary/30">
              <div role="status" className="flex flex-col items-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin"/>
                <p className="text-lg text-primary font-code font-medium">
                  [QUERYING_RAPIDAPI_SERVICE...]
                </p>
                <p className="text-sm text-muted-foreground font-code">Please wait while images are fetched.</p>
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
          
          {/* RapidApiResultsDisplay no longer needs searchedImage */}
          {results && !isLoading && <RapidApiResultsDisplay results={results} />} 
        </div>
      </main>
    </div>
  );
}
