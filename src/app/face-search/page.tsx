
"use client";

import { useState } from 'react';
import RapidApiImageUploadForm from '@/components/app/rapidapi-image-upload-form';
import RapidApiResultsDisplay from '@/components/app/rapidapi-results-display';
import type { RapidApiImageSearchOutput } from '@/ai/flows/rapidapi-face-search-flow';
import { searchWithRapidApi } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, Image as ImageIcon, Loader2, Terminal, Info } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function RapidApiFaceSearchPage() {
  const [results, setResults] = useState<RapidApiImageSearchOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchedImage, setSearchedImage] = useState<string | null>(null);
  const [apiEndpointUrl, setApiEndpointUrl] = useState<string>(''); // State for API endpoint URL

  const handleSearch = async (imageDataUri: string) => {
    if (!apiEndpointUrl) {
      setError("Please enter the full RapidAPI Endpoint URL for the reverse image search.");
      return;
    }
    setIsLoading(true);
    setResults(null);
    setError(null);
    setSearchedImage(imageDataUri);
    try {
      const response = await searchWithRapidApi(imageDataUri, apiEndpointUrl);
      if (response.error || !response.success) {
        setError(response.error || response.message || "An unknown error occurred during the search.");
        setResults(null);
      } else {
        setResults(response);
      }
    } catch (e) {
      setError("An unexpected error occurred while initiating the RapidAPI search.");
      console.error(e);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4">
      <header className="mb-10 sm:mb-12 text-center">
        <ImageIcon className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">Reverse Image Search (RapidAPI)</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Upload an image to perform a reverse search using a configured RapidAPI service.
        </p>
      </header>

      <main className="w-full max-w-2xl space-y-8">
        <Card className="bg-card/80 border-border/50 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-primary">RapidAPI Configuration</CardTitle>
                <CardDescription className="font-code text-muted-foreground">
                    Enter the specific RapidAPI endpoint URL you want to use for reverse image search.
                    Your RAPIDAPI_KEY and RAPIDAPI_HOST (now set to osint-phone-email-names-search-everything.p.rapidapi.com) 
                    must be correctly configured in the .env file.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label htmlFor="apiEndpointUrl" className="font-code text-muted-foreground">Full RapidAPI Endpoint URL</Label>
                    <Input
                        id="apiEndpointUrl"
                        type="url"
                        placeholder="https://osint-phone-email-names-search-everything.p.rapidapi.com/YOUR_ENDPOINT_PATH"
                        value={apiEndpointUrl}
                        onChange={(e) => setApiEndpointUrl(e.target.value)}
                        className="font-code bg-input/50 focus:bg-input border-border focus:border-primary"
                        disabled={isLoading}
                    />
                     <p className="text-xs font-code text-muted-foreground/70">
                        Ensure this is the complete URL for the reverse image search functionality of the chosen API.
                    </p>
                </div>
            </CardContent>
        </Card>

        <RapidApiImageUploadForm onSubmit={handleSearch} isLoading={isLoading} />
        
        {isLoading && (
          <div className="mt-8 text-center py-10 bg-card/50 rounded-lg shadow-md border border-primary/30">
            <div role="status" className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin"/>
              <p className="text-lg text-primary font-code font-medium">
                [QUERYING_RAPIDAPI_SERVICE...]
              </p>
              <p className="text-sm text-muted-foreground font-code">Please wait while we search for your image.</p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive" className="mt-6 shadow-md border-destructive/70 bg-destructive/10">
            <Terminal className="h-5 w-5 text-destructive" />
            <AlertTitle className="font-headline text-destructive">Search Error</AlertTitle>
            <AlertDescription className="font-code text-destructive/90">
              {error}
               {!error.toLowerCase().includes("rapidapi key") && !error.toLowerCase().includes("rapidapi host") && !error.toLowerCase().includes("endpoint url") && (
                 <p className="mt-2 text-xs">Ensure the RapidAPI Endpoint URL is correct and your RAPIDAPI_KEY/RAPIDAPI_HOST in the .env file are valid for this endpoint.</p>
               )}
            </AlertDescription>
          </Alert>
        )}
        
        {results && !isLoading && !error && <RapidApiResultsDisplay results={results} searchedImage={searchedImage} />}
        
        {!results && !isLoading && !error && (
             <div className="text-center py-8 text-muted-foreground font-code">
              <Info className="mx-auto h-10 w-10 mb-3 text-primary/50"/>
              Upload an image and provide the full RapidAPI endpoint URL to see results.
            </div>
        )}
      </main>
    </div>
  );
}

