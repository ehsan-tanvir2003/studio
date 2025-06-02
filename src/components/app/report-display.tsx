
import type { NumberScanOutput } from '@/ai/flows/number-scan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link as LinkIcon, FileText, Info, Users, MapPin, CheckCircle2, Briefcase, Building, Star, Users2, BarChart3 } from 'lucide-react';

interface ReportDisplayProps {
  report: NumberScanOutput;
}

const getSourceIcon = (url: string): React.ReactNode => {
  try {
    const lcUrl = url.toLowerCase();
    if (lcUrl.endsWith('.pdf')) return <FileText className="h-5 w-5 text-accent shrink-0" />;
    if (lcUrl.endsWith('.doc') || lcUrl.endsWith('.docx')) return <FileText className="h-5 w-5 text-accent shrink-0" />;
    if (lcUrl.endsWith('.xls') || lcUrl.endsWith('.xlsx')) return <FileText className="h-5 w-5 text-accent shrink-0" />;
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
      <Alert className="mt-8 shadow-md">
        <Info className="h-5 w-5" />
        <AlertTitle className="font-headline">Scan Complete</AlertTitle>
        <AlertDescription>
          No specific public information or relevant details were found for this number.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {hasSummary && (
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-2xl sm:text-3xl font-headline text-primary flex items-center">
              <CheckCircle2 className="mr-3 h-7 w-7 sm:h-8 sm:w-8" />
              Investigation Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-base sm:text-lg whitespace-pre-wrap leading-relaxed">{report.summary}</p>
          </CardContent>
        </Card>
      )}

      {hasNames && (
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="text-xl sm:text-2xl font-headline text-secondary-foreground flex items-center">
              <Users className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              Associated Names
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            {report.associatedNames?.map((name, index) => (
              <div key={index} className="text-base bg-card p-3 rounded-md border border-border">
                {name}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {hasLocations && (
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="text-xl sm:text-2xl font-headline text-secondary-foreground flex items-center">
              <MapPin className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              Location Clues
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            {report.potentialLocations?.map((location, index) => (
              <div key={index} className="text-base bg-card p-3 rounded-md border border-border">
                {location}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {hasSocialProfiles && (
         <Card className="shadow-xl overflow-hidden">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="text-xl sm:text-2xl font-headline text-secondary-foreground flex items-center">
              <Users2 className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              Social Media Footprints
            </CardTitle>
             <CardDescription className="pt-1">
              Hints of social media presence found in public data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {report.socialMediaProfiles?.map((profile, index) => (
              <Card key={index} className="bg-card border-border hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                     <Users2 className="h-5 w-5 text-accent shrink-0 mt-1" />
                    <div className="flex-grow">
                      <p className="font-semibold text-base">{profile.platform}</p>
                      <p className="text-sm text-muted-foreground break-all">{profile.handleOrUrl}</p>
                      {profile.accountType && <p className="text-xs text-muted-foreground mt-1">Type: {profile.accountType}</p>}
                      {profile.followerCountEstimate && <p className="text-xs text-muted-foreground mt-1">Followers: {profile.followerCountEstimate}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {hasBusinessListings && (
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="text-xl sm:text-2xl font-headline text-secondary-foreground flex items-center">
              <Briefcase className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              Business Listings
            </CardTitle>
            <CardDescription className="pt-1">
              Potential business-related information found in public data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {report.businessListings?.map((listing, index) => (
              <Card key={index} className="bg-card border-border hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-accent shrink-0 mt-1" />
                    <div className="flex-grow">
                      {listing.businessName && <p className="font-semibold text-base">{listing.businessName}</p>}
                      {listing.category && <p className="text-sm text-muted-foreground">{listing.category}</p>}
                      {listing.shortDescription && <p className="text-xs text-muted-foreground mt-2">{listing.shortDescription}</p>}
                      {listing.simulatedRating && (
                        <div className="flex items-center mt-2">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" /> 
                          <p className="text-xs text-muted-foreground">{listing.simulatedRating}</p>
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
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="bg-accent/10">
            <CardTitle className="text-2xl sm:text-3xl font-headline text-accent flex items-center">
              <LinkIcon className="mr-3 h-7 w-7 sm:h-8 sm:w-8" />
              Discovered Sources
            </CardTitle>
            <CardDescription className="pt-1">
              Publicly accessible links related to the phone number. These sources have been analyzed by our AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {report.sources.map((source, index) => (
              <Card key={index} className="bg-card border-border hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <span className="mt-1">{getSourceIcon(source)}</span>
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-accent hover:underline break-all text-sm sm:text-base"
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
