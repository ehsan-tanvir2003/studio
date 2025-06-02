
"use client";

import { useState } from 'react';
import PersonSearchForm from '@/components/app/person-search-form';
import PdlResultsDisplay from '@/components/app/pdl-results-display';
import type { PdlPersonSearchOutput } from '@/ai/flows/pdl-person-search-flow';
import { searchPdlProfiles } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Search, Users, Loader2 } from "lucide-react";

export default function InfoSleuthPage() {
  const [results, setResults] = useState<PdlPersonSearchOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<{fullName: string, location: string} | null>(null);

  const handleSearch = async (fullName: string, location: string) => {
    setIsLoading(true);
    setResults(null);
    setError(null);
    setSearchQuery({fullName, location});
    try {
      const response = await searchPdlProfiles(fullName, location, 10); // Fetch 10 results
      if (response.error) {
        setError(response.error);
        setResults(null);
      } else {
        setResults(response);
      }
    } catch (e) {
      setError("An unexpected error occurred while initiating the PDL search.");
      console.error(e);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4">
      <header className="mb-10 sm:mb-12 text-center">
        <Users className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">InfoSleuth - People Data Search</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Search for individuals using PeopleDataLabs
        </p>
      </header>

      <main className="w-full max-w-3xl space-y-12">
        <div>
          <PersonSearchForm 
            onSubmit={handleSearch} 
            isLoading={isLoading}
            formTitle="PDL Search Parameters"
            fullNameLabel="Target Full Name"
            fullNamePlaceholder="[Enter Full Name to Search PDL]"
            fullNameDescription="Provide the full name for the PDL search."
            locationLabel="Location (City/Region/Country)"
            locationPlaceholder="[e.g., Dhaka, London, or Bangladesh]"
            locationDescription="Specify a location to refine the PDL search."
            buttonText="Search PDL"
            loadingButtonText="Searching PDL Database..."
          />
          
          {isLoading && (
            <div className="mt-8 text-center py-10 bg-card/50 rounded-lg shadow-md border border-primary/30">
              <div role="status" className="flex flex-col items-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin"/>
                <p className="text-lg text-primary font-code font-medium">
                  [QUERYING_PEOPLEDATALABS_DATABASE...]
                </p>
                <p className="text-sm text-muted-foreground font-code">Searching for: {searchQuery?.fullName} in {searchQuery?.location}</p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="mt-6 shadow-md border-destructive/70 bg-destructive/10">
              <Terminal className="h-5 w-5 text-destructive" />
              <AlertTitle className="font-headline text-destructive">Search Error</AlertTitle>
              <AlertDescription className="font-code text-destructive/90">
                {error}
                {results?.pdlQuery && <p className="mt-2 text-xs">PDL Query Attempted: {results.pdlQuery}</p>}
              </AlertDescription>
            </Alert>
          )}
          
          {results && !isLoading && !error && <PdlResultsDisplay results={results} />}
        </div>
      </main>
    </div>
  );
}
