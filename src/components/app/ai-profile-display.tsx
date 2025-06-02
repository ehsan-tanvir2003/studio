
import type { PersonProfileOutput } from '@/ai/flows/person-profile-builder-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';
import { 
    User, MapPin, Briefcase, GraduationCap, Link as LinkIcon, Mail, Phone, Users, BrainCircuit,
    Globe, Hash, Heart, BookOpen, AlertTriangle, MessageSquare, BriefcaseBusiness, Building
} from 'lucide-react';
import Image from 'next/image';

interface AiProfileDisplayProps {
  profile: PersonProfileOutput;
}

const SectionCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; className?: string }> = ({ title, icon: Icon, children, className }) => (
  <Card className={cn("bg-card/60 border-border/30 shadow-md", className)}>
    <CardHeader className="pb-3">
      <CardTitle className="text-xl font-headline text-primary flex items-center">
        <Icon className="mr-3 h-6 w-6" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm font-code text-foreground/90 space-y-2">
      {children}
    </CardContent>
  </Card>
);

const DetailItem: React.FC<{ label: string; value?: string | string[] | null; icon?: React.ElementType; className?: string }> = ({ label, value, icon: Icon, className }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className={cn("py-1", className)}>
      <strong className="text-muted-foreground">{Icon && <Icon className="inline h-4 w-4 mr-1.5 relative -top-px"/>}{label}:</strong>
      {Array.isArray(value) ? (
        <div className="flex flex-wrap gap-1 mt-1">
          {value.map((item, index) => <Badge key={index} variant="secondary" className="font-normal bg-muted/50">{item}</Badge>)}
        </div>
      ) : (
        <span className="ml-1">{value}</span>
      )}
    </div>
  );
};


export default function AiProfileDisplay({ profile }: AiProfileDisplayProps) {
  return (
    <div className="mt-8 space-y-6">
      <Card className="shadow-xl overflow-hidden bg-card/90 border-primary/20">
        <CardHeader className="bg-muted/10 p-6 border-b border-border/30">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar className="h-24 w-24 border-4 border-primary/40 shadow-md">
              <AvatarImage src={profile.profilePhotoUrl} alt={profile.basicInfo.fullName} data-ai-hint={profile.profilePhotoHint} />
              <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
                {profile.basicInfo.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <CardTitle className="text-3xl font-headline text-primary mb-1">{profile.basicInfo.fullName}</CardTitle>
              <CardDescription className="font-code text-base text-muted-foreground">{profile.summary}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <SectionCard title="Basic Information" icon={User}>
            <DetailItem label="Age Range" value={profile.basicInfo.possibleAgeRange} />
            <DetailItem label="Gender (Synthesized)" value={profile.basicInfo.genderGuess} />
            <DetailItem label="Synthesized Location" value={profile.basicInfo.currentLocation} icon={MapPin}/>
          </SectionCard>

          <SectionCard title="Professional Sketch" icon={BriefcaseBusiness}>
            <DetailItem label="Possible Occupations" value={profile.professionalSketch.possibleOccupations} />
            <DetailItem label="Potential Employers/Types" value={profile.professionalSketch.potentialEmployers} icon={Building} />
            <DetailItem label="Education Background" value={profile.professionalSketch.educationBackground} icon={GraduationCap} />
            <DetailItem label="Key Skills" value={profile.professionalSketch.keySkills} icon={Hash} />
          </SectionCard>

          <SectionCard title="Digital Footprint Estimate" icon={Globe}>
            {profile.digitalFootprintEstimate.socialMediaHints.map((hint, index) => (
              <div key={index} className="py-1.5 border-b border-border/20 last:border-b-0">
                <strong className="text-muted-foreground flex items-center">
                    <LinkIcon className="inline h-4 w-4 mr-2"/> {hint.platform}
                </strong>
                <p className="text-xs text-primary hover:underline cursor-pointer break-all my-0.5">{hint.profileUrlPlaceholder}</p>
                <p className="italic text-foreground/80 text-xs">{hint.activitySummary}</p>
              </div>
            ))}
             <DetailItem label="Forum/Community Mentions" value={profile.digitalFootprintEstimate.forumMentions} icon={MessageSquare} className="pt-2"/>
             <DetailItem label="News/Blog Mentions" value={profile.digitalFootprintEstimate.newsOrBlogMentions} icon={BookOpen}/>
          </SectionCard>

          <SectionCard title="Lifestyle Insights (Illustrative)" icon={Heart}>
            <DetailItem label="Possible Hobbies" value={profile.lifestyleInsights.hobbies} />
            <DetailItem label="Associated Groups/Communities" value={profile.lifestyleInsights.associatedGroups} icon={Users} />
          </SectionCard>
          
        </CardContent>
        <CardFooter className="bg-muted/20 p-4 border-t border-border/30">
            <Alert variant="default" className="w-full bg-background/50 border-accent/50 shadow">
                <AlertTriangle className="h-5 w-5 text-accent" />
                <AlertTitle className="font-headline text-accent">Important Disclaimer</AlertTitle>
                <AlertDescription className="font-code text-accent/90">
                    {profile.disclaimer}
                </AlertDescription>
            </Alert>
        </CardFooter>
      </Card>
    </div>
  );
}
