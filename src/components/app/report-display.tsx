
import type { PDLPersonSearchOutput, PDLMatchedPerson } from '@/ai/flows/pdl-person-search-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
    User, MapPin, Briefcase, GraduationCap, Link as LinkIcon, Mail, Phone, ExternalLink, AlertCircle,
    BarChart3, GripVertical, Building, Info, Star, CheckCircle, Linkedin, Facebook, Twitter, GitMerge,
    CalendarDays, Code2, UserCircle, UserCheck, ShieldQuestion, Users, DatabaseBackup
} from 'lucide-react';
import Image from 'next/image';

interface ReportDisplayProps {
  report: PDLPersonSearchOutput;
}

const getAvatarFallback = (name?: string) => {
  if (!name) return "P";
  const parts = name.split(" ");
  if (parts.length > 1) {
    return (parts[0][0] + (parts[parts.length - 1][0] || parts[0][1] || '')).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const SocialIcon = ({ service }: { service?: string }) => {
  if (!service) return <LinkIcon className="h-4 w-4 text-muted-foreground" />;
  switch (service.toLowerCase()) {
    case 'linkedin': return <Linkedin className="h-4 w-4 text-blue-600" />;
    case 'facebook': return <Facebook className="h-4 w-4 text-blue-700" />;
    case 'twitter': case 'x': return <Twitter className="h-4 w-4 text-sky-500" />;
    case 'github': return <GitMerge className="h-4 w-4 text-gray-700 dark:text-gray-300" />;
    default: return <LinkIcon className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function ReportDisplay({ report }: ReportDisplayProps) {
  const hasMatches = report.matches && report.matches.length > 0;
  const totalFound = report.totalMatches || 0;
  const displayedMatchesCount = report.matches?.length || 0;

  if (!hasMatches && totalFound === 0) {
    return (
      <Alert className="mt-8 shadow-md bg-card/80 border-border/50">
        <ShieldQuestion className="h-5 w-5 text-muted-foreground" />
        <AlertTitle className="font-headline text-muted-foreground">Search Complete: No Matches Found</AlertTitle>
        <AlertDescription className="font-code">
          PeopleDataLabs did not find any profiles matching the provided criteria.
          {report.errorMessage && !report.errorMessage.toLowerCase().includes("no person found") && ` Error: ${report.errorMessage}`}
        </AlertDescription>
      </Alert>
    );
  }

  let matchCountDisplay = "Profile details";
  if (totalFound > 0) {
      if (totalFound === 1) {
          matchCountDisplay = `1 profile found`;
      } else if (displayedMatchesCount < totalFound) {
          matchCountDisplay = `${displayedMatchesCount} of ${totalFound} profiles shown`;
      } else {
          matchCountDisplay = `${totalFound} profiles found`;
      }
  }


  return (
    <div className="mt-8 space-y-6">
      <Card className="shadow-lg bg-card/90 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center">
            <Users className="mr-3 h-7 w-7" /> 
            PDL Search Results
            {totalFound > 0 && <span className="text-lg ml-2 text-muted-foreground">({matchCountDisplay})</span>}
          </CardTitle>
          <CardDescription className="font-code text-muted-foreground">
            Profiles sourced from PeopleDataLabs Search API. Data accuracy may vary. Showing top results.
          </CardDescription>
        </CardHeader>
      </Card>

      {report.matches.map((person, index) => (
        <Card key={person.id || index} className="shadow-xl overflow-hidden bg-card/80 border-border/40 hover:border-primary/50 transition-colors duration-200">
          <CardHeader className="bg-secondary/10 p-4 border-b border-border/30">
            <div className="flex items-start sm:items-center space-x-4">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary/30">
                <AvatarFallback className="text-2xl bg-muted text-muted-foreground">{getAvatarFallback(person.fullName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-xl sm:text-2xl font-headline text-primary mb-0.5">{person.fullName || "N/A"}</CardTitle>
                {person.jobTitle && person.jobCompanyName && (
                  <p className="text-sm sm:text-base text-accent font-medium flex items-center">
                    <Briefcase className="h-4 w-4 mr-2 shrink-0" /> {person.jobTitle} at {person.jobCompanyName}
                  </p>
                )}
                {(person.locationLocality || person.locationRegion || person.locationCountry) && (
                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center mt-1">
                        <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0" /> 
                        {[person.locationLocality, person.locationRegion, person.locationCountry].filter(Boolean).join(', ')}
                    </p>
                )}
                 {person.likelihood !== undefined && (
                    <Badge variant="outline" className="mt-2 text-xs border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
                        <Star className="h-3 w-3 mr-1.5 text-green-500" />
                        PDL Likelihood: {person.likelihood}/10
                    </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            <Accordion type="single" collapsible className="w-full" defaultValue="experience">
              {(person.experience && person.experience.length > 0) && (
                <AccordionItem value="experience">
                  <AccordionTrigger className="text-base font-headline text-secondary-foreground hover:text-primary">
                    <Briefcase className="mr-2 h-5 w-5 text-primary/80" /> Work Experience
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-3 pl-2">
                    {person.experience.map((exp, i) => (
                      <div key={`exp-${person.id}-${i}`} className="text-xs sm:text-sm p-2.5 bg-input/30 rounded-md border border-border/20">
                        <p className="font-semibold text-foreground">{exp.title || "N/A"} at {exp.companyName || "N/A"}</p>
                        {(exp.startDate || exp.endDate) && <p className="text-muted-foreground"><CalendarDays className="inline h-3.5 w-3.5 mr-1"/> {exp.startDate || '?'} - {exp.endDate || 'Present'}</p>}
                        {exp.location && <p className="text-muted-foreground"><MapPin className="inline h-3.5 w-3.5 mr-1"/> {exp.location}</p>}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {(person.education && person.education.length > 0) && (
                <AccordionItem value="education">
                  <AccordionTrigger className="text-base font-headline text-secondary-foreground hover:text-primary">
                    <GraduationCap className="mr-2 h-5 w-5 text-primary/80" /> Education
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-3 pl-2">
                    {person.education.map((edu, i) => (
                      <div key={`edu-${person.id}-${i}`} className="text-xs sm:text-sm p-2.5 bg-input/30 rounded-md border border-border/20">
                        <p className="font-semibold text-foreground">{edu.schoolName || "N/A"}</p>
                        {edu.degrees && edu.degrees.length > 0 && <p className="text-muted-foreground">Degree(s): {edu.degrees.join(', ')}</p>}
                        {edu.endDate && <p className="text-muted-foreground"><CalendarDays className="inline h-3.5 w-3.5 mr-1"/> Ended: {edu.endDate}</p>}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {(person.skills && person.skills.length > 0) && (
                <AccordionItem value="skills">
                  <AccordionTrigger className="text-base font-headline text-secondary-foreground hover:text-primary">
                     <Code2 className="mr-2 h-5 w-5 text-primary/80" /> Skills
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pl-2">
                    <div className="flex flex-wrap gap-2">
                      {person.skills.map((skill, i) => (
                        <Badge key={`skill-${person.id}-${i}`} variant="secondary" className="text-xs sm:text-sm bg-muted/60 text-muted-foreground hover:bg-muted">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {(person.socialProfiles && person.socialProfiles.length > 0 || person.linkedinUrl) && (
                <AccordionItem value="social">
                  <AccordionTrigger className="text-base font-headline text-secondary-foreground hover:text-primary">
                    <Users className="mr-2 h-5 w-5 text-primary/80" /> Social Profiles & Links
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-2 pl-2">
                    {person.linkedinUrl && (
                        <div className="flex items-center text-xs sm:text-sm p-2.5 bg-input/30 rounded-md border border-border/20" key={`linkedin-${person.id}`}>
                            <Linkedin className="h-4 w-4 mr-2 shrink-0 text-blue-600" />
                            <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                                {person.linkedinUrl}
                            </a>
                        </div>
                    )}
                    {person.socialProfiles?.filter(p => p.url && p.url !== person.linkedinUrl).map((profile, i) => (
                      profile.url && (
                        <div key={`social-${person.id}-${i}`} className="flex items-center text-xs sm:text-sm p-2.5 bg-input/30 rounded-md border border-border/20">
                          <SocialIcon service={profile.service} />
                          <a href={profile.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline break-all">
                            {profile.url} {(profile.service && profile.service !== 'linkedin' && profile.service !== 'facebook' && profile.service !== 'twitter' && profile.service !== 'github') ? `(${profile.service})` : ''}
                          </a>
                        </div>
                      )
                    ))}
                     {person.jobCompanyWebsite && (
                        <div className="flex items-center text-xs sm:text-sm p-2.5 bg-input/30 rounded-md border border-border/20" key={`companyweb-${person.id}`}>
                            <Building className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                            <a href={person.jobCompanyWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                                {person.jobCompanyWebsite} (Company)
                            </a>
                        </div>
                     )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {(person.emails && person.emails.length > 0 || person.phoneNumbers && person.phoneNumbers.length > 0) && (
                <AccordionItem value="contact">
                  <AccordionTrigger className="text-base font-headline text-secondary-foreground hover:text-primary">
                    <Info className="mr-2 h-5 w-5 text-primary/80" /> Contact Info (if available)
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-2 pl-2">
                    {person.emails?.map((email, i) => (
                      <div key={`email-${person.id}-${i}`} className="flex items-center text-xs sm:text-sm p-2.5 bg-input/30 rounded-md border border-border/20">
                        <Mail className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                        <span>{email.address} {email.type && `(${email.type})`}</span>
                      </div>
                    ))}
                    {person.phoneNumbers?.map((phone, i) => (
                      <div key={`phone-${person.id}-${i}`} className="flex items-center text-xs sm:text-sm p-2.5 bg-input/30 rounded-md border border-border/20">
                        <Phone className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                        <span>{phone}</span>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}
               <AccordionItem value="raw-data">
                  <AccordionTrigger className="text-base font-headline text-secondary-foreground hover:text-primary">
                    <DatabaseBackup className="mr-2 h-5 w-5 text-primary/80" /> Raw PDL Data
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pl-2">
                    <pre className="text-xs bg-muted/30 p-3 rounded-md overflow-x-auto border border-border/20">
                      {JSON.stringify(person, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

    