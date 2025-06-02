
'use server';
/**
 * @fileOverview Searches for person profiles using the PeopleDataLabs (PDL) Search API.
 *
 * - searchPdlPersonProfiles - A function that searches for person profiles via PDL.
 * - PdlPersonSearchInput - The input type for the searchPdlPersonProfiles function.
 * - PdlPerson - The schema for an individual person record from PDL.
 * - PdlPersonSearchOutput - The return type for the searchPdlPersonProfiles function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PdlPersonSearchInputSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters.").describe('The full name of the person to search for.'),
  location: z.string().min(2, "Location must be at least 2 characters.").describe('The location (e.g., city, region, country) to search within.'),
  size: z.number().optional().default(10).describe('Number of results to return.'),
});
export type PdlPersonSearchInput = z.infer<typeof PdlPersonSearchInputSchema>;

const PdlPersonSchema = z.object({
  id: z.string().nullable().describe('PDL ID of the person.'),
  fullName: z.string().nullable().describe('Full name of the person.'),
  firstName: z.string().nullable().describe('First name.'),
  lastName: z.string().nullable().describe('Last name.'),
  gender: z.string().nullable().describe('Gender.'),
  birthYear: z.number().nullable().describe('Birth year.'),
  linkedinUrl: z.string().url().nullable().describe('LinkedIn profile URL.'),
  jobTitle: z.string().nullable().describe('Current job title.'),
  jobCompanyId: z.string().nullable().describe('PDL ID of the current company.'),
  jobCompanyName: z.string().nullable().describe('Name of the current company.'),
  jobCompanyWebsite: z.string().url().nullable().describe('Website of the current company.'),
  jobStartDate: z.string().nullable().describe('Start date of the current job.'),
  locationName: z.string().nullable().describe('Full location name.'),
  locationLocality: z.string().nullable().describe('City/locality.'),
  locationRegion: z.string().nullable().describe('State/region.'),
  locationCountry: z.string().nullable().describe('Country.'),
  phoneNumbers: z.array(z.string()).nullable().describe('List of phone numbers.'),
  emails: z.array(z.object({ address: z.string(), type: z.string().nullable() })).nullable().describe('List of email addresses.'),
  likelihood: z.number().nullable().describe('Likelihood score from PDL (1-5).'),
  skills: z.array(z.string()).nullable().describe('List of skills.'),
  summary: z.string().nullable().describe('Professional summary.'),
  dataset_version: z.string().optional().describe('PDL dataset version.'),
});
export type PdlPerson = z.infer<typeof PdlPersonSchema>;

const PdlPersonSearchOutputSchema = z.object({
  matches: z.array(PdlPersonSchema).describe('Array of matching person profiles from PDL.'),
  totalMatches: z.number().describe('Total number of potential matches found by PDL.'),
  pdlQuery: z.string().optional().describe('The Elasticsearch-style JSON query sent to PDL.'),
  error: z.string().optional().describe('Error message if the search failed.'),
});
export type PdlPersonSearchOutput = z.infer<typeof PdlPersonSearchOutputSchema>;


export async function searchPdlPersonProfiles(input: PdlPersonSearchInput): Promise<PdlPersonSearchOutput> {
  return pdlPersonSearchFlow(input);
}

const pdlPersonSearchFlow = ai.defineFlow(
  {
    name: 'pdlPersonSearchFlow',
    inputSchema: PdlPersonSearchInputSchema,
    outputSchema: PdlPersonSearchOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.PEOPLEDATALABS_API_KEY;
    console.log('[PDL Flow] Invoked with input:', JSON.stringify(input));
    console.log('[PDL Flow] Attempting to read PEOPLEDATALABS_API_KEY from process.env.');

    if (!apiKey || apiKey === "YOUR_PDL_API_KEY_HERE" || apiKey.trim() === "") {
      console.error('[PDL Flow] CRITICAL: PEOPLEDATALABS_API_KEY is not configured or is a placeholder.');
      return {
        matches: [],
        totalMatches: 0,
        error: 'PDL API Key error. Please check your server configuration.',
      };
    }
    console.log(`[PDL Flow] PEOPLEDATALABS_API_KEY found. Starts with: ${apiKey.substring(0, 5)}...`);

    const nameParts = input.fullName.trim().split(/\s+/).filter(p => p.length > 0);
    const locationTerm = input.location.trim();
    let pdlEsQueryForLogging: string | undefined;

    try {
      const mustClauses: any[] = [];

      if (nameParts.length > 0) {
        if (nameParts.length === 1) {
          mustClauses.push({
            "bool": {
              "should": [
                { "match": { "first_name": nameParts[0] } },
                { "match": { "last_name": nameParts[0] } },
                { "match_phrase": { "full_name": input.fullName } }
              ]
            }
          });
        } else {
          mustClauses.push({
            "bool": {
              "should": [
                {
                  "bool": {
                    "must": [
                      { "match": { "first_name": nameParts[0] } },
                      { "match_phrase": { "last_name": nameParts.slice(1).join(" ") } }
                    ]
                  }
                },
                { "match_phrase": { "full_name": input.fullName } }
              ]
            }
          });
        }
      } else {
        return { matches: [], totalMatches: 0, error: 'Full name is required for search.' };
      }

      if (locationTerm) {
        mustClauses.push({
          "bool": {
            "should": [
              { "match": { "location_locality": locationTerm } },
              { "match": { "location_region": locationTerm } },
              { "match": { "location_country": locationTerm } },
              { "match_phrase": { "location_name": locationTerm } }
            ]
          }
        });
      } else {
        return { matches: [], totalMatches: 0, error: 'Location is required for search.' };
      }

      const pdlEsQuery = {
        bool: {
          must: mustClauses,
        },
      };
      pdlEsQueryForLogging = JSON.stringify(pdlEsQuery);
      console.log('[PDL Flow] Constructed PDL Elasticsearch Query:', pdlEsQueryForLogging);

      const requestBody = {
        query: pdlEsQuery,
        size: input.size || 10,
        // title_case: true, // Optional
      };

      const PDL_SEARCH_API_URL = 'https://api.peopledatalabs.com/v5/person/search';
      console.log(`[PDL Flow] Sending POST request to PDL Search API: ${PDL_SEARCH_API_URL}`);
      
      const response = await fetch(PDL_SEARCH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log(`[PDL Flow] Received response from PDL API with status: ${response.status} ${response.statusText}`);
      // console.log('[PDL Flow] PDL API Raw Response Body:', responseText); // Uncomment for very verbose debugging

      if (!response.ok) {
        let errorDetails = `PDL API Error (${response.status}): ${response.statusText}`;
        try {
          const errorJson = JSON.parse(responseText);
          errorDetails += ` - ${errorJson.error?.message || errorJson.message || 'No specific error message in JSON.'}`;
          if(errorJson.error?.type) errorDetails += ` (Type: ${errorJson.error.type})`;
        } catch (e) {
          errorDetails += ` - Could not parse error response JSON. Raw response: ${responseText.substring(0, 200)}`;
        }
        console.error('[PDL Flow] Error response details:', errorDetails);
        return { matches: [], totalMatches: 0, error: errorDetails, pdlQuery: pdlEsQueryForLogging };
      }

      const responseData = JSON.parse(responseText);

      if (responseData.status === 200 && responseData.data) {
        const matches: PdlPerson[] = responseData.data.map((pdlPerson: any) => ({
          id: pdlPerson.id,
          fullName: pdlPerson.full_name,
          firstName: pdlPerson.first_name,
          lastName: pdlPerson.last_name,
          gender: pdlPerson.gender,
          birthYear: pdlPerson.birth_year,
          linkedinUrl: pdlPerson.linkedin_url,
          jobTitle: pdlPerson.job_title,
          jobCompanyId: pdlPerson.job_company_id,
          jobCompanyName: pdlPerson.job_company_name,
          jobCompanyWebsite: pdlPerson.job_company_website,
          jobStartDate: pdlPerson.job_start_date,
          locationName: pdlPerson.location_name,
          locationLocality: pdlPerson.location_locality,
          locationRegion: pdlPerson.location_region,
          locationCountry: pdlPerson.location_country,
          phoneNumbers: pdlPerson.phone_numbers, // Assumes phone_numbers is always an array or null/undefined
          emails: Array.isArray(pdlPerson.emails) 
            ? pdlPerson.emails.map((e: any) => ({ address: e.address, type: e.type || null })) 
            : [],
          skills: pdlPerson.skills, // Assumes skills is always an array or null/undefined
          summary: pdlPerson.summary,
          likelihood: pdlPerson.likelihood,
          dataset_version: pdlPerson.dataset_version,
        }));

        return {
          matches: matches,
          totalMatches: responseData.total || 0,
          pdlQuery: pdlEsQueryForLogging,
        };
      } else {
        console.warn('[PDL Flow] PDL API did not return status 200 or data was missing. Response:', responseData);
        return {
          matches: [],
          totalMatches: 0,
          error: `PDL API returned status ${responseData.status || response.status} but data was missing or malformed.`,
          pdlQuery: pdlEsQueryForLogging,
        };
      }
    } catch (error) {
      console.error('[PDL Flow] Exception during API call:', error);
      let errorMessage = 'An unexpected error occurred during PDL search.';
      if (error instanceof Error) {
        errorMessage = `PDL Search Exception: ${error.message}`;
      }
      return { matches: [], totalMatches: 0, error: errorMessage, pdlQuery: pdlEsQueryForLogging };
    }
  }
);

