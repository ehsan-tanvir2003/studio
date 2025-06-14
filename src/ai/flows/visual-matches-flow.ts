
'use server';
/**
 * @fileOverview Searches for visual matches using the Real-Time Lens Data RapidAPI.
 *
 * - searchVisualMatchesWithUrl - A function that fetches visual matches for a given image URL.
 * - VisualMatchesInput - The input type for the searchVisualMatchesWithUrl function.
 * - VisualMatch - Schema for a single visual match item.
 * - VisualMatchesOutput - The return type for the searchVisualMatchesWithUrl function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VisualMatchesInputSchema = z.object({
  imageUrl: z.string().url("A valid public HTTP/HTTPS URL for the image is required.").describe('The public URL of the image to search for.'),
  language: z.string().optional().default('en').describe('Language code for results (e.g., en, es).'),
  country: z.string().optional().default('bd').describe('Country code for region-specific results (e.g., us, gb, bd).'),
});
export type VisualMatchesInput = z.infer<typeof VisualMatchesInputSchema>;

const VisualMatchSchema = z.object({
  title: z.string().optional().nullable().describe('Title of the matched item.'),
  link: z.string().url().optional().nullable().describe('Direct link to the item or page.'),
  source: z.string().optional().nullable().describe('The source website or domain (e.g., eBay.com).'),
  thumbnailUrl: z.string().url().optional().nullable().describe('URL of a thumbnail for the match.'),
  price: z.string().optional().nullable().describe('Price information, if available (often a string like "$19.99").'),
  // Add more fields here if the API returns other structured data you want to capture.
  // For example:
  // productId: z.string().optional().nullable(),
  // brand: z.string().optional().nullable(),
  // rating: z.number().optional().nullable(),
  raw: z.any().optional().nullable().describe('Original raw data for this match item for inspection.')
});
export type VisualMatch = z.infer<typeof VisualMatchSchema>;

const VisualMatchesOutputSchema = z.object({
  success: z.boolean().describe('Whether the API call was successful.'),
  matches: z.array(VisualMatchSchema).optional().nullable().describe('Array of visual matches found.'),
  message: z.string().optional().nullable().describe('A message from the API, or an error message if success is false.'),
  error: z.string().optional().describe('Internal error message if the flow failed or API returned an error.'),
  rawResponse: z.any().optional().describe('The raw response from the API for debugging.'),
});
export type VisualMatchesOutput = z.infer<typeof VisualMatchesOutputSchema>;

export async function searchVisualMatchesWithUrl(input: VisualMatchesInput): Promise<VisualMatchesOutput> {
  return visualMatchesFlow(input);
}

const visualMatchesFlow = ai.defineFlow(
  {
    name: 'visualMatchesFlow',
    inputSchema: VisualMatchesInputSchema,
    outputSchema: VisualMatchesOutputSchema,
  },
  async (input) => {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_LENS_HOST;
    console.log('[Visual Matches Flow] Invoked.');

    if (!rapidApiKey || rapidApiKey.trim() === "") {
      console.error('[Visual Matches Flow] CRITICAL: RAPIDAPI_KEY is not configured.');
      return {
        success: false,
        error: 'RapidAPI Key is not configured. Please check server configuration.',
        message: 'RapidAPI Key is not configured.',
      };
    }
    if (!rapidApiHost || rapidApiHost.trim() === "") {
      console.error('[Visual Matches Flow] CRITICAL: RAPIDAPI_LENS_HOST is not configured.');
      return {
        success: false,
        error: 'RapidAPI Lens Host is not configured. Please check server configuration.',
        message: 'RapidAPI Lens Host is not configured.',
      };
    }
    console.log(`[Visual Matches Flow] Using Key (starts with: ${rapidApiKey.substring(0, Math.min(5, rapidApiKey.length))}) and Host: ${rapidApiHost}`);

    const { imageUrl, language, country } = input;
    const encodedImageUrl = encodeURIComponent(imageUrl);
    const apiEndpointUrl = `https://${rapidApiHost}/visual-matches?url=${encodedImageUrl}&language=${language}&country=${country}`;
    console.log(`[Visual Matches Flow] Target Endpoint URL: ${apiEndpointUrl}`);

    try {
      const response = await fetch(apiEndpointUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': rapidApiHost,
          'x-rapidapi-key': rapidApiKey,
        },
      });

      const responseText = await response.text();
      console.log(`[Visual Matches Flow] Received response from API with status: ${response.status} ${response.statusText}`);
      
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(`[Visual Matches Flow] Could not parse API response as JSON. Status: ${response.status}. Raw response (first 500 chars): ${responseText.substring(0, 500)}`);
        return {
            success: false,
            message: `API response was not valid JSON (status ${response.status}).`,
            error: `API response was not valid JSON. Raw: ${responseText.substring(0,100)}...`,
            rawResponse: responseText,
        };
      }

      if (!response.ok) {
        console.error(`[Visual Matches Flow] API returned error. Status: ${response.status}. Parsed/Raw response: ${JSON.stringify(responseData || responseText).substring(0, 500)}`);
        let errorMsg = `RapidAPI Error (${response.status} ${response.statusText})`;
        if (responseData && (responseData.message || responseData.error || responseData.reason || responseData.detail)) {
          errorMsg += ` - ${responseData.message || responseData.error || responseData.reason || responseData.detail}`;
        } else if (responseText.length > 0 && responseText.length < 300 && !responseText.toLowerCase().includes("html")) {
          errorMsg += ` - ${responseText}`;
        }
        return {
          success: false,
          message: errorMsg,
          error: errorMsg,
          rawResponse: responseData || responseText,
        };
      }
      
      // Attempt to map the response to VisualMatchSchema
      // This part is highly dependent on the actual API response structure.
      // Assuming responseData might be an array directly, or an object with a 'results', 'matches', or 'items' key.
      let potentialMatches: any[] = [];
      if (Array.isArray(responseData)) {
        potentialMatches = responseData;
      } else if (responseData.visual_matches && Array.isArray(responseData.visual_matches)) {
        potentialMatches = responseData.visual_matches;
      } else if (responseData.results && Array.isArray(responseData.results)) {
        potentialMatches = responseData.results;
      } else if (responseData.items && Array.isArray(responseData.items)) {
        potentialMatches = responseData.items;
      } else if (typeof responseData === 'object' && responseData !== null) {
        // Fallback for less structured responses, try to wrap the whole thing if it seems like a single item
        // or if it's an object of results, try to iterate its values if they are arrays.
        // This is speculative and needs adjustment based on actual API output.
        console.warn("[Visual Matches Flow] Response is an object, not an array of matches. Inspect rawResponse. Attempting to parse common patterns.");
        if(responseData.data && Array.isArray(responseData.data)) potentialMatches = responseData.data;
        // else potentialMatches.push(responseData); // If it's a single object, wrap it
      }
      
      const mappedMatches: VisualMatch[] = potentialMatches.map((item: any) => ({
        title: item.title,
        link: item.link || item.url || item.source_url,
        source: item.source || item.domain || item.displayed_link,
        thumbnailUrl: item.thumbnail || item.thumbnail_url || item.image_url,
        price: item.price?.value ? `${item.price.currency || ''}${item.price.value}` : (typeof item.price === 'string' ? item.price : undefined),
        raw: item, // Store the original item for debugging or further processing
      })).filter(match => match.link || match.title); // Ensure there's some useful data

      if (potentialMatches.length > 0 && mappedMatches.length === 0) {
        console.warn("[Visual Matches Flow] API returned data, but mapping to VisualMatchSchema failed for all items. Check rawResponse.");
        return {
          success: true, // API call was ok, but data mapping issue
          matches: [],
          message: "Data retrieved, but could not be mapped to standard format. See raw response.",
          rawResponse: responseData,
        };
      }
      
      return {
        success: true,
        matches: mappedMatches,
        message: responseData.message || (mappedMatches.length > 0 ? `${mappedMatches.length} visual matches found.` : "No visual matches found or API response structure not recognized."),
        rawResponse: responseData,
      };

    } catch (error) {
      console.error('[Visual Matches Flow] Exception during API call or response processing:', error);
      let errorMessage = 'An unexpected error occurred during Visual Matches search.';
      if (error instanceof Error) {
        errorMessage = `Visual Matches Search Exception: ${error.message}`;
      }
      return { success: false, error: errorMessage, message: errorMessage };
    }
  }
);
