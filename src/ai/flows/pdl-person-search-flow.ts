
'use server';
/**
 * @fileOverview Uses PeopleDataLabs (PDL) Person Search API to find details
 * for a person based on name and city.
 *
 * - pdlPersonSearch - A function that handles the PDL person search.
 * - PDLPersonSearchInput - The input type for the pdlPersonSearch function.
 * - PDLPersonSearchOutput - The return type for the pdlPersonSearch function.
 */

import { z } from 'genkit';
import { ai } from '@/ai/genkit';

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
  likelihood: z.number().optional().describe("PDL's likelihood score for the match (0-10)"), // Present in each search result item
});
export type PDLMatchedPerson = z.infer<typeof PDLMatchedPersonSchema>;

// Define output schema for Search API
const PDLPersonSearchOutputSchema = z.object({
  totalMatches: z.number().optional().describe('Total number of unique matches found by PDL.'),
  matches: z.array(PDLMatchedPersonSchema).describe('List containing the matched person profiles from PDL.'),
  errorMessage: z.string().optional().describe('Error message if the search failed.'),
});
export type PDLPersonSearchOutput = z.infer<typeof PDLPersonSearchOutputSchema>;

// Helper function to map PDL API response person object to our schema
function mapPdlPersonToSchema(pdlPerson: any): PDLMatchedPerson {
  return {
    id: pdlPerson.id, // Search API uses 'id'
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
    likelihood: pdlPerson.likelihood, // Likelihood is per person in search results
  };
}

// The actual flow function using Person Search API
async function callPdlSearchApi(input: PDLPersonSearchInput): Promise<PDLPersonSearchOutput> {
  console.log('[PDL Flow] Attempting to read PEOPLEDATALABS_API_KEY from process.env.');
  const apiKey = process.env.PEOPLEDATALABS_API_KEY;
  
  if (!apiKey) {
    console.error('[PDL Flow] CRITICAL: PEOPLEDATALABS_API_KEY is not configured or not found in process.env.');
    return { matches: [], totalMatches: 0, errorMessage: 'PeopleDataLabs API key is not configured in environment.' };
  }
  console.log(`[PDL Flow] PEOPLEDATALABS_API_KEY found. Starts with: ${apiKey.substring(0, 5)}...`);

  const pdlApiUrl = 'https://api.peopledatalabs.com/v5/person/search';
  
  // Construct SQL query carefully to avoid injection if user input were directly used,
  // though here it's from a trusted source (our form).
  // PDL uses single quotes for string literals in their SQL.
  // Escape single quotes in user input if necessary, though PDL might handle this.
  // For simplicity, assuming names/cities don't contain SQL-breaking characters.
  const sqlQuery = `SELECT * FROM person WHERE (name = '${input.fullName.replace(/'/g, "''")}' AND (location_locality = '${input.city.replace(/'/g, "''")}' OR location_region = '${input.city.replace(/'/g, "''")}'));`;

  const requestBody = {
    query: {
      sql: sqlQuery,
    },
    size: 10, // Max number of results to return
    pretty: false,
    titlecase: false,
  };

  try {
    console.log(`[PDL Flow] Sending POST request to PDL Search API: ${pdlApiUrl}`);
    console.log(`[PDL Flow] Using API Key that starts with: ${apiKey.substring(0,5)}...`);
    console.log(`[PDL Flow] Request body: ${JSON.stringify(requestBody)}`);
    
    const response = await fetch(pdlApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log(`[PDL Flow] Received response from PDL API with status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorBodyText = await response.text(); 
      console.error(`[PDL Flow] PDL API Error Response (Status: ${response.status}): ${errorBodyText}`);
      try {
        const errorData = JSON.parse(errorBodyText); 
        const detailMessage = errorData?.error?.message || errorData?.message || response.statusText || 'Unknown error';
        if (response.status === 404 && detailMessage.toLowerCase().includes("no person found")) {
             return { matches: [], totalMatches: 0, errorMessage: `No person found matching the criteria: ${input.fullName} in ${input.city}. (${detailMessage})` };
        }
        return { 
          matches: [], 
          totalMatches: 0,
          errorMessage: `PDL API Error (${response.status}): ${detailMessage}` 
        };
      } catch (parseError) {
        return { 
          matches: [], 
          totalMatches: 0,
          errorMessage: `PDL API Error (${response.status}): ${response.statusText}. Raw non-JSON response: ${errorBodyText}` 
        };
      }
    }

    const responseData = await response.json();
    console.log('[PDL Flow] Successfully parsed PDL API response data.');

    if (responseData && responseData.status === 200) {
      const mappedMatches = (responseData.data || []).map(mapPdlPersonToSchema);
      console.log(`[PDL Flow] Mapped ${mappedMatches.length} matches from PDL Search response. Total found by PDL: ${responseData.total || 0}.`);
      return {
        totalMatches: responseData.total || 0,
        matches: mappedMatches,
      };
    } else {
      console.error('[PDL Flow] PDL API returned non-200 status in body or unexpected structure:', responseData);
      return { 
          matches: [], 
          totalMatches: 0,
          errorMessage: `PDL API Error: ${responseData?.error?.message || responseData?.message || 'Received unexpected response structure from PDL'}` 
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
    return await callPdlSearchApi(input);
  }
);

// Exported wrapper function for direct invocation from server actions
export async function pdlPersonSearch(input: PDLPersonSearchInput): Promise<PDLPersonSearchOutput> {
  return pdlPersonSearchFlow(input);
}

    