import type { NumberScanOutput } from '@/ai/flows/number-scan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link as LinkIcon, FileText, Info, ServerCrash, CheckCircle2 } from 'lucide-react';

interface ReportDisplayProps {
  report: NumberScanOutput;
}

const getSourceIcon = (url: string): React.ReactNode => {
  try {
    const lcUrl = url.toLowerCase();
    if (lcUrl.endsWith('.pdf')) return <FileText className="h-5 w-5 text-accent shrink-0" />;
    if (lcUrl.endsWith('.doc') || lcUrl.endsWith('.docx')) return <FileText className="h-5 w-5 text-accent shrink-0" />;
    if (lcUrl.endsWith('.xls') || lcUrl.endsWith('.xlsx')) return <FileText className="h-5 w-5 text-accent shrink-0" />;
    // Add more specific icons based on common domains if desired
    // e.g. if (new URL(url).hostname.includes('linkedin.com')) return <LinkedinIcon className="h-5 w-5 text-accent" />;
  } catch (e) {
    // Invalid URL, fallback
  }
  return <LinkIcon className="h-5 w-5 text-accent shrink-0" />;
};

export default function ReportDisplay({ report }: ReportDisplayProps) {
  const hasSummary = report.summary && report.summary !== "No specific summary could be generated for this number." && report.summary !== "No summary available.";
  const hasSources = report.sources && report.sources.length > 0;

  if (!hasSummary && !hasSources) {
    return (
      <Alert className="mt-8 shadow-md">
        <Info className="h-5 w-5" />
        <AlertTitle className="font-headline">Scan Complete</AlertTitle>
        <AlertDescription>
          No specific public information or relevant sources were found for this number.
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
