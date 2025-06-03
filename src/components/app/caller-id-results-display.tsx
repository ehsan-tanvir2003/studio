
"use client";

import type { CallerIdSearchOutput, CallerIdData, SocialMediaInfo } from '@/ai/flows/caller-id-search-flow';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
    CheckCircle, XCircle, Info, User, Phone, MapPin, Briefcase, Globe, Image as ImageIcon, Sparkles, Mail, Users, Tag, CalendarDays, ExternalLink, FileText
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface CallerIdResultsDisplayProps {
  results: CallerIdSearchOutput;
}

const DetailItem: React.FC<{ icon: React.ElementType, label: string, value?: string | null | boolean | string[] | number | Record<string, any> }> = ({ icon: Icon, label, value }) => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === "") || (Array.isArray(value) && value.length === 0)) {
    return null;
  }

  let displayValue: React.ReactNode;
  if (typeof value === 'boolean') {
    displayValue = value ? <CheckCircle className="inline h-4 w-4 text-green-500" /> : <XCircle className="inline h-4 w-4 text-red-500" />;
  } else if (Array.isArray(value)) {
    if (value.every(item => typeof item === 'string')) {
      displayValue = (
        <div className="flex flex-wrap gap-1 mt-1">
          {(value as string[]).map((item, index) => <Badge key={index} variant="secondary" className="font-normal bg-muted/60">{item}</Badge>)}
        </div>
      );
    } else {
      // For arrays of non-strings, or mixed arrays, display as string for now
      displayValue = <span className="text-foreground/90">{value.join(', ')}</span>;
    }
  } else if (typeof value === 'object' && value !== null) {
    // Display [object Object] for complex objects, user can see details in raw JSON
    displayValue = <span className="text-foreground/90 italic">[Complex Data - See Raw JSON]</span>;
  }
   else {
    displayValue = <span className="text-foreground/90">{String(value)}</span>;
  }

  return (
    <div className="py-1.5 flex items-start">
      <Icon className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
      <div>
        <strong className="text-sm text-muted-foreground">{label}:</strong>
        <div className="text-sm ml-1">{displayValue}</div>
      </div>
    </div>
  );
};

const SocialMediaLink: React.FC<{ social: SocialMediaInfo }> = ({ social }) => {
  if (!social || (!social.id && !social.name)) return null;

  let icon = <Globe className="h-5 w-5 text-muted-foreground" />;
  if (social.type?.toLowerCase().includes('facebook')) icon = <User className="h-5 w-5 text-blue-600" />;
  if (social.type?.toLowerCase().includes('whatsapp')) icon = <Phone className="h-5 w-5 text-green-500" />;
  if (social.type?.toLowerCase().includes('instagram')) icon = <ImageIcon className="h-5 w-5 text-pink-500" />;
  
  let linkUrl = social.id;
  if (linkUrl && !linkUrl.startsWith('http') && social.type) {
      if (social.type.toLowerCase() === 'facebook' && /^\d+$/.test(linkUrl)) linkUrl = `https://www.facebook.com/profile.php?id=${linkUrl}`;
      else if (social.type.toLowerCase() === 'instagram' && !linkUrl.includes('/')) linkUrl = `https://www.instagram.com/${linkUrl}`;
  }

  return (
    <a 
        href={linkUrl && (linkUrl.startsWith('http') || social.type?.toLowerCase() === 'whatsapp') ? linkUrl : undefined} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={cn(
            "flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors",
            linkUrl ? "cursor-pointer" : "cursor-default"
        )}
        title={social.id || social.name || social.type}
    >
      {social.photo ? (
        <Avatar className="h-8 w-8">
          <AvatarImage src={social.photo} alt={social.name || social.type || 'Social media'} data-ai-hint={`${social.type || 'social'} logo`} />
          <AvatarFallback>{social.type?.[0]?.toUpperCase() || 'S'}</AvatarFallback>
        </Avatar>
      ) : icon }
      <div className="text-xs">
        <p className="font-semibold text-foreground truncate">{social.name || social.type || 'Social Profile'}</p>
        {social.id && <p className="text-muted-foreground truncate">{social.id.startsWith('http') ? 'View Profile' : social.id}</p>}
      </div>
      {linkUrl && (linkUrl.startsWith('http') || social.type?.toLowerCase() === 'whatsapp') && <ExternalLink className="h-3 w-3 text-primary ml-auto flex-shrink-0"/>}
    </a>
  );
}


export default function CallerIdResultsDisplay({ results }: CallerIdResultsDisplayProps) {
  if (!results) return null;

  const { success, data, message, error, rawResponse } = results;

  // Keys handled by dedicated UI elements (Avatar, main name, social links, spam badge)
  const explicitlyHandledKeys = ['photo', 'name', 'type', 'isSpam', 'socialMedia'];

  return (
    <div className="mt-8 space-y-6">
      <Card className="shadow-xl bg-card/90 border-primary/20">
        <CardHeader className="bg-muted/10 p-4 sm:p-6 border-b border-border/30">
          <div className="flex items-center">
            {success && data ? <CheckCircle className="mr-3 h-7 w-7 text-green-500" /> : <Info className="mr-3 h-7 w-7 text-yellow-500" />}
            <CardTitle className="text-xl sm:text-2xl font-headline text-primary">
              Caller ID Details
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {!success && (error || message) && (
            <Alert variant="destructive">
              <XCircle className="h-5 w-5" />
              <AlertTitle>API Error</AlertTitle>
              <AlertDescription>{error || message || "An unknown error occurred."}</AlertDescription>
            </Alert>
          )}

          {success && !data && (
             <div className="text-center py-8 text-muted-foreground font-code">
              <Info className="mx-auto h-10 w-10 mb-3 text-primary/50"/>
              {message || "No information found for the provided phone number."}
            </div>
          )}

          {success && data && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                {data.photo ? (
                  <Avatar className="h-24 w-24 border-2 border-primary/30 shadow-md">
                    <AvatarImage src={data.photo} alt={data.name || "Profile photo"} data-ai-hint="caller id photo" />
                    <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
                      {data.name ? data.name.substring(0, 2).toUpperCase() : <User />}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                   <Avatar className="h-24 w-24 border-2 border-primary/30 shadow-md">
                     <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
                       <User />
                    </AvatarFallback>
                   </Avatar>
                )}
                <div className="text-center sm:text-left">
                  {data.name && <h2 className="text-2xl font-bold font-headline text-foreground">{data.name}</h2>}
                  {data.type && <p className="text-md text-muted-foreground">{data.type}</p>}
                   {data.isSpam && <Badge variant="destructive" className="mt-1">Reported Spam</Badge>}
                </div>
              </div>
              
              <Card className="bg-background/50 p-3">
                <CardContent className="p-0 space-y-1">
                    {Object.entries(data)
                      .filter(([key, value]) => 
                        !explicitlyHandledKeys.includes(key) && 
                        value !== null && 
                        value !== undefined &&
                        !(Array.isArray(value) && value.length === 0) &&
                        !(typeof value === 'string' && value.trim() === '')
                      )
                      .map(([key, value]) => {
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                        let IconComponent = FileText; // Default icon for generic data
                        if (key.toLowerCase().includes('email')) IconComponent = Mail;
                        else if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('number')) IconComponent = Phone;
                        else if (key.toLowerCase().includes('location') || key.toLowerCase().includes('address') || key.toLowerCase().includes('country') || key.toLowerCase().includes('city') || key.toLowerCase().includes('region')) IconComponent = MapPin;
                        else if (key.toLowerCase().includes('company') || key.toLowerCase().includes('carrier') || key.toLowerCase().includes('work') || key.toLowerCase().includes('organization') || key.toLowerCase().includes('business')) IconComponent = Briefcase;
                        else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('website') || key.toLowerCase().includes('link')) IconComponent = Globe;
                        else if (key.toLowerCase().includes('tag')) IconComponent = Tag;
                        else if (key.toLowerCase().includes('date') || key.toLowerCase().includes('seen') || key.toLowerCase().includes('time') || key.toLowerCase().includes('timestamp')) IconComponent = CalendarDays;
                        else if (key.toLowerCase().includes('id') && !key.toLowerCase().includes('social')) IconComponent = User; // Generic ID, but not social media ID

                        return <DetailItem key={key} icon={IconComponent} label={label} value={value as any} />;
                    })}
                    {Object.entries(data).filter(([key, value]) => !explicitlyHandledKeys.includes(key) && (value === null || value === undefined || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === ''))).length === Object.keys(data).filter(k => !explicitlyHandledKeys.includes(k)).length && (
                         <Alert variant="default" className="my-4 bg-muted/30 border-primary/20">
                            <Info className="h-5 w-5 text-primary" />
                            <AlertTitle className="font-headline text-primary">Limited Information</AlertTitle>
                            <AlertDescription className="font-code text-muted-foreground">
                                The API call was successful, but most common details (other than name/photo/social) could not be extracted or were not provided.
                                Check the raw API response for any other available data.
                            </AlertDescription>
                         </Alert>
                    )}
                </CardContent>
              </Card>

              {data.socialMedia && data.socialMedia.length > 0 && (
                <Card className="bg-background/50">
                    <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-md font-headline text-muted-foreground flex items-center"><Sparkles className="w-4 h-4 mr-2 text-primary"/>Social Footprints</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {data.socialMedia.map((social, index) => (
                            <SocialMediaLink key={index} social={social} />
                        ))}
                    </CardContent>
                </Card>
              )}

              {Object.keys(data).length === 0 && !Object.values(data).some(v => v !== null && v !== undefined) && (
                 <Alert variant="default" className="my-4 bg-muted/30 border-primary/20">
                  <Info className="h-5 w-5 text-primary" />
                  <AlertTitle className="font-headline text-primary">No Details Found</AlertTitle>
                  <AlertDescription className="font-code text-muted-foreground">
                    The API responded successfully but returned no specific details for this phone number.
                  </AlertDescription>
                </Alert>
              )}


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
        <AccordionItem value="raw-json-callerid">
          <AccordionTrigger className="text-sm font-code text-muted-foreground hover:text-primary py-2 bg-card/50 px-4 rounded-md border border-border/30 shadow-sm">View Raw API JSON Response (Debug)</AccordionTrigger>
          <AccordionContent className="p-4 bg-muted/20 rounded-b-md border border-t-0 border-border/30 max-h-96 overflow-auto">
            <pre className="text-xs font-code text-foreground/80 whitespace-pre-wrap break-all">
              {JSON.stringify(rawResponse || results, null, 2)}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

