
"use client";

import { useState } from 'react';
import ImageInputForm from '@/components/app/image-input-form';
import VisualMatchesDisplay from '@/components/app/visual-matches-display';
import type { DirectImageSearchOutput } from '@/ai/flows/direct-image-search-flow'; // Updated type
import { searchWithDirectImageUploadAction } from '@/app/actions'; // Updated action
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUp, Search, Terminal, Loader2, Info, AlertCircle } from "lucide-react"; // Changed ImageIcon to ImageUp
import { useToast } from "@/hooks/use-toast";

export default function ImageSearchPage() {
  const [results, setResults] = useState<DirectImageSearchOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageReady = (dataUri: string | null) => {
    setImageDataUri(dataUri);
    setResults(null); // Clear previous results when a new image is selected
    setError(null);
  };

  const handleSearchWithImage = async () => {
    if (!imageDataUri) {
      setError("Please select or capture an image first.");
      toast({
        variant: "destructive",
        title: "No Image Provided",
        description: "An image is required to perform the search.",
      });
      return;
    }

    setIsLoading(true);
    setResults(null);
    setError(null);

    try {
      const response = await searchWithDirectImageUploadAction(imageDataUri);
      if (!response.success) {
        const errorMessage = response.error || response.message || "Image search API request failed.";
        setError(errorMessage);
        setResults(null);
        toast({
          variant: "destructive",
          title: "Image Search Error",
          description: errorMessage,
        });
      } else {
        setResults(response);
        if (!response.matches || response.matches.length === 0) {
          toast({
            title: "No Matches Found",
            description: response.message || `No visual matches found for the provided image.`,
          });
        } else {
          toast({
            title: "Search Complete",
            description: response.message || `Found ${response.matches.length} visual matches.`,
          });
        }
      }
    } catch (e) {
      const errMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errMessage);
      setResults(null);
      toast({
        variant: "destructive",
        title: "Search Operation Failed",
        description: errMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4">
      <header className="mb-10 sm:mb-12 text-center">
        <ImageUp className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">Reverse Image Search</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Upload or capture an image to find visual matches online.
        </p>
         <p className="text-xs text-muted-foreground/70 mt-2 font-code">
          Ensure RAPIDAPI_KEY, RAPIDAPI_DIRECT_IMAGE_UPLOAD_HOST, and RAPIDAPI_DIRECT_IMAGE_UPLOAD_ENDPOINT_PATH are configured.
        </p>
      </header>

      <main className="w-full max-w-2xl space-y-12"> {/* Changed max-w-3xl to max-w-2xl */}
        <Card className="shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center">
                <ImageUp className="w-6 h-6 mr-2"/>
                Step 1: Provide Your Image
            </CardTitle>
            <CardDescription className="font-code text-sm">
                Upload an image from your device or capture one with your webcam.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageInputForm onImageReady={handleImageReady} isLoading={isLoading} />
            
            {imageDataUri && (
                <Button
                    onClick={handleSearchWithImage}
                    disabled={isLoading || !imageDataUri}
                    className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-code mt-4"
                >
                    {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        SEARCHING...
                    </>
                    ) : (
                    <>
                        <Search className="mr-2 h-5 w-5" />
                        [Search with Image]
                    </>
                    )}
                </Button>
            )}
             <Alert variant="default" className="bg-muted/30 border-primary/20 mt-4">
                <AlertCircle className="h-5 w-5 text-primary" />
                <AlertTitle className="font-semibold text-primary">API Configuration Note</AlertTitle>
                <AlertDescription className="text-xs">
                    This tool uses a RapidAPI service that accepts direct image uploads. Ensure `RAPIDAPI_KEY`, `RAPIDAPI_DIRECT_IMAGE_UPLOAD_HOST`, and `RAPIDAPI_DIRECT_IMAGE_UPLOAD_ENDPOINT_PATH` are correctly set in your .env file.
                    The backend flow (`direct-image-search-flow.ts`) might need adjustments to the `FormData` field name (default: `image_file`) and response parsing based on your chosen API.
                </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        {isLoading && !results && (
          <div className="mt-8 text-center py-10 bg-card/50 rounded-lg shadow-md border border-primary/30">
            <div role="status" className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-lg text-primary font-code font-medium">
                [ANALYZING_UPLOADED_IMAGE...]
              </p>
              <p className="text-sm text-muted-foreground font-code">Please wait, this may take a moment.</p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive" className="mt-6 shadow-md border-destructive/70 bg-destructive/10">
            <Terminal className="h-5 w-5 text-destructive" />
            <AlertTitle className="font-headline text-destructive">Search Error</AlertTitle>
            <AlertDescription className="font-code text-destructive/90 break-all">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Ensure VisualMatchesDisplay expects DirectImageSearchOutput or similar structure */}
        {results && !isLoading && <VisualMatchesDisplay results={results} />} 
      </main>
    </div>
  );
}

    