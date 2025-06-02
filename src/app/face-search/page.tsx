
"use client";

import { Camera, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function FaceSearchPage() {
  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4">
      <header className="mb-10 sm:mb-12 text-center">
        <Camera className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">Face Recognition Search</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Access FaceCheck.ID for reverse image search
        </p>
      </header>

      <main className="w-full max-w-xl text-center space-y-8">
        <Alert variant="default" className="bg-card/80 border-primary/30 text-left">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <AlertTitle className="font-headline text-primary">Direct Embedding Not Available</AlertTitle>
          <AlertDescription className="font-code text-muted-foreground">
            FaceCheck.ID does not allow its website to be embedded directly on other sites for security reasons.
            To use their face search tool, please visit their website by clicking the button below.
          </AlertDescription>
        </Alert>

        <Link href="https://facecheck.id/" target="_blank" rel="noopener noreferrer" passHref>
          <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-code text-lg py-6 px-8 shadow-lg hover:shadow-primary/40 transition-all duration-300 ease-in-out transform hover:scale-105">
            <ExternalLink className="mr-2 h-5 w-5" />
            Go to FaceCheck.ID
          </Button>
        </Link>
        
        <div className="mt-8 p-4 border border-dashed border-muted-foreground/30 rounded-lg bg-card/50">
            <p className="text-sm font-code text-muted-foreground">
                FaceCheck.ID is a third-party service. Please ensure you use it responsibly and in accordance with their terms of service.
            </p>
        </div>
      </main>
    </div>
  );
}
