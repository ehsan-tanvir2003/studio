
"use client";

import { useState } from 'react';
import FaceUploadForm from '@/components/app/face-upload-form';
import FaceCheckResultsDisplay from '@/components/app/face-check-results-display';
import type { FaceCheckOutput } from '@/ai/flows/face-check-flow';
import { searchWithFaceCheckApi } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, Users, Loader2, Terminal } from "lucide-react";

export default function FaceSearchPage() {
  const [results, setResults] = useState<FaceCheckOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchedImage, setSearchedImage] = useState<string | null>(null);

  const handleSearch = async (imageDataUri: string) => {
    setIsLoading(true);
    setResults(null);
    setError(null);
    setSearchedImage(imageDataUri); 

    try {
      const response = await searchWithFaceCheckApi(imageDataUri);
      if (!response.success) {
        // Prioritize specific error from flow if present, then API message, then generic
        const displayError = response.error || response.message || "FaceCheck.ID search failed. Please check the logs.";
        setError(displayError);
        setResults(null); // Ensure no old results are shown on error
      } else {
        setResults(response);
      }
    } catch (e) {
      setError("An unexpected error occurred while initiating the FaceCheck.ID search.");
      console.error(e);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4">
      <header className="mb-10 sm:mb-12 text-center">
        <Camera className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">Face Recognition Search</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Upload an image to search for faces using FaceCheck.ID
        </p>
      </header>

      <main className="w-full max-w-2xl space-y-12">
        <div>
          <FaceUploadForm 
            onSubmit={handleSearch} 
            isLoading={isLoading}
          />
          
          {isLoading && (
            <div className="mt-8 text-center py-10 bg-card/50 rounded-lg shadow-md border border-primary/30">
              <div role="status" className="flex flex-col items-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin"/>
                <p className="text-lg text-primary font-code font-medium">
                  [PROCESSING_IMAGE_AND_QUERYING_FACECHECK.ID...]
                </p>
                {searchedImage && (
                  <Image src={searchedImage} alt="Uploaded for search" width={100} height={100} className="mt-2 rounded-md object-cover" data-ai-hint="uploaded face"/>
                )}
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
          
          {results && !isLoading && <FaceCheckResultsDisplay results={results} searchedImage={searchedImage}/>}
        </div>
      </main>
    </div>
  );
}
