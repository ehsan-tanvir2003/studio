
'use server';
/**
 * @fileOverview Interacts with a generic RapidAPI endpoint for text-based image search.
 *
 * - searchImageWithRapidApi - A function that takes a query and gets search results.
 * - RapidApiTextImageSearchInput - The input type for the function.
 * - RapidApiMatch - Represents a single match found.
 * - RapidApiTextImageSearchOutput - The return type for the function.
 *
 * IMPORTANT: This flow is a generic template. You MUST customize the
 * response parsing (`responseData.results...`) to match the specific RapidAPI endpoint.
 * Consult the API's documentation on RapidAPI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RapidApiTextImageSearchInputSchema = z.object({
  query: z.string().min(1, "Search query cannot be empty.").describe("The text query to search for images."),
  limit: z.number().optional().default(10).describe("Number of image results to return."),
  // Add other optional parameters from the API as needed (e.g., size, color, type, region)
  // For example: region: z.string().optional().default('us').describe("Region for the search."),
  apiEndpointUrl: z.string().url().describe("The full URL for the RapidAPI image search endpoint (e.g., https://host.com/search)."),
});
export type RapidApiTextImageSearchInput = z.infer<typeof RapidApiTextImageSearchInputSchema>;

const RapidApiMatchSchema = z.object({
  url: z.string().url().describe('URL of the found image or webpage containing the image.'),
  score: z.number().optional().nullable().describe('Confidence score or relevance of the match (if provided by API).'),
  thumbnail: z.string().url().optional().nullable().describe('URL of the thumbnail for the match (if provided).'),
  title: z.string().optional().nullable().describe('Title or description of the match (if provided).'),
  source: z.string().optional().nullable().describe('Source website or domain of the image (if provided).'),
  // Add other fields that your chosen RapidAPI endpoint might return
});
export type RapidApiMatch = z.infer<typeof RapidApiMatchSchema>;

const RapidApiTextImageSearchOutputSchema = z.object({
  success: z.boolean().describe('Whether the API call was successful based on HTTP status.'),
  matches: z.array(RapidApiMatchSchema).optional().nullable().describe('Array of matching items.'),
  message: z.string().optional().nullable().describe('A message from the API, or an error message if success is false.'),
  error: z.string().optional().describe('Internal error message if the flow failed.'),
  rawResponse: z.any().optional().describe('The raw response from the API for debugging if needed.')
});
export type RapidApiTextImageSearchOutput = z.infer<typeof RapidApiTextImageSearchOutputSchema>;

export async function searchImagesWithTextQuery(input: RapidApiTextImageSearchInput): Promise<RapidApiTextImageSearchOutput> {
  return rapidApiTextImageSearchFlow(input);
}

const rapidApiTextImageSearchFlow = ai.defineFlow(
  {
    name: 'rapidApiTextImageSearchFlow',
    inputSchema: RapidApiTextImageSearchInputSchema,
    outputSchema: RapidApiTextImageSearchOutputSchema,
  },
  async (input) => {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST; // This should be 'real-time-image-search.p.rapidapi.com'
    console.log('[RapidAPI Text Search Flow] Invoked.');

    if (!rapidApiKey || rapidApiKey.trim() === "" || !rapidApiHost || rapidApiHost.trim() === "") {
      console.error('[RapidAPI Text Search Flow] CRITICAL: RAPIDAPI_KEY or RAPIDAPI_HOST is not configured.');
      return {
        success: false,
        error: 'RapidAPI Key or Host is not configured. Please check server configuration.',
        message: 'RapidAPI Key or Host is not configured. Please check server configuration.',
      };
    }
    console.log(`[RapidAPI Text Search Flow] Using Key (starts with: ${rapidApiKey.substring(0, Math.min(5, rapidApiKey.length))}) and Host: ${rapidApiHost}`);
    
    try {
      const { query, limit, apiEndpointUrl } = input; // apiEndpointUrl is like https://real-time-image-search.p.rapidapi.com/search

      const searchParams = new URLSearchParams({
        query: query,
        limit: (limit || 10).toString(),
        // Add other default or passed-in parameters here:
        // size: "any",
        // color: "any",
        // type: "any",
        // time: "any",
        // usage_rights: "any",
        // file_type: "any",
        // aspect_ratio: "any",
        // safe_search: "off",
        // region: input.region || "us",
      });

      const fullUrl = `${apiEndpointUrl}?${searchParams.toString()}`;
      
      console.log(`[RapidAPI Text Search Flow] Sending GET request to ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': rapidApiHost,
        },
      });

      const responseText = await response.text();
      console.log(`[RapidAPI Text Search Flow] Received response from API with status: ${response.status} ${response.statusText}`);
      
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(`[RapidAPI Text Search Flow] Could not parse API response as JSON. Status: ${response.status}. Raw response: ${responseText.substring(0, 500)}`);
        return {
            success: false,
            message: `API response was not valid JSON, though status was ${response.status}.`,
            error: `API response was not valid JSON. Raw: ${responseText.substring(0,100)}...`,
            rawResponse: responseText,
        };
      }

      if (!response.ok) {
        console.error(`[RapidAPI Text Search Flow] API returned error. Status: ${response.status}. Response: ${JSON.stringify(responseData).substring(0, 500)}`);
        let errorMsg = `RapidAPI Error (${response.status} ${response.statusText})`;
        if (responseData && (responseData.message || responseData.error || responseData.detail)) {
          errorMsg += ` - ${responseData.message || responseData.error || responseData.detail}`;
        } else if (responseText.length > 0 && responseText.length < 300) {
          errorMsg += ` - ${responseText}`;
        }
        return {
          success: false,
          message: errorMsg,
          error: errorMsg,
          rawResponse: responseData,
        };
      }
      
      // --- IMPORTANT: CUSTOMIZE RESPONSE PARSING BELOW ---
      // Adapt this to the actual structure of your chosen API's success response.
      // The example below assumes 'responseData.data' is an array of items.
      // The real-time-image-search API seems to return `responseData.data` which is an array of objects.
      // Each object has 'image_url', 'thumbnail_url', 'title', 'source_url', 'domain'.
      const matches: RapidApiMatch[] = (responseData.data || []).map((item: any) => ({
        url: item.image_url || item.source_url, // Prefer image_url if available
        score: item.score, // This API might not provide a score
        thumbnail: item.thumbnail_url,
        title: item.title,
        source: item.domain,
      })).filter((match: RapidApiMatch) => match.url);

      return {
        success: true,
        matches: matches,
        message: responseData.message || (matches.length > 0 ? `${matches.length} matches found.` : "No matches found."),
        rawResponse: responseData,
      };

    } catch (error) {
      console.error('[RapidAPI Text Search Flow] Exception during API call or response processing:', error);
      let errorMessage = 'An unexpected error occurred during RapidAPI text image search.';
      if (error instanceof Error) {
        errorMessage = `RapidAPI Text Search Exception: ${error.message}`;
      }
      return { success: false, error: errorMessage, message: errorMessage };
    }
  }
);
