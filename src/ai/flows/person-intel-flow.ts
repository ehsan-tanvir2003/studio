
'use server';
/**
 * @fileOverview OSINT-style search for individuals based on name and city.
 *
 * - personIntelSearch - A function that handles the person intelligence search.
 * - PersonIntelInput - The input type for the personIntelSearch function.
 * - PersonIntelOutput - The return type for the personIntelSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonIntelInputSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters.").describe('The full name of the person to search for.'),
  city: z.string().min(2, "City name must be at least 2 characters.").describe('The city or region to narrow down the search.'),
});
export type PersonIntelInput = z.infer<typeof PersonIntelInputSchema>;

const ProbablePersonMatchSchema = z.object({
  name: z.string().describe('The full name of the potential match.'),
  sourcePlatform: z.string().describe('The simulated platform where this information was found (e.g., Facebook, LinkedIn, News Article).'),
  profileUrl: z.string().url().optional().describe('A direct URL to the simulated profile or source page.'),
  imageUrl: z.string().url().describe('URL of a representative placeholder image for the person (e.g., https://placehold.co/100x100.png).'),
  imageHint: z.string().default('profile person').describe('A hint for the placeholder image, e.g., "profile person".'),
  details: z.string().describe('A brief summary of relevant information found about this person, potentially including age, occupation, or connections.'),
  locationMatch: z.string().optional().describe('How the found location data relates to the input city (e.g., "Exact Match", "Nearby City", "Region Mentioned").'),
  confidenceScore: z.number().min(0).max(1).optional().describe('A simulated confidence score (0.0 to 1.0) of this match being correct.')
});
export type ProbablePersonMatch = z.infer<typeof ProbablePersonMatchSchema>;

const PersonIntelOutputSchema = z.object({
  overallSummary: z.string().describe('A high-level summary of the search findings and methodology.'),
  probableMatches: z.array(ProbablePersonMatchSchema).describe('A list of probable individuals matching the search criteria. Aim for 2-4 diverse simulated matches.'),
  dataSourcesAnalyzed: z.array(z.string().url()).describe('A list of unique, simulated URLs that were analyzed to generate the matches (e.g., fake social media search result pages, mock news article links).'),
});
export type PersonIntelOutput = z.infer<typeof PersonIntelOutputSchema>;

export async function personIntelSearch(input: PersonIntelInput): Promise<PersonIntelOutput> {
  return personIntelFlow(input);
}

// Simulated Tool: Search Web for Person
const searchWebForPersonByNameCity = ai.defineTool(
  {
    name: 'searchWebForPersonByNameCity',
    description: 'Simulates searching the web (social media, public records, news) for a person based on their full name and city. Returns a list of plausible-sounding but entirely FAKE URLs that might contain information about such a person. Do not return real URLs.',
    inputSchema: z.object({
      fullName: z.string(),
      city: z.string(),
    }),
    outputSchema: z.array(z.string().url()).describe('An array of 2 to 4 FAKE URLs (e.g., fake social media profile links, mock news mentions). These URLs are for simulation purposes only.'),
  },
  async (input) => {
    console.log(`Simulating web search for: ${input.fullName} in ${input.city}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    const nameSlug = input.fullName.toLowerCase().replace(/\s+/g, '.');
    const citySlug = input.city.toLowerCase().replace(/\s+/g, '');
    return [
      `https://fake-social-platform.example.com/profile/${nameSlug}-${citySlug}`,
      `https://another-social.example.net/users/${nameSlug}`,
      `https://localnews.example.org/${citySlug}/article/${nameSlug}-feature`,
      `https://professionalnetwork.example.com/in/${nameSlug}`
    ];
  }
);

// Simulated Tool: Extract Profile Information from a URL
const extractPersonProfileFromUrl = ai.defineTool(
  {
    name: 'extractPersonProfileFromUrl',
    description: 'Given a FAKE URL (from `searchWebForPersonByNameCity`), simulate extracting structured information for a potential person match. Generate plausible but fictional details. Always provide a placeholder image URL (https://placehold.co/100x100.png).',
    inputSchema: z.object({
      url: z.string().url(),
      originalFullName: z.string().describe("The original full name used in the search query, for context."),
      originalCity: z.string().describe("The original city used in the search query, for context."),
    }),
    outputSchema: ProbablePersonMatchSchema,
  },
  async (input) => {
    console.log(`Simulating profile extraction from: ${input.url} for ${input.originalFullName}`);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate processing delay

    let platform = "Generic Public Record";
    if (input.url.includes('fake-social-platform.example.com')) platform = "Fake Social Platform";
    else if (input.url.includes('another-social.example.net')) platform = "Another Social Net";
    else if (input.url.includes('localnews.example.org')) platform = "Local News Outlet";
    else if (input.url.includes('professionalnetwork.example.com')) platform = "Professional Network";

    const firstNames = ["Alex", "Jamie", "Chris", "Pat", "Jordan"];
    const lastNames = ["Doe", "Smith", "Garcia", "Miller", "Davis"];
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Slightly vary the name to simulate finding different people or variations
    const isOriginalName = Math.random() > 0.3;
    const extractedName = isOriginalName ? input.originalFullName : `${randomFirstName} ${randomLastName}`;


    const occupations = ["Software Engineer", "Graphic Designer", "Project Manager", "Marketing Specialist", "Local Business Owner", "Teacher"];
    const details = [
      `Works as a ${occupations[Math.floor(Math.random() * occupations.length)]} in ${input.originalCity}. Known for community involvement.`,
      `Studied at ${input.originalCity} University. Enjoys hiking and photography.`,
      `Recently moved to ${input.originalCity}. Previously lived in a nearby town.`,
      `Founder of a small startup focused on local services.`,
      `Mentioned in an article about local entrepreneurs in ${input.originalCity}.`
    ];

    return {
      name: extractedName,
      sourcePlatform: platform,
      profileUrl: input.url,
      imageUrl: `https://placehold.co/100x100.png`, // Always use a placeholder
      imageHint: "profile person avatar",
      details: details[Math.floor(Math.random() * details.length)],
      locationMatch: Math.random() > 0.5 ? `Active in ${input.originalCity}` : `Potentially linked to ${input.originalCity} region.`,
      confidenceScore: Math.random() * 0.3 + 0.6, // Simulate a score between 0.6 and 0.9
    };
  }
);

const prompt = ai.definePrompt({
  name: 'personIntelPrompt',
  tools: [searchWebForPersonByNameCity, extractPersonProfileFromUrl],
  input: {schema: PersonIntelInputSchema},
  output: {schema: PersonIntelOutputSchema},
  prompt: `You are an OSINT (Open Source Intelligence) analyst. Your task is to find information about a person based on their full name and city.

Search criteria:
Full Name: {{{fullName}}}
City/Region: {{{city}}}

Instructions:
1.  Use the \`searchWebForPersonByNameCity\` tool to get a list of FAKE (simulated) URLs that might contain information about the person.
2.  For each unique and relevant FAKE URL obtained (maximum of 3-4 diverse URLs), use the \`extractPersonProfileFromUrl\` tool to extract simulated details and create a \`ProbablePersonMatch\` object.
    *   Ensure each match has a unique placeholder image URL (e.g., \`https://placehold.co/100x100.png\`) and an \`imageHint\` like "profile person avatar".
    *   Generate plausible but fictional details for each profile.
    *   Simulate a \`confidenceScore\` for each match.
3.  Compile these matches into the \`probableMatches\` array.
4.  Provide an \`overallSummary\` explaining the simulated search process and findings. Mention that the results are illustrative and based on simulated data.
5.  List all unique FAKE URLs processed in the \`dataSourcesAnalyzed\` field.
Do NOT use real people's names or details. All data should be plausible fiction.
If no relevant URLs are found by \`searchWebForPersonByNameCity\`, the \`probableMatches\` array can be empty, and the summary should reflect that no simulated data could be generated.
Focus on creating 2 to 4 diverse, simulated profiles if possible.
`,
});

const personIntelFlow = ai.defineFlow(
  {
    name: 'personIntelFlow',
    inputSchema: PersonIntelInputSchema,
    outputSchema: PersonIntelOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate a response for person intel search.");
    }
    // Ensure imageHint is set for all matches if not provided by the model (though the tool should provide it)
    output.probableMatches = output.probableMatches.map(match => ({
      ...match,
      imageUrl: match.imageUrl || `https://placehold.co/100x100.png`, // Default placeholder
      imageHint: match.imageHint || "profile person",
    }));
    return output;
  }
);

    