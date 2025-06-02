
"use client";

import { useState, useEffect } from 'react';
import PersonSearchForm from '@/components/app/person-search-form';
import AiProfileDisplay from '@/components/app/ai-profile-display'; // New component
import type { PersonProfileOutput } from '@/ai/flows/person-profile-builder-flow';
import { generateAiPersonProfile } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, BrainCircuit, UserCog, Bot, Sparkles, Loader2 } from "lucide-react";

const thinkingIcons = [
  UserCog,
  Bot,
  Sparkles,
  BrainCircuit,
];

export default function AiProfileSynthesizerPage() {
  const [profile, setProfile] = useState<PersonProfileOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentThinkingIconIndex, setCurrentThinkingIconIndex] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isLoading) {
      intervalId = setInterval(() => {
        setCurrentThinkingIconIndex((prevIndex) => (prevIndex + 1) % thinkingIcons.length);
      }, 350); 
    } else {
      clearInterval(intervalId);
    }
    return () => clearInterval(intervalId);
  }, [isLoading]);

  const handleProfileGeneration = async (fullName: string, locationHint: string) => {
    setIsLoading(true);
    setProfile(null);
    setError(null);
    setCurrentThinkingIconIndex(0); 
    try {
      const result = await generateAiPersonProfile(fullName, locationHint);
      if ('error' in result) {
        setError(result.error);
      } else {
        setProfile(result);
      }
    } catch (e) {
      setError("An unexpected error occurred while initiating AI profile synthesis.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentIcon = thinkingIcons[currentThinkingIconIndex];

  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4">
      <header className="mb-10 sm:mb-12 text-center">
        <BrainCircuit className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">AI Profile Synthesizer</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Generate an Illustrative OSINT Profile with AI
        </p>
      </header>

      <main className="w-full max-w-3xl space-y-12">
        <div>
          <PersonSearchForm 
            onSubmit={handleProfileGeneration} 
            isLoading={isLoading}
            formTitle="Synthesize AI Profile"
            fullNameLabel="Target Full Name"
            fullNamePlaceholder="[Enter Full Name for AI Synthesis]"
            fullNameDescription="Provide the full name for the AI to synthesize a profile around."
            locationLabel="Location Hint (City/Country)"
            locationPlaceholder="[e.g., Dhaka, Bangladesh or London, UK]"
            locationDescription="Give a location hint to contextualize the AI-generated profile."
            buttonText="Synthesize Profile"
            loadingButtonText="Synthesizing Profile with AI..."
          />
          
          {error && (
            <Alert variant="destructive" className="mt-6 shadow-md border-destructive/70 bg-destructive/10">
              <Terminal className="h-5 w-5 text-destructive" />
              <AlertTitle className="font-headline text-destructive">Synthesis Error</AlertTitle>
              <AlertDescription className="font-code text-destructive/90">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="mt-8 text-center py-10 bg-card/50 rounded-lg shadow-md border border-primary/30">
              <div role="status" className="flex flex-col items-center space-y-4">
                <div className="relative h-16 w-16">
                    {thinkingIcons.map((Icon, index) => (
                        <Icon 
                            key={index}
                            className={`absolute top-0 left-0 h-16 w-16 text-primary transition-opacity duration-300 ease-in-out ${index === currentThinkingIconIndex ? 'opacity-100 animate-pulse' : 'opacity-0'}`}
                        />
                    ))}
                </div>
                <p className="text-lg text-primary font-code font-medium">
                  [AI_SYNTHESIZING_PROFILE_DATA...]
                </p>
                <p className="text-sm text-muted-foreground font-code">Crafting illustrative details // Please stand by...</p>
                 <Loader2 className="w-6 h-6 text-muted-foreground animate-spin"/>
              </div>
            </div>
          )}
          
          {profile && !isLoading && <AiProfileDisplay profile={profile} />}
        </div>
      </main>
    </div>
  );
}
