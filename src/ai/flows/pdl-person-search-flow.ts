
'use server';
/**
 * @fileOverview Uses PeopleDataLabs (PDL) Person Enrich API to find details
 * for a person based on name and city.
 *
 * - pdlPersonSearch - A function that handles the PDL person enrichment.
 * - PDLPersonSearchInput - The input type for the pdlPersonSearch function.
 * - PDLPersonSearchOutput - The return type for the pdlPersonSearch function.
 */

import { z } from 'genkit';
import { ai } from '@/ai/genkit';

// Define input schema (remains the same)
const PDLPersonSearchInputSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters.").describe('The full name of the person to search for.'),
  city: z.string().min(2, "City name must be at least 2 characters.").describe('The city or region to narrow down the search.'),
});
export type PDLPersonSearchInput = z.infer<typeof PDLPersonSearchInputSchema>;

// Define schemas for nested parts of the PDL response we care about (remains the same)
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
  likelihood: z.number().optional().describe("PDL's likelihood score for the match (0-10)"),
});
export type PDLMatchedPerson = z.infer<typeof PDLMatchedPersonSchema>;

// Define output schema (totalMatches will be 0 or 1)
const PDLPersonSearchOutputSchema = z.object({
  totalMatches: z.number().optional().describe('Total number of unique matches found by PDL (0 or 1 for enrich).'),
  matches: z.array(PDLMatchedPersonSchema).describe('List containing the matched person profile from PDL (0 or 1 item).'),
  errorMessage: z.string().optional().describe('Error message if the search failed.'),
});
export type PDLPersonSearchOutput = z.infer<typeof PDLPersonSearchOutputSchema>;

// Helper function to map PDL API response person object to our schema
function mapPdlPersonToSchema(pdlPerson: any): PDLMatchedPerson {
  return {
    id: pdlPerson.pdl_id || pdlPerson.id, // Enrich API might use 'pdl_id'
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
  };
}


// The actual flow function using Person Enrich API
async function callPdlEnrichApi(input: PDLPersonSearchInput): Promise<PDLPersonSearchOutput> {
  console.log('[PDL Flow] Attempting to read PEOPLEDATALABS_API_KEY from process.env.');
  const apiKey = process.env.PEOPLEDATALABS_API_KEY;
  
  if (!apiKey) {
    console.error('[PDL Flow] CRITICAL: PEOPLEDATALABS_API_KEY is not configured or not found in process.env.');
    return { matches: [], totalMatches: 0, errorMessage: 'PeopleDataLabs API key is not configured in environment.' };
  }
  console.log(`[PDL Flow] PEOPLEDATALABS_API_KEY found. Starts with: ${apiKey.substring(0, 5)}...`);

  const baseUrl = 'https://api.peopledatalabs.com/v5/person/enrich';
  const params = new URLSearchParams({
    name: input.fullName,
    location: input.city,
    pretty: 'false', 
    titlecase: 'false',
  });
  const pdlApiUrl = `${baseUrl}?${params.toString()}`;

  try {
    console.log(`[PDL Flow] Sending GET request to PDL Enrich API: ${pdlApiUrl}`);
    console.log(`[PDL Flow] Using API Key that starts with: ${apiKey.substring(0,5)}...`);
    
    const response = await fetch(pdlApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
    });
    
    console.log(`[PDL Flow] Received response from PDL API with status: ${response.status} ${response.statusText}`);

    if (response.status === 404) {
      console.log('[PDL Flow] PDL API returned 404 - Person not found.');
      const errorData = await response.json().catch(() => ({ message: 'Person not found and failed to parse error response.' }));
      const detailMessage = errorData?.error?.message || errorData?.message || "Person not found with the provided details.";
      console.log(`[PDL Flow] 404 Detail: ${detailMessage}`);
      return { matches: [], totalMatches: 0, errorMessage: detailMessage };
    }

    if (!response.ok) {
      let errorBodyText = await response.text(); // Read body as text first
      console.error(`[PDL Flow] PDL API Error Response (Status: ${response.status}): ${errorBodyText}`);
      try {
        const errorData = JSON.parse(errorBodyText); // Try to parse as JSON
        return { 
          matches: [], 
          totalMatches: 0,
          errorMessage: `PDL API Error (${response.status}): ${errorData?.error?.message || errorData?.message || response.statusText || 'Unknown error'}` 
        };
      } catch (parseError) {
        // If JSON parsing fails, return the raw text
        return { 
          matches: [], 
          totalMatches: 0,
          errorMessage: `PDL API Error (${response.status}): ${response.statusText}. Raw non-JSON response: ${errorBodyText}` 
        };
      }
    }

    const personData = await response.json();
    console.log('[PDL Flow] Successfully parsed PDL API response data.');

    if (personData && (personData.status === 200 || response.status === 200)) { // PDL sometimes includes status in body
      const mappedPerson = mapPdlPersonToSchema(personData); // `personData` itself is the person object for Enrich
      console.log(`[PDL Flow] Mapped 1 match from PDL Enrich response for ${mappedPerson.fullName}.`);
      return {
        totalMatches: 1,
        matches: [mappedPerson],
      };
    } else {
      console.error('[PDL Flow] PDL API returned non-200 status in body or unexpected structure:', personData);
      return { 
          matches: [], 
          totalMatches: 0,
          errorMessage: `PDL API Error: ${personData?.error?.message || personData?.message || 'Received unexpected response structure from PDL'}` 
      };
    }

  } catch (error) {
    console.error('[PDL Flow] Error calling PDL API:', error);
    if (error instanceof Error) {
        return { matches: [], totalMatches: 0, errorMessage: `Failed to fetch data from PeopleDataLabs: ${error.message}` };
    }
    return { matches: [], totalMatches: 0, errorMessage: 'An unknown error occurred while fetching data from PeopleDataLabs.' };
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
    console.log(`[PDL Flow] Flow invoked with input: FullName='${input.fullName}', City='${input.city}'`);
    return await callPdlEnrichApi(input);
  }
);

// Exported wrapper function for direct invocation from server actions
export async function pdlPersonSearch(input: PDLPersonSearchInput): Promise<PDLPersonSearchOutput> {
  return pdlPersonSearchFlow(input);
}
