
"use client";

import { useState } from 'react';
import FaceUploadForm from '@/components/app/face-upload-form';
import FaceCheckResultsDisplay from '@/components/app/face-check-results-display';
import type { FaceCheckOutput } from '@/ai/flows/face-check-flow';
import { searchFaceWithFaceCheckAction } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScanFace, Terminal, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FaceRecognitionPage() {
  const [results, setResults] = useState<FaceCheckOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchedImage, setSearchedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async (imageDataUri: string) => {
    setIsLoading(true);
    setResults(null);
    setError(null);
    setSearchedImage(imageDataUri);

    try {
      const response = await searchFaceWithFaceCheckAction(imageDataUri);
      if (!response.success && (response.error || response.message)) {
        const errorMessage = response.error || response.message || "FaceCheck.ID API request failed.";
        setError(errorMessage);
        setResults(null);
        toast({
          variant: "destructive",
          title: "FaceCheck.ID Error",
          description: errorMessage,
        });
      } else if (!response.success) {
        setError("An unknown error occurred with FaceCheck.ID.");
        setResults(null);
         toast({
          variant: "destructive",
          title: "FaceCheck.ID Error",
          description: "An unknown error occurred.",
        });
      }
      else {
        setResults(response);
        if(response.items_count === 0) {
            toast({
                title: "No Matches Found",
                description: "FaceCheck.ID did not find any matches for the uploaded image.",
            });
        } else {
             toast({
                title: "Search Complete",
                description: `FaceCheck.ID found ${response.items_count} potential match(es).`,
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
        <ScanFace className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">Face Recognition Search</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Upload an image to find matching faces via FaceCheck.ID
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
                  [QUERYING_FACECHECK.ID_DATABASE...]
                </p>
                <p className="text-sm text-muted-foreground font-code">Please wait while the image is processed.</p>
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
          
          {results && !isLoading && <FaceCheckResultsDisplay results={results} searchedImage={searchedImage} />}
        </div>
      </main>
    </div>
  );
}
