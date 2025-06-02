
import type { PersonIntelOutput, ProbablePersonMatch } from '@/ai/flows/person-intel-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link as LinkIcon, FileJson, User, Users, MapPin, Briefcase, ExternalLink, CheckCircle, ShieldCheck, Activity } from 'lucide-react';
import Image from 'next/image';

interface ReportDisplayProps {
  report: PersonIntelOutput;
}

export default function ReportDisplay({ report }: ReportDisplayProps) {
  const hasSummary = report.overallSummary && report.overallSummary !== "No specific summary could be generated.";
  const hasMatches = report.probableMatches && report.probableMatches.length > 0;
  const hasSources = report.dataSourcesAnalyzed && report.dataSourcesAnalyzed.length > 0;

  if (!hasSummary && !hasMatches && !hasSources) {
    return (
      <Alert className="mt-8 shadow-md bg-card/80 border-border/50">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        <AlertTitle className="font-headline text-muted-foreground">Search Complete: No Significant Leads</AlertTitle>
        <AlertDescription className="font-code">
          The intelligence sweep did not yield specific actionable information based on the provided criteria.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {hasSummary && (
        <Card className="shadow-xl overflow-hidden bg-card/80 border-primary/30">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-2xl sm:text-3xl font-headline text-primary flex items-center">
              <FileJson className="mr-3 h-7 w-7 sm:h-8 sm:w-8" />
              AI OSINT Briefing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-base sm:text-lg whitespace-pre-wrap leading-relaxed font-code text-foreground/90">{report.overallSummary}</p>
          </CardContent>
        </Card>
      )}

      {hasMatches && (
        <Card className="shadow-xl overflow-hidden bg-card/80 border-border/30">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="text-xl sm:text-2xl font-headline text-secondary-foreground flex items-center">
              <Users className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              Probable Subject Matches
            </CardTitle>
             <CardDescription className="pt-1 font-code text-muted-foreground/80">
              Simulated profiles based on public data analysis. All details are illustrative.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {report.probableMatches.map((match, index) => (
              <Card key={index} className="bg-input/60 border-border/50 hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                <CardHeader className="pb-3 bg-input/30 border-b border-border/40">
                    <div className="flex items-center space-x-4">
                        <Image 
                            src={match.imageUrl || `https://placehold.co/100x100.png`}
                            alt={`Placeholder for ${match.name}`}
                            width={80}
                            height={80}
                            className="rounded-md border border-border/50 object-cover"
                            data-ai-hint={match.imageHint || "profile person"}
                        />
                        <div>
                            <CardTitle className="text-lg font-headline text-accent">{match.name}</CardTitle>
                            <p className="text-xs font-code text-muted-foreground">Source: {match.sourcePlatform}</p>
                            {match.confidenceScore && (
                                <p className="text-xs font-code text-green-400">Confidence: {(match.confidenceScore * 100).toFixed(0)}% (Simulated)</p>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-code text-foreground/80 leading-relaxed">{match.details}</p>
                  {match.locationMatch && (
                    <div className="flex items-center text-xs font-code text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 shrink-0" />
                      <span>{match.locationMatch}</span>
                    </div>
                  )}
                  {match.profileUrl && (
                    <a
                      href={match.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-code text-primary hover:text-primary/80 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 mr-1.5" />
                      [View Simulated Profile/Source_LINK]
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {hasSources && (
        <Card className="shadow-xl overflow-hidden bg-card/80 border-accent/30">
          <CardHeader className="bg-accent/10">
            <CardTitle className="text-xl sm:text-2xl font-headline text-accent flex items-center">
              <LinkIcon className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              Simulated Data Sources
            </CardTitle>
            <CardDescription className="pt-1 font-code text-muted-foreground/80">
              Illustrative URLs analyzed by the AI. These are not real web pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {report.dataSourcesAnalyzed.map((source, index) => (
              <Card key={index} className="bg-input/50 border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-4 w-4 text-accent shrink-0" />
                    <a
                      href={source} // Link will likely be dead as it's simulated
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 hover:underline break-all text-xs sm:text-sm font-code"
                      title={source}
                    >
                      {source}
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    