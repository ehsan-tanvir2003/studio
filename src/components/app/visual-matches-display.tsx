
"use client";

import type { VisualMatchesOutput, VisualMatch } from '@/ai/flows/visual-matches-flow';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
    CheckCircle, XCircle, Info, Link as LinkIcon, ExternalLink, Image as ImageIconLucide, SearchCheck, ShoppingCart, Tag, Globe
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VisualMatchesDisplayProps {
  results: VisualMatchesOutput;
}

const MatchCard: React.FC<{ match: VisualMatch }> = ({ match }) => {
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 bg-card/80 border border-border/30">
      {match.thumbnailUrl && (
        <div className="relative w-full h-48 bg-muted">
          <Image 
            src={match.thumbnailUrl} 
            alt={match.title || 'Visual match thumbnail'} 
            layout="fill" 
            objectFit="contain" 
            className="p-1"
            data-ai-hint="visual match product"
          />
        </div>
      )}
      <CardHeader className="pb-3 pt-4">
        {match.title && <CardTitle className="text-lg font-headline leading-tight line-clamp-2 text-primary">{match.title}</CardTitle>}
        {match.source && <CardDescription className="text-xs font-code text-muted-foreground pt-1">{match.source}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-2 text-sm pt-0 pb-4">
        {match.price && (
          <Badge variant="secondary" className="font-semibold bg-accent/20 text-accent-foreground">
            <ShoppingCart className="w-3 h-3 mr-1.5"/> {match.price}
          </Badge>
        )}
        {/* Add more details here if needed, e.g., brand, rating */}
      </CardContent>
      {match.link && (
        <CardFooter className="bg-muted/30 p-3">
          <a
            href={match.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-code text-primary hover:text-primary/80 hover:underline flex items-center w-full"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            View Source
            <span className="ml-auto text-muted-foreground/70 line-clamp-1 break-all max-w-[50%]">
              ({new URL(match.link).hostname})
            </span>
          </a>
        </CardFooter>
      )}
    </Card>
  );
};


export default function VisualMatchesDisplay({ results }: VisualMatchesDisplayProps) {
  if (!results) return null;

  const { success, matches, message, error, rawResponse } = results;

  return (
    <div className="mt-8 space-y-6">
      <Card className="shadow-xl bg-card/90 border-primary/20">
        <CardHeader className="bg-muted/10 p-4 sm:p-6 border-b border-border/30">
          <div className="flex items-center">
            {success && matches && matches.length > 0 ? <SearchCheck className="mr-3 h-7 w-7 text-green-500" /> : <Info className="mr-3 h-7 w-7 text-yellow-500" />}
            <CardTitle className="text-xl sm:text-2xl font-headline text-primary">
              Image Search Results
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {!success && (error || message) && (
            <Alert variant="destructive">
              <XCircle className="h-5 w-5" />
              <AlertTitle>API Error</AlertTitle>
              <AlertDescription className="break-all">{error || message || "An unknown error occurred with the image search API."}</AlertDescription>
            </Alert>
          )}

          {success && (!matches || matches.length === 0) && (
             <div className="text-center py-8 text-muted-foreground font-code">
              <ImageIconLucide className="mx-auto h-10 w-10 mb-3 text-primary/50"/>
              {message || "No visual matches found for the provided image."}
            </div>
          )}

          {success && matches && matches.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match, index) => (
                <MatchCard key={match.link || `match-${index}`} match={match} />
              ))}
            </div>
          )}
        </CardContent>
        
        {message && success && (
          <CardFooter className="bg-muted/20 p-3 sm:p-4 border-t border-border/30">
            <p className="text-xs font-code text-muted-foreground">
              API Message: {message}
            </p>
          </CardFooter>
        )}
      </Card>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="raw-json-visual-matches">
          <AccordionTrigger className="text-sm font-code text-muted-foreground hover:text-primary py-2 bg-card/50 px-4 rounded-md border border-border/30 shadow-sm">View Raw API JSON Response (Debug)</AccordionTrigger>
          <AccordionContent className="p-4 bg-muted/20 rounded-b-md border border-t-0 border-border/30 max-h-96 overflow-auto">
             <ScrollArea className="h-full">
                <pre className="text-xs font-code text-foreground/80 whitespace-pre-wrap break-all">
                {JSON.stringify(rawResponse || results, null, 2)}
                </pre>
             </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
