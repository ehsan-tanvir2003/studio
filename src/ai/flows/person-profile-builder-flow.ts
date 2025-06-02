
'use server';
/**
 * @fileOverview Generates a synthesized, illustrative person profile using AI.
 *
 * - generatePersonProfile - A function that handles the AI profile generation.
 * - PersonProfileInput - The input type for the generatePersonProfile function.
 * - PersonProfileOutput - The return type for the generatePersonProfile function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const PersonProfileInputSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters.").describe('The full name of the person for whom to synthesize a profile.'),
  locationHint: z.string().min(2, "Location hint must be at least 2 characters.").describe('A location hint (e.g., city, country) to contextualize the synthesized profile.'),
});
export type PersonProfileInput = z.infer<typeof PersonProfileInputSchema>;

const BasicInfoSchema = z.object({
  fullName: z.string().describe("The full name provided."),
  possibleAgeRange: z.string().describe("A plausible age range for the person (e.g., '30s', '45-55')."),
  genderGuess: z.string().describe("A plausible gender for the person, based on the name if common, or 'Unspecified'."),
  currentLocation: z.string().describe("A synthesized current location, possibly elaborating on the provided hint."),
});

const ProfessionalSketchSchema = z.object({
  possibleOccupations: z.array(z.string()).describe("A list of 2-3 plausible occupations or career fields."),
  potentialEmployers: z.array(z.string()).describe("A list of 1-2 types of potential employers or generic company names."),
  educationBackground: z.array(z.string()).describe("A list of 1-2 plausible educational achievements or institutions."),
  keySkills: z.array(z.string()).describe("A list of 3-5 plausible key skills."),
});

const DigitalFootprintEstimateSchema = z.object({
  socialMediaHints: z.array(z.object({
    platform: z.string().describe("Name of a common social media platform (e.g., LinkedIn, Facebook, Instagram, X/Twitter)."),
    profileUrlPlaceholder: z.string().url().describe("A generic placeholder URL for a profile on that platform."),
    activitySummary: z.string().describe("A brief, plausible summary of how the person might use this platform."),
  })).describe("A list of 2-4 plausible social media presences with activity summaries."),
  forumMentions: z.string().describe("A plausible statement about potential mentions in online forums or communities."),
  newsOrBlogMentions: z.string().describe("A plausible statement about potential mentions in news articles or blogs."),
});

const LifestyleInsightsSchema = z.object({
  hobbies: z.array(z.string()).describe("A list of 2-3 plausible hobbies or personal interests."),
  associatedGroups: z.string().describe("A plausible statement about potential involvement in local or online groups related to hobbies/interests."),
});

export const PersonProfileOutputSchema = z.object({
  profilePhotoUrl: z.string().url().describe("A placeholder image URL for the profile photo."),
  profilePhotoHint: z.string().describe("Keywords for the AI hint of the profile photo (e.g., 'person illustration')."),
  summary: z.string().describe("A narrative summary of the AI-synthesized person profile."),
  basicInfo: BasicInfoSchema,
  professionalSketch: ProfessionalSketchSchema,
  digitalFootprintEstimate: DigitalFootprintEstimateSchema,
  lifestyleInsights: LifestyleInsightsSchema,
  disclaimer: z.string().describe("A standard disclaimer stating the illustrative and speculative nature of the AI-generated profile."),
});
export type PersonProfileOutput = z.infer<typeof PersonProfileOutputSchema>;

export async function generatePersonProfile(input: PersonProfileInput): Promise<PersonProfileOutput> {
  return personProfileBuilderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personProfileBuilderPrompt',
  input: { schema: PersonProfileInputSchema },
  output: { schema: PersonProfileOutputSchema },
  prompt: `
    You are an AI OSINT Analyst tasked with creating a plausible, illustrative profile for a fictional person.
    The goal is to generate a rich, detailed, and coherent profile based *only* on the provided full name and location hint.
    All information in the profile must be *synthesized* and *speculative*. Do NOT use real data or attempt to find real people.
    This is for demonstration purposes to showcase AI's ability to generate structured, creative content.

    Person's Full Name: {{{fullName}}}
    Location Hint: {{{locationHint}}}

    Generate the following details for the profile. Be creative and ensure the details are consistent with each other:

    1.  **Profile Photo:**
        *   `profilePhotoUrl`: Set this to "https://placehold.co/150x150.png".
        *   `profilePhotoHint`: Set this to "person illustration abstract".
    2.  **Basic Info:**
        *   `fullName`: Use the provided full name.
        *   `possibleAgeRange`: Infer a plausible age range (e.g., "late 20s", "40-50").
        *   `genderGuess`: Infer a plausible gender based on the name if common, otherwise use "Unspecified".
        *   `currentLocation`: Elaborate slightly on the provided location hint (e.g., if "Dhaka", maybe "Dhaka, Bangladesh, likely in a residential or business district").
    3.  **Professional Sketch:**
        *   `possibleOccupations`: List 2-3 plausible occupations that fit a general profile.
        *   `potentialEmployers`: List 1-2 generic types of companies or fictional company names that align with the occupations.
        *   `educationBackground`: List 1-2 plausible educational qualifications (e.g., "Degree in Business Administration from a notable local university", "Online certifications in Digital Marketing").
        *   `keySkills`: List 3-5 plausible skills relevant to the synthesized profession.
    4.  **Digital Footprint Estimate:**
        *   `socialMediaHints`: Create 2-4 entries. For each:
            *   `platform`: A common social media platform (LinkedIn, Facebook, Instagram, X/Twitter, a niche hobby forum).
            *   `profileUrlPlaceholder`: A generic placeholder URL like "https://[platform].com/example/{{{fullName}}}".
            *   `activitySummary`: A brief, plausible summary of how someone with this profile might use that platform (e.g., "Primarily for professional networking and industry updates", "Shares photos of travel and hobbies", "Engages in discussions on [topic]").
        *   `forumMentions`: A plausible sentence about potential mentions in online forums related to their synthesized interests or profession.
        *   `newsOrBlogMentions`: A plausible sentence about potential mentions in local news (e.g., for community involvement) or niche blogs.
    5.  **Lifestyle Insights:**
        *   `hobbies`: List 2-3 plausible hobbies or personal interests.
        *   `associatedGroups`: A plausible sentence about potential involvement in local or online groups related to these hobbies.
    6.  **Summary:**
        *   `summary`: Write a 2-3 sentence narrative summary weaving together the key aspects of the synthesized profile.
    7.  **Disclaimer:**
        *   `disclaimer`: Set this to "IMPORTANT: This is an AI-synthesized illustrative profile created for demonstration purposes. All details are speculative and not based on real-time data of any specific individual. Do not use this information for real-world decisions."

    Ensure all generated text is professional, coherent, and adheres to the OSINT report style.
    Do not state that the person is fictional within the generated profile fields themselves, only in the disclaimer. The profile should read as if it *could* be real, for illustrative purposes.
  `,
  config: {
    temperature: 0.8, // Allow for some creativity
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ]
  }
});

const personProfileBuilderFlow = ai.defineFlow(
  {
    name: 'personProfileBuilderFlow',
    inputSchema: PersonProfileInputSchema,
    outputSchema: PersonProfileOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate a person profile.');
    }
    return output;
  }
);
