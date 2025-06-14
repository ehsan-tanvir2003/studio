
"use client";

import { useState } from 'react';
import ImageInputForm from '@/components/app/image-input-form';
import VisualMatchesDisplay from '@/components/app/visual-matches-display';
import type { VisualMatchesOutput } from '@/ai/flows/visual-matches-flow';
import { searchVisualMatchesAction } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon Lucide, Search, Terminal, Loader2, Info, UploadCloud, LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ImageSearchPage() {
  const [results, setResults] = useState<VisualMatchesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [publicImageUrl, setPublicImageUrl] = useState<string>('');
  const { toast } = useToast();

  const handleImageReady = (dataUri: string | null) => {
    setUploadedImagePreview(dataUri);
    // Clear previous results when a new image is uploaded/captured
    setResults(null);
    setError(null);
    setPublicImageUrl(''); // Reset public URL input
  };

  const handleSearchWithPublicUrl = async () => {
    if (!publicImageUrl || !publicImageUrl.startsWith('http')) {
      setError("Please enter a valid, publicly accessible image URL (http:// or https://).");
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "A valid public image URL is required for the search.",
      });
      return;
    }

    setIsLoading(true);
    setResults(null);
    setError(null);

    try {
      // For this API, language and country are part of the flow defaults or can be fixed.
      const response = await searchVisualMatchesAction(publicImageUrl);
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
            description: response.message || `No visual matches found for the provided image URL.`,
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
        <ImageIconLucide className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">Reverse Image Search</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Upload or capture an image, then search for visual matches online.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-2 font-code">
          Uses Real-Time Lens Data API. Ensure RAPIDAPI_KEY and RAPIDAPI_LENS_HOST are configured.
        </p>
      </header>

      <main className="w-full max-w-3xl space-y-12">
        <Card className="shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center">
                <UploadCloud className="w-6 h-6 mr-2"/>
                Step 1: Provide an Image
            </CardTitle>
            <CardDescription className="font-code text-sm">
                Upload an image from your device or capture one using your webcam.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageInputForm onImageReady={handleImageReady} isLoading={isLoading} />
          </CardContent>
        </Card>
        
        {uploadedImagePreview && (
          <Card className="shadow-lg border-border/30">
            <CardHeader>
                 <CardTitle className="font-headline text-xl text-primary flex items-center">
                    <LinkIcon className="w-6 h-6 mr-2"/>
                    Step 2: Get a Public URL & Search
                </CardTitle>
                 <CardDescription className="font-code text-sm">
                    This API requires a public URL. Upload the image above to a service like Imgur, then paste the direct image URL here.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert variant="default" className="bg-muted/30 border-primary/20">
                    <Info className="h-5 w-5 text-primary" />
                    <AlertTitle className="font-semibold text-primary">Manual Step Required</AlertTitle>
                    <AlertDescription className="text-xs">
                        To proceed, upload the image preview (shown in Step 1) to a public image hosting service (e.g., Imgur, PostImage). Then, copy the **direct link** to the image (usually ending in .jpg, .png, etc.) and paste it into the URL field below.
                        Automatic temporary hosting with auto-deletion is a complex feature for a later version.
                    </AlertDescription>
                </Alert>

              <div className="space-y-2">
                <label htmlFor="publicImageUrl" className="font-code text-sm text-muted-foreground">Public Image URL</label>
                <Input
                  id="publicImageUrl"
                  type="url"
                  placeholder="https://example.com/your-image.jpg"
                  value={publicImageUrl}
                  onChange={(e) => setPublicImageUrl(e.target.value)}
                  disabled={isLoading}
                  className="font-code bg-input/50 focus:bg-input border-border focus:border-primary h-11"
                />
              </div>
              <Button
                onClick={handleSearchWithPublicUrl}
                disabled={isLoading || !publicImageUrl}
                className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-code"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    SEARCHING...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    [Search with Image URL]
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading && !results && (
          <div className="mt-8 text-center py-10 bg-card/50 rounded-lg shadow-md border border-primary/30">
            <div role="status" className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-lg text-primary font-code font-medium">
                [ANALYZING_IMAGE_VIA_LENS_API...]
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

        {results && !isLoading && <VisualMatchesDisplay results={results} />}
      </main>
    </div>
  );
}
