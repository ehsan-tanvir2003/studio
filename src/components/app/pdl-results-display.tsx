
import type { PdlPersonSearchOutput, PdlPerson } from '@/ai/flows/pdl-person-search-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    User, MapPin, Briefcase, Linkedin, Mail, Phone, Sigma, Layers, ExternalLink, SearchCheck, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';


interface PdlResultsDisplayProps {
  results: PdlPersonSearchOutput;
}

const DetailItem: React.FC<{ label: string; value?: string | null | number; icon?: React.ElementType; className?: string; isLink?: boolean }> = ({ label, value, icon: Icon, className, isLink }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={cn("py-1 text-sm", className)}>
      <strong className="text-muted-foreground/90">{Icon && <Icon className="inline h-4 w-4 mr-1.5 relative -top-px"/>}{label}:</strong>
      {isLink && typeof value === 'string' ? (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline break-all">
          {value} <ExternalLink className="inline h-3 w-3 ml-0.5"/>
        </a>
      ) : (
        <span className="ml-1 text-foreground/90">{value}</span>
      )}
    </div>
  );
};

const LikelihoodBadge: React.FC<{ score: number | null | undefined }> = ({ score }) => {
  if (score === null || score === undefined) return <Badge variant="outline">N/A</Badge>;
  let colorClass = "bg-gray-500";
  let text = "Unknown";
  if (score >= 4) { colorClass = "bg-green-500"; text = "Very High"; }
  else if (score >= 3) { colorClass = "bg-yellow-500"; text = "High"; }
  else if (score >= 2) { colorClass = "bg-orange-500"; text = "Medium"; }
  else if (score >= 1) { colorClass = "bg-red-500"; text = "Low"; }
  
  return <Badge className={cn(colorClass, "text-white")}>{text} ({score})</Badge>;
};

const PersonProfileCard: React.FC<{ person: PdlPerson, index: number }> = ({ person, index }) => {
  const fallbackName = (person.firstName?.[0] || "") + (person.lastName?.[0] || "");
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.fullName || fallbackName)}&background=random&size=128`;

  return (
    <Card className="bg-card/70 border-border/40 shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16 border-2 border-primary/30">
            <AvatarImage src={avatarUrl} alt={person.fullName || "Profile"} data-ai-hint="person avatar"/>
            <AvatarFallback className="text-xl bg-muted text-muted-foreground">{fallbackName.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl font-headline text-primary mb-0.5">{person.fullName || "N/A"}</CardTitle>
            <CardDescription className="font-code text-sm text-muted-foreground">
              {person.jobTitle || "No job title available"} at {person.jobCompanyName || "N/A"}
            </CardDescription>
          </div>
          <LikelihoodBadge score={person.likelihood} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            <DetailItem label="Location" value={person.locationName} icon={MapPin} />
            <DetailItem label="Company" value={person.jobCompanyName} icon={Briefcase} />
        </div>
        {person.linkedinUrl && <DetailItem label="LinkedIn" value={person.linkedinUrl} icon={Linkedin} isLink={true}/>}
        
        <Accordion type="single" collapsible className="w-full text-sm">
          <AccordionItem value={`item-${index}-details`}>
            <AccordionTrigger className="text-xs font-code text-muted-foreground hover:text-primary py-2">More Details</AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
                <DetailItem label="First Name" value={person.firstName}/>
                <DetailItem label="Last Name" value={person.lastName}/>
                <DetailItem label="Gender" value={person.gender}/>
                <DetailItem label="Birth Year" value={person.birthYear}/>
                <DetailItem label="Job Start Date" value={person.jobStartDate}/>
                <DetailItem label="Company Website" value={person.jobCompanyWebsite} isLink={true}/>
                
                {person.emails && person.emails.length > 0 && (
                    <div>
                        <strong className="text-muted-foreground/90 flex items-center text-sm"><Mail className="inline h-4 w-4 mr-1.5"/>Emails:</strong>
                        <ul className="list-disc list-inside ml-1">
                        {person.emails.map((email, i) => (
                            <li key={`email-${index}-${i}`} className="text-foreground/80 text-xs">
                                {email.address} ({email.type || 'N/A'})
                            </li>
                        ))}
                        </ul>
                    </div>
                )}
                {person.phoneNumbers && person.phoneNumbers.length > 0 && (
                     <div>
                        <strong className="text-muted-foreground/90 flex items-center text-sm"><Phone className="inline h-4 w-4 mr-1.5"/>Phone Numbers:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                        {person.phoneNumbers.map((phone, i) => (
                            <Badge key={`phone-${index}-${i}`} variant="secondary" className="font-normal bg-muted/50 text-xs">{phone}</Badge>
                        ))}
                        </div>
                    </div>
                )}
                {person.skills && person.skills.length > 0 && (
                    <div>
                        <strong className="text-muted-foreground/90 flex items-center text-sm"><Sigma className="inline h-4 w-4 mr-1.5"/>Skills:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                        {person.skills.map((skill, i) => (
                            <Badge key={`skill-${index}-${i}`} variant="outline" className="font-normal text-xs border-primary/50 text-primary/80">{skill}</Badge>
                        ))}
                        </div>
                    </div>
                )}
                {person.summary && <DetailItem label="Summary" value={person.summary}/>}
                <DetailItem label="PDL ID" value={person.id}/>
                <DetailItem label="Dataset Version" value={person.dataset_version}/>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};


export default function PdlResultsDisplay({ results }: PdlResultsDisplayProps) {
  if (!results) return null;

  return (
    <div className="mt-8 space-y-6">
      <Card className="shadow-xl bg-card/90 border-primary/20">
        <CardHeader className="bg-muted/10 p-6 border-b border-border/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-headline text-primary flex items-center">
              <SearchCheck className="mr-3 h-7 w-7" />
              PDL Search Results
            </CardTitle>
            <Badge variant="secondary" className="font-code text-lg px-3 py-1">
              {results.matches.length} / {results.totalMatches} Found
            </Badge>
          </div>
          {results.pdlQuery && (
            <CardDescription className="font-code text-xs text-muted-foreground/80 pt-1">
              Query: {results.pdlQuery}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {results.matches.length === 0 && (
            <div className="text-center py-8 text-muted-foreground font-code">
              <Info className="mx-auto h-10 w-10 mb-3 text-primary/50"/>
              No matching profiles found for your query.
              <p className="text-xs mt-1">Try broadening your search terms or checking for typos.</p>
            </div>
          )}
          {results.matches.map((person, index) => (
            <PersonProfileCard key={person.id || `person-${index}`} person={person} index={index} />
          ))}
        </CardContent>
        {results.totalMatches > results.matches.length && (
          <CardFooter className="bg-muted/20 p-4 border-t border-border/30">
            <p className="text-xs font-code text-muted-foreground">
              Displaying the top {results.matches.length} of {results.totalMatches} potential matches. Further refinement or pagination might be needed for more results.
            </p>
          </CardFooter>
        )}
      </Card>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="raw-json">
          <AccordionTrigger className="text-sm font-code text-muted-foreground hover:text-primary py-2 bg-card/50 px-4 rounded-md border border-border/30 shadow-sm">View Raw PDL JSON Response (Debug)</AccordionTrigger>
          <AccordionContent className="p-4 bg-muted/20 rounded-b-md border border-t-0 border-border/30 max-h-96 overflow-auto">
            <pre className="text-xs font-code text-foreground/80 whitespace-pre-wrap break-all">
              {JSON.stringify(results, null, 2)}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
