
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
  name: z.string().describe('The full name of the potential match, or a description of the search type (e.g., "Username Search via WhatsMyName", "General Web Search Summary").'),
  sourcePlatform: z.string().describe('The simulated platform or search method (e.g., Facebook, LinkedIn, News Article, WhatsMyName.app, Simulated Search Engine).'),
  profileUrl: z.string().url().optional().describe('A direct URL to the simulated profile, source page, relevant tool (e.g., https://whatsmyname.app/), or search engine query.'),
  imageUrl: z.string().url().describe('URL of a representative placeholder image for the person or concept (e.g., https://placehold.co/100x100.png).'),
  imageHint: z.string().default('profile person').describe('A hint for the placeholder image, e.g., "profile person", "network search", "search results".'),
  details: z.string().describe('A brief summary of relevant information found or a description of what the source offers or might reveal.'),
  locationMatch: z.string().optional().describe('How the found location data relates to the input city (e.g., "Exact Match", "Nearby City", "Region Mentioned", "N/A for username search", "N/A for general search summary").'),
  confidenceScore: z.number().min(0).max(1).optional().describe('A simulated confidence score (0.0 to 1.0) of this match being correct or relevant.')
});
export type ProbablePersonMatch = z.infer<typeof ProbablePersonMatchSchema>;

const PersonIntelOutputSchema = z.object({
  overallSummary: z.string().describe('A high-level summary of the search findings and methodology, including insights from simulated search engine results.'),
  probableMatches: z.array(ProbablePersonMatchSchema).describe('A list of probable individuals, OSINT tool summaries, or search engine result summaries matching the search criteria. Aim for 2-4 diverse simulated entries.'),
  dataSourcesAnalyzed: z.array(z.string().url()).describe('A list of unique, simulated URLs that were analyzed to generate the matches (e.g., fake social media search result pages, mock news article links, https://whatsmyname.app/, simulated search engine query URLs).'),
});
export type PersonIntelOutput = z.infer<typeof PersonIntelOutputSchema>;

export async function personIntelSearch(input: PersonIntelInput): Promise<PersonIntelOutput> {
  return personIntelFlow(input);
}

// Simulated Tool: Search Web for Person (including WhatsMyName.app and a simulated search engine query)
const searchWebForPersonByNameCity = ai.defineTool(
  {
    name: 'searchWebForPersonByNameCity',
    description: 'Simulates searching the web (social media, public records, news) for a person. Returns a list of plausible-sounding FAKE URLs, a link to "https://whatsmyname.app/", and a simulated search engine query URL.',
    inputSchema: z.object({
      fullName: z.string(),
      city: z.string(),
    }),
    outputSchema: z.array(z.string().url()).describe('An array of 2 to 5 FAKE URLs (e.g., fake social media profiles, mock news), "https://whatsmyname.app/", and a simulated search engine query URL. These are for simulation.'),
  },
  async (input) => {
    console.log(`Simulating web search for: ${input.fullName} in ${input.city}, including WhatsMyName.app and a search engine query.`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    const nameSlug = input.fullName.toLowerCase().replace(/\s+/g, '.');
    const citySlug = input.city.toLowerCase().replace(/\s+/g, '');
    const searchQuery = encodeURIComponent(`${input.fullName} ${input.city}`);
    return [
      `https://fake-social-platform.example.com/profile/${nameSlug}-${citySlug}`,
      'https://whatsmyname.app/',
      `https://localnews.example.org/${citySlug}/article/${nameSlug}-feature`,
      `https://fake-search-engine.example.com/search?q=${searchQuery}`, // Simulated search engine URL
      `https://another-social.example.net/users/${nameSlug}`
    ].slice(0, Math.floor(Math.random() * 2) + 3); // Return 3-4 URLs (will pick some from the above, including the search query)
  }
);

// Simulated Tool: Extract Profile Information from a URL, Summarize WhatsMyName.app, or Summarize Search Engine Results
const extractPersonProfileFromUrl = ai.defineTool(
  {
    name: 'extractPersonProfileFromUrl',
    description: 'Given a FAKE URL, simulate extracting structured information. If URL is "https://whatsmyname.app/", provide a summary of its purpose. If URL is a "fake-search-engine.example.com" URL, provide a summary of potential findings one might get from such a search. Always provide a placeholder image URL.',
    inputSchema: z.object({
      url: z.string().url(),
      originalFullName: z.string().describe("The original full name used in the search query, for context."),
      originalCity: z.string().describe("The original city used in the search query, for context."),
    }),
    outputSchema: ProbablePersonMatchSchema,
  },
  async (input) => {
    console.log(`Simulating profile/info extraction from: ${input.url} for ${input.originalFullName}`);
    await new Promise(resolve => setTimeout(resolve, 700)); 

    if (input.url === 'https://whatsmyname.app/') {
      const derivedUsername = input.originalFullName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '');
      return {
        name: `Username Search for "${input.originalFullName}"`,
        sourcePlatform: "WhatsMyName.app (Username Check)",
        profileUrl: 'https://whatsmyname.app/',
        imageUrl: `https://placehold.co/100x100.png`,
        imageHint: "network search tool",
        details: `This tool, WhatsMyName.app, can be used to check for the existence of a username (e.g., "${derivedUsername}") across many online platforms. To perform a real search, visit the site and enter the desired username. This entry is a conceptual placeholder.`,
        locationMatch: "N/A (Username search tool)",
        confidenceScore: 0.55, 
      };
    }

    if (input.url.includes('fake-search-engine.example.com')) {
        return {
            name: `General Web Search Summary for "${input.originalFullName}" in "${input.originalCity}"`,
            sourcePlatform: "Simulated Search Engine",
            profileUrl: input.url, // Link to the simulated search query
            imageUrl: `https://placehold.co/100x100.png`,
            imageHint: "search results",
            details: `A simulated web search for "${input.originalFullName}" in "${input.originalCity}" might reveal:
- Public records or mentions in local directories.
- Possible social media profiles (requiring further investigation).
- News articles or blog posts related to the name in the specified region.
- Connections to local businesses or community groups.
This is a general summary; actual results would vary greatly.`,
            locationMatch: "N/A (General search summary)",
            confidenceScore: 0.50, // Represents relevance as a general search summary
        };
    }

    let platform = "Generic Public Record";
    if (input.url.includes('fake-social-platform.example.com')) platform = "Fake Social Platform";
    else if (input.url.includes('another-social.example.net')) platform = "Another Social Net";
    else if (input.url.includes('localnews.example.org')) platform = "Local News Outlet";
    
    const firstNames = ["Alex", "Jamie", "Chris", "Pat", "Jordan"];
    const lastNames = ["Doe", "Smith", "Garcia", "Miller", "Davis"];
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
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
      imageUrl: `https://placehold.co/100x100.png`,
      imageHint: "profile person avatar",
      details: details[Math.floor(Math.random() * details.length)],
      locationMatch: Math.random() > 0.5 ? `Active in ${input.originalCity}` : `Potentially linked to ${input.originalCity} region.`,
      confidenceScore: Math.random() * 0.3 + 0.6, 
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
1.  Use the \`searchWebForPersonByNameCity\` tool to get a list of FAKE (simulated) URLs. This list may include:
    *   Conceptual links to social media or news articles.
    *   A conceptual link to "https://whatsmyname.app/".
    *   A simulated search engine query URL (e.g., from fake-search-engine.example.com).
2.  For each unique and relevant URL obtained (maximum of 3-4 diverse URLs), use the \`extractPersonProfileFromUrl\` tool.
    *   If the URL is for "https://whatsmyname.app/", the tool will return a summary of its purpose for username checking. Include this as a "match".
    *   If the URL is a simulated search engine query, the tool will return a general summary of potential findings from such a search. Include this as a "match".
    *   For other URLs, the tool will extract simulated details for a \`ProbablePersonMatch\` object.
    *   Ensure each match has a unique placeholder image URL (e.g., \`https://placehold.co/100x100.png\`) and an appropriate \`imageHint\`.
    *   Generate plausible but fictional details for profiles.
    *   Simulate a \`confidenceScore\` for each match.
3.  Compile these matches/summaries into the \`probableMatches\` array. Aim for 2-4 diverse entries, including any search engine or WhatsMyName summaries.
4.  Provide an \`overallSummary\` explaining the simulated search process. Mention that results are illustrative and based on simulated data. If WhatsMyName.app was included, explain its conceptual role. If a simulated search engine query was processed, briefly mention what insights a general web search might provide.
5.  List all unique URLs processed in the \`dataSourcesAnalyzed\` field.
Do NOT use real people's names or details. All data should be plausible fiction, except for the description of WhatsMyName.app's function and general statements about search engine use.
If no relevant URLs are found by \`searchWebForPersonByNameCity\`, the \`probableMatches\` array can be empty, and the summary should reflect that no simulated data could be generated.
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
    output.probableMatches = output.probableMatches.map(match => ({
      ...match,
      imageUrl: match.imageUrl || `https://placehold.co/100x100.png`,
      imageHint: match.imageHint || (match.sourcePlatform?.includes("WhatsMyName") ? "network search tool" : (match.sourcePlatform?.includes("Search Engine") ? "search results" : "profile person")),
    }));
    return output;
  }
);
    
