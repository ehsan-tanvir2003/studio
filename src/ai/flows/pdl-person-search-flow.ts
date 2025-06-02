
'use server';
/**
 * @fileOverview Searches PeopleDataLabs (PDL) for person profiles based on name and city.
 *
 * - pdlPersonSearch - A function that handles the PDL person search.
 * - PDLPersonSearchInput - The input type for the pdlPersonSearch function.
 * - PDLPersonSearchOutput - The return type for the pdlPersonSearch function.
 */

import { z } from 'genkit';
import { ai } from '@/ai/genkit'; // Assuming ai object is configured for Genkit

// Define input schema
const PDLPersonSearchInputSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters.").describe('The full name of the person to search for.'),
  city: z.string().min(2, "City name must be at least 2 characters.").describe('The city or region to narrow down the search.'),
});
export type PDLPersonSearchInput = z.infer<typeof PDLPersonSearchInputSchema>;

// Define schemas for nested parts of the PDL response we care about
const PDLSocialProfileSchema = z.object({
  service: z.string().optional().describe("Name of the social media service (e.g., linkedin, facebook)"),
  url: z.string().url().optional().describe("URL to the social media profile"),
});

const PDLExperienceSchema = z.object({
  companyName: z.string().optional().describe("Company name"),
  title: z.string().optional().describe("Job title"),
  startDate: z.string().optional().describe("Start date of the role"),
  endDate: z.string().optional().describe("End date of the role (or 'Present')"),
  location: z.string().optional().describe("Location of the role"),
});

const PDLEducationSchema = z.object({
  schoolName: z.string().optional().describe("Name of the educational institution"),
  degrees: z.array(z.string()).optional().describe("Degrees obtained"),
  endDate: z.string().optional().describe("End date of education"),
});

const PDLMatchedPersonSchema = z.object({
  id: z.string().optional().describe("PDL ID of the person"),
  fullName: z.string().optional().describe("Full name of the matched person"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  gender: z.string().optional(),
  birthYear: z.number().optional(),
  linkedinUrl: z.string().url().optional().describe("LinkedIn profile URL"),
  jobTitle: z.string().optional().describe("Current or most recent job title"),
  jobCompanyId: z.string().optional().describe("PDL ID for the company"),
  jobCompanyName: z.string().optional().describe("Current or most recent company name"),
  jobCompanyWebsite: z.string().url().optional().describe("Company website"),
  locationLocality: z.string().optional().describe("City/Locality"),
  locationRegion: z.string().optional().describe("State/Region"),
  locationCountry: z.string().optional().describe("Country"),
  emails: z.array(z.object({ address: z.string().email(), type: z.string().optional() })).optional().describe("Associated email addresses"),
  phoneNumbers: z.array(z.string()).optional().describe("Associated phone numbers"),
  skills: z.array(z.string()).optional().describe("List of skills"),
  socialProfiles: z.array(PDLSocialProfileSchema).optional().describe("Associated social media profiles"),
  experience: z.array(PDLExperienceSchema).optional().describe("Work experience"),
  education: z.array(PDLEducationSchema).optional().describe("Education history"),
  likelihood: z.number().optional().describe("PDL's likelihood score for the match (0-10)"), // PDL score is usually 0-10
});
export type PDLMatchedPerson = z.infer<typeof PDLMatchedPersonSchema>;

// Define output schema
const PDLPersonSearchOutputSchema = z.object({
  totalMatches: z.number().optional().describe('Total number of potential matches found by PDL.'),
  matches: z.array(PDLMatchedPersonSchema).describe('List of matched person profiles from PDL.'),
  errorMessage: z.string().optional().describe('Error message if the search failed.'),
});
export type PDLPersonSearchOutput = z.infer<typeof PDLPersonSearchOutputSchema>;


// The actual flow function
async function searchPDLApi(input: PDLPersonSearchInput): Promise<PDLPersonSearchOutput> {
  console.log('[PDL Flow] Attempting to read PEOPLEDATALABS_API_KEY from process.env.');
  const apiKey = process.env.PEOPLEDATALABS_API_KEY;
  
  if (!apiKey) {
    console.error('[PDL Flow] PEOPLEDATALABS_API_KEY is not configured or not found in process.env.');
    return { matches: [], errorMessage: 'PeopleDataLabs API key is not configured.' };
  }
  console.log('[PDL Flow] PEOPLEDATALABS_API_KEY found.');

  const pdlApiUrl = 'https://api.peopledatalabs.com/v5/person/search';

  // Construct a more flexible query. PDL's SQL-like syntax can be powerful.
  // We'll search for full_name containing the input and location_locality matching the city.
  // Using CONTAINS for name for broader matching.
  const sqlQuery = `SELECT * FROM person WHERE (CONTAINS(full_name, '${input.fullName.replace(/'/g, "''")}') OR full_name = '${input.fullName.replace(/'/g, "''")}') AND location_locality = '${input.city.replace(/'/g, "''")}' LIMIT 10;`;
  
  // Alternative stricter query:
  // const sqlQuery = `SELECT * FROM person WHERE full_name = '${input.fullName.replace(/'/g, "''")}' AND location_locality = '${input.city.replace(/'/g, "''")}' LIMIT 10;`;


  try {
    console.log(`[PDL Flow] Sending request to PDL API with query: ${sqlQuery}`);
    const response = await fetch(pdlApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        sql: sqlQuery,
        size: 10, // Max number of results to return
      }),
    });
    console.log(`[PDL Flow] Received response from PDL API with status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from PDL API' }));
      console.error('[PDL Flow] PDL API Error Response:', errorData);
      return { 
        matches: [], 
        errorMessage: `PDL API Error (${response.status}): ${errorData?.error?.message || errorData?.message || response.statusText || 'Unknown error'}` 
      };
    }

    const data = await response.json();
    console.log('[PDL Flow] Successfully parsed PDL API response data.');

    if (data.status !== 200) {
        console.error('[PDL Flow] PDL API returned non-200 status in body:', data);
        return { 
            matches: [], 
            errorMessage: `PDL API Error: ${data?.error?.message || data?.message || 'Received non-200 status from PDL'}` 
        };
    }
    
    const matches: PDLMatchedPerson[] = (data.data || []).map((pdlPerson: any) => ({
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
      locationLocality: pdlPerson.location_locality,
      locationRegion: pdlPerson.location_region,
      locationCountry: pdlPerson.location_country,
      emails: (pdlPerson.emails || []).map((e:any) => ({address: e.address, type: e.type})),
      phoneNumbers: pdlPerson.phone_numbers || [],
      skills: pdlPerson.skills || [],
      socialProfiles: (pdlPerson.profiles || []).filter((prof: any) => prof.network && prof.url).map((prof: any) => ({
        service: prof.network,
        url: prof.url,
      })),
      experience: (pdlPerson.experience || []).map((exp: any) => ({
        companyName: exp.company?.name,
        title: exp.title?.name,
        startDate: exp.start_date,
        endDate: exp.end_date,
        location: exp.location?.name,
      })),
      education: (pdlPerson.education || []).map((edu: any) => ({
        schoolName: edu.school?.name,
        degrees: edu.degrees || [],
        endDate: edu.end_date,
      })),
      likelihood: pdlPerson.likelihood,
    }));

    console.log(`[PDL Flow] Mapped ${matches.length} matches from PDL response.`);
    return {
      totalMatches: data.total || 0,
      matches: matches,
    };

  } catch (error) {
    console.error('[PDL Flow] Error calling PDL API:', error);
    if (error instanceof Error) {
        return { matches: [], errorMessage: `Failed to fetch data from PeopleDataLabs: ${error.message}` };
    }
    return { matches: [], errorMessage: 'An unknown error occurred while fetching data from PeopleDataLabs.' };
  }
}

// Define and export the Genkit flow
export const pdlPersonSearchFlow = ai.defineFlow(
  {
    name: 'pdlPersonSearchFlow',
    inputSchema: PDLPersonSearchInputSchema,
    outputSchema: PDLPersonSearchOutputSchema,
  },
  async (input) => {
    return await searchPDLApi(input);
  }
);

// Exported wrapper function for direct invocation from server actions
export async function pdlPersonSearch(input: PDLPersonSearchInput): Promise<PDLPersonSearchOutput> {
  return pdlPersonSearchFlow(input);
}
