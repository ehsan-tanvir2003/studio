
import type { NumberScanOutput } from '@/ai/flows/number-scan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link as LinkIcon, FileText, Info, Users, MapPin, CheckCircle2, Briefcase, Building, Star, Users2, FileJson, Terminal } from 'lucide-react';

interface ReportDisplayProps {
  report: NumberScanOutput;
}

const getSourceIcon = (url: string): React.ReactNode => {
  try {
    const lcUrl = url.toLowerCase();
    if (lcUrl.endsWith('.pdf')) return <FileText className="h-5 w-5 text-accent shrink-0" />;
    if (lcUrl.endsWith('.doc') || lcUrl.endsWith('.docx')) return <FileText className="h-5 w-5 text-accent shrink-0" />;
    if (lcUrl.endsWith('.xls') || lcUrl.endsWith('.xlsx')) return <FileText className="h-5 w-5 text-accent shrink-0" />;
    if (lcUrl.includes('facebook.com') || lcUrl.includes('linkedin.com') || lcUrl.includes('twitter.com') || lcUrl.includes('instagram.com')) return <Users2 className="h-5 w-5 text-accent shrink-0" />;
  } catch (e) {
    // Invalid URL, fallback
  }
  return <LinkIcon className="h-5 w-5 text-accent shrink-0" />;
};

export default function ReportDisplay({ report }: ReportDisplayProps) {
  const hasSummary = report.summary && report.summary !== "No specific summary could be generated for this number." && report.summary !== "No summary available.";
  const hasSources = report.sources && report.sources.length > 0;
  const hasNames = report.associatedNames && report.associatedNames.length > 0;
  const hasLocations = report.potentialLocations && report.potentialLocations.length > 0;
  const hasSocialProfiles = report.socialMediaProfiles && report.socialMediaProfiles.length > 0;
  const hasBusinessListings = report.businessListings && report.businessListings.length > 0;

  if (!hasSummary && !hasSources && !hasNames && !hasLocations && !hasSocialProfiles && !hasBusinessListings) {
    return (
      <Alert className="mt-8 shadow-md bg-card/80 border-border/50">
        <Terminal className="h-5 w-5 text-muted-foreground" />
        <AlertTitle className="font-headline text-muted-foreground">Scan Complete: No Actionable Intel</AlertTitle>
        <AlertDescription className="font-code">
          Public domain scan yielded no specific information or relevant details for the target number.
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
              AI Intelligence Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-base sm:text-lg whitespace-pre-wrap leading-relaxed font-code text-foreground/90">{report.summary}</p>
          </CardContent>
        </Card>
      )}

      {hasNames && (
        <Card className="shadow-xl overflow-hidden bg-card/80 border-border/30">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="text-xl sm:text-2xl font-headline text-secondary-foreground flex items-center">
              <Users className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              Associated Entities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            {report.associatedNames?.map((name, index) => (
              <div key={index} className="text-base bg-input/50 p-3 rounded-md border border-border/50 font-code text-foreground/90">
                {name}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {hasLocations && (
        <Card className="shadow-xl overflow-hidden bg-card/80 border-border/30">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="text-xl sm:text-2xl font-headline text-secondary-foreground flex items-center">
              <MapPin className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              Geographic Markers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            {report.potentialLocations?.map((location, index) => (
              <div key={index} className="text-base bg-input/50 p-3 rounded-md border border-border/50 font-code text-foreground/90">
                {location}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {hasSocialProfiles && (
         <Card className="shadow-xl overflow-hidden bg-card/80 border-border/30">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="text-xl sm:text-2xl font-headline text-secondary-foreground flex items-center">
              <Users2 className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              Social Network Footprints
            </CardTitle>
             <CardDescription className="pt-1 font-code text-muted-foreground/80">
              Simulated social media presence based on public data analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {report.socialMediaProfiles?.map((profile, index) => (
              <Card key={index} className="bg-input/50 border-border/50 hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                     <Users2 className="h-5 w-5 text-accent shrink-0 mt-1" />
                    <div className="flex-grow font-code">
                      <p className="font-semibold text-base text-foreground/90">{profile.platform}</p>
                      <p className="text-sm text-muted-foreground/80 break-all">{profile.handleOrUrl}</p>
                      {profile.accountType && <p className="text-xs text-muted-foreground/70 mt-1">Type: {profile.accountType}</p>}
                      {profile.followerCountEstimate && <p className="text-xs text-muted-foreground/70 mt-1">Followers: {profile.followerCountEstimate}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {hasBusinessListings && (
        <Card className="shadow-xl overflow-hidden bg-card/80 border-border/30">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="text-xl sm:text-2xl font-headline text-secondary-foreground flex items-center">
              <Briefcase className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              Commercial Entity Traces
            </CardTitle>
            <CardDescription className="pt-1 font-code text-muted-foreground/80">
              Simulated business-related information derived from public data patterns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {report.businessListings?.map((listing, index) => (
              <Card key={index} className="bg-input/50 border-border/50 hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-accent shrink-0 mt-1" />
                    <div className="flex-grow font-code">
                      {listing.businessName && <p className="font-semibold text-base text-foreground/90">{listing.businessName}</p>}
                      {listing.category && <p className="text-sm text-muted-foreground/80">{listing.category}</p>}
                      {listing.shortDescription && <p className="text-xs text-muted-foreground/70 mt-2">{listing.shortDescription}</p>}
                      {listing.simulatedRating && (
                        <div className="flex items-center mt-2">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" /> 
                          <p className="text-xs text-muted-foreground/70">{listing.simulatedRating}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {hasSources && (
        <Card className="shadow-xl overflow-hidden bg-card/80 border-accent/30">
          <CardHeader className="bg-accent/10">
            <CardTitle className="text-2xl sm:text-3xl font-headline text-accent flex items-center">
              <LinkIcon className="mr-3 h-7 w-7 sm:h-8 sm:w-8" />
              Referenced Data Sources
            </CardTitle>
            <CardDescription className="pt-1 font-code text-muted-foreground/80">
              Publicly accessible links analyzed by AI. Accuracy not guaranteed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {report.sources.map((source, index) => (
              <Card key={index} className="bg-input/50 border-border/50 hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <span className="mt-1">{getSourceIcon(source)}</span>
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 hover:underline break-all text-sm sm:text-base font-code"
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
