
"use client";

import type { RapidApiImageSearchOutput, RapidApiMatch } from '@/ai/flows/rapidapi-face-search-flow';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, ExternalLink, Info, CameraOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


interface RapidApiResultsDisplayProps {
  results: RapidApiImageSearchOutput;
  searchedImage: string | null; 
}

const MatchCard: React.FC<{ match: RapidApiMatch }> = ({ match }) => {
  const getScoreBadgeVariant = (score?: number | null) => {
    if (score === null || score === undefined) return "secondary";
    if (score > 75) return "default"; // Will use primary color
    if (score > 50) return "secondary"; // Consider a yellow-ish or orange for mid scores
    return "destructive";
  };
  
  const getScoreBadgeClass = (score?: number | null) => {
    if (score === null || score === undefined) return "";
    if (score > 75) return "bg-green-500/80 text-white";
    if (score > 50) return "bg-yellow-500/80 text-black";
    return "bg-red-500/80 text-white";
  }

  return (
    <Card className="bg-card/70 border-border/40 shadow-md hover:shadow-primary/20 transition-shadow duration-300 overflow-hidden">
      <CardContent className="p-3">
        <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-3">
          {match.thumbnail ? (
            <Image
              src={match.thumbnail}
              alt={match.title || "Match thumbnail"}
              width={100}
              height={100}
              className="rounded border border-border object-cover aspect-square"
              data-ai-hint="image match"
              onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails to load
            />
          ) : (
            <div className="w-[100px] h-[100px] bg-muted rounded border border-border flex items-center justify-center">
              <CameraOff className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {match.title && <p className="text-sm font-semibold text-foreground truncate" title={match.title}>{match.title}</p>}
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              <a 
                href={match.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline break-all"
                title={match.url}
              >
                {match.url} <ExternalLink className="inline h-3 w-3 ml-0.5" />
              </a>
            </p>
            {match.score !== undefined && match.score !== null && (
              <p className="text-sm text-foreground font-semibold mt-1">
                Score: <Badge variant={getScoreBadgeVariant(match.score)} className={getScoreBadgeClass(match.score)}>{match.score}%</Badge>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function RapidApiResultsDisplay({ results, searchedImage }: RapidApiResultsDisplayProps) {
  if (!results) return null;

  return (
    <div className="mt-8 space-y-6">
      <Card className="shadow-xl bg-card/90 border-primary/20">
        <CardHeader className="bg-muted/10 p-4 sm:p-6 border-b border-border/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center">
              {results.success ? <CheckCircle className="mr-3 h-7 w-7 text-green-500" /> : <XCircle className="mr-3 h-7 w-7 text-destructive" />}
              <CardTitle className="text-xl sm:text-2xl font-headline text-primary">
                RapidAPI Image Search Results
              </CardTitle>
            </div>
            {results.success && results.matches && results.matches.length > 0 && (
              <Badge variant="secondary" className="font-code text-base sm:text-lg px-3 py-1 self-start sm:self-center">
                {results.matches.length} Match(es)
              </Badge>
            )}
          </div>
          {searchedImage && (
            <div className="mt-3 pt-3 border-t border-border/20 flex flex-col sm:flex-row items-center gap-3">
              <Image src={searchedImage} alt="Searched image" width={60} height={60} className="rounded-md border border-border object-cover" data-ai-hint="searched image rapidapi"/>
              <p className="text-xs font-code text-muted-foreground text-center sm:text-left">Results for the uploaded image.</p>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {!results.success && (results.message || results.error) && (
            <Alert variant="destructive">
              <XCircle className="h-5 w-5" />
              <AlertTitle>API Error</AlertTitle>
              <AlertDescription>{results.message || results.error || "An unknown error occurred."}</AlertDescription>
            </Alert>
          )}

          {results.success && results.matches && results.matches.length > 0 && (
            <ScrollArea className="h-[400px] sm:h-[500px] pr-3">
              <div className="space-y-3">
                {results.matches.map((match, index) => (
                  <MatchCard key={`${match.url}-${index}`} match={match} />
                ))}
              </div>
            </ScrollArea>
          )}
          
          {results.success && (!results.matches || results.matches.length === 0) && (
             <div className="text-center py-8 text-muted-foreground font-code">
              <Info className="mx-auto h-10 w-10 mb-3 text-primary/50"/>
              {results.message || "No matching images found by the RapidAPI service."}
            </div>
          )}
        </CardContent>
        
        {results.message && results.success && (
          <CardFooter className="bg-muted/20 p-3 sm:p-4 border-t border-border/30">
            <p className="text-xs font-code text-muted-foreground">
              API Message: {results.message}
            </p>
          </CardFooter>
        )}
      </Card>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="raw-json-rapidapi">
          <AccordionTrigger className="text-sm font-code text-muted-foreground hover:text-primary py-2 bg-card/50 px-4 rounded-md border border-border/30 shadow-sm">View Raw RapidAPI JSON Response (Debug)</AccordionTrigger>
          <AccordionContent className="p-4 bg-muted/20 rounded-b-md border border-t-0 border-border/30 max-h-96 overflow-auto">
            <pre className="text-xs font-code text-foreground/80 whitespace-pre-wrap break-all">
              {JSON.stringify(results.rawResponse || results, null, 2)}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
