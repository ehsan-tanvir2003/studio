
'use server';
/**
 * @fileOverview Interacts with a generic RapidAPI endpoint for reverse image search.
 *
 * - searchImageWithRapidApi - A function that uploads an image and gets search results.
 * - RapidApiImageSearchInput - The input type for the function.
 * - RapidApiMatch - Represents a single match found.
 * - RapidApiImageSearchOutput - The return type for the function.
 *
 * IMPORTANT: This flow is a generic template. You MUST customize the `fetch` call
 * (body, headers, method) and the response parsing (`responseData.results...`)
 * to match the specific RapidAPI endpoint you choose for reverse image search.
 * Consult the API's documentation on RapidAPI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Buffer } from 'buffer';

const RapidApiImageSearchInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  apiEndpointUrl: z.string().url().describe("The full URL for the RapidAPI reverse image search endpoint."),
});
export type RapidApiImageSearchInput = z.infer<typeof RapidApiImageSearchInputSchema>;

const RapidApiMatchSchema = z.object({
  url: z.string().url().describe('URL of the found profile or image.'),
  score: z.number().optional().nullable().describe('Confidence score of the match (if provided by API).'),
  thumbnail: z.string().url().optional().nullable().describe('URL of the thumbnail for the match (if provided).'),
  title: z.string().optional().nullable().describe('Title or description of the match (if provided).'),
  // Add other fields that your chosen RapidAPI endpoint might return
});
export type RapidApiMatch = z.infer<typeof RapidApiMatchSchema>;

const RapidApiImageSearchOutputSchema = z.object({
  success: z.boolean().describe('Whether the API call was successful based on HTTP status.'),
  matches: z.array(RapidApiMatchSchema).optional().nullable().describe('Array of matching items.'),
  message: z.string().optional().nullable().describe('A message from the API, or an error message if success is false.'),
  error: z.string().optional().describe('Internal error message if the flow failed.'),
  rawResponse: z.any().optional().describe('The raw response from the API for debugging if needed.')
});
export type RapidApiImageSearchOutput = z.infer<typeof RapidApiImageSearchOutputSchema>;

export async function searchImageWithRapidApi(input: RapidApiImageSearchInput): Promise<RapidApiImageSearchOutput> {
  return rapidApiImageSearchFlow(input);
}

const rapidApiImageSearchFlow = ai.defineFlow(
  {
    name: 'rapidApiImageSearchFlow',
    inputSchema: RapidApiImageSearchInputSchema,
    outputSchema: RapidApiImageSearchOutputSchema,
  },
  async (input) => {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST;
    console.log('[RapidAPI Flow] Invoked.');

    if (!rapidApiKey || rapidApiKey.trim() === "" || !rapidApiHost || rapidApiHost.trim() === "") {
      console.error('[RapidAPI Flow] CRITICAL: RAPIDAPI_KEY or RAPIDAPI_HOST is not configured.');
      return {
        success: false,
        error: 'RapidAPI Key or Host is not configured. Please check server configuration.',
        message: 'RapidAPI Key or Host is not configured. Please check server configuration.',
      };
    }
    console.log(`[RapidAPI Flow] Using Key (starts with: ${rapidApiKey.substring(0, Math.min(5, rapidApiKey.length))}) and Host: ${rapidApiHost}`);
    console.log(`[RapidAPI Flow] Target Endpoint URL: ${input.apiEndpointUrl}`);

    try {
      const { imageDataUri, apiEndpointUrl } = input;
      const parts = imageDataUri.split(',');
      if (parts.length !== 2) {
        return { success: false, error: 'Invalid image data URI format.', message: 'Invalid image data URI format.' };
      }
      const meta = parts[0]; // "data:image/jpeg;base64"
      const base64Data = parts[1];
      
      const mimeTypeMatch = meta.match(/^data:(image\/[a-zA-Z+]+);base64$/);
      if (!mimeTypeMatch || !mimeTypeMatch[1]) {
         return { success: false, error: 'Invalid image MIME type in data URI.', message: 'Invalid image MIME type in data URI.' };
      }
      const mimeType = mimeTypeMatch[1];
      const fileExtension = mimeType.split('/')[1] || 'jpg';

      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // --- IMPORTANT: CUSTOMIZE REQUEST PAYLOAD AND METHOD BELOW ---
      // This is a common way: sending as form-data.
      // Your chosen API might require something different (e.g., JSON payload with base64 string, different field name).
      // Consult the API's documentation on RapidAPI.
      const formData = new FormData();
      const imageBlob = new Blob([imageBuffer], { type: mimeType });
      formData.append('image_file', imageBlob, `upload.${fileExtension}`); // 'image_file' is a common field name. CHANGE IF NEEDED.

      console.log(`[RapidAPI Flow] Sending POST request to ${apiEndpointUrl} with image of type ${mimeType}`);
      
      const response = await fetch(apiEndpointUrl, {
        method: 'POST', // Or 'GET' if the API uses query params for image URL/data. CHANGE IF NEEDED.
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': rapidApiHost,
          // 'Content-Type': 'multipart/form-data' // Usually set automatically by fetch with FormData.
                                                 // Add if your API specifically requires it, or if sending JSON: 'application/json'
        },
        body: formData, // Or JSON.stringify({ image: base64Data }) etc. CHANGE IF NEEDED.
      });

      const responseText = await response.text();
      console.log(`[RapidAPI Flow] Received response from API with status: ${response.status} ${response.statusText}`);
      
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(`[RapidAPI Flow] Could not parse API response as JSON. Status: ${response.status}. Raw response (first 500 chars): ${responseText.substring(0, 500)}`);
        if (response.ok) { // If status was 2xx but not JSON, it's a problem with the API or our expectation
             return {
                success: false, // Treat as unsuccessful if we expect JSON but don't get it
                message: `API response was not valid JSON, though status was ${response.status}.`,
                error: `API response was not valid JSON. Raw: ${responseText.substring(0,100)}...`,
                rawResponse: responseText,
            };
        }
        // If not OK and not JSON, the original error handling for non-OK responses will catch it.
      }


      if (!response.ok) {
        console.error(`[RapidAPI Flow] API returned error. Status: ${response.status}. Parsed/Raw response (first 500 chars): ${JSON.stringify(responseData || responseText).substring(0, 500)}`);
        let errorMsg = `RapidAPI Error (${response.status} ${response.statusText})`;
        if (responseData && (responseData.message || responseData.error)) {
          errorMsg += ` - ${responseData.message || responseData.error}`;
        } else if (responseText.length > 0 && responseText.length < 300) {
          errorMsg += ` - ${responseText}`;
        }
        return {
          success: false,
          message: errorMsg,
          error: errorMsg,
          rawResponse: responseData || responseText,
        };
      }
      
      // --- IMPORTANT: CUSTOMIZE RESPONSE PARSING BELOW ---
      // Adapt this to the actual structure of your chosen API's success response.
      // The example below tries to find results in common places like 'results', 'data', or 'matches' arrays.
      const matches: RapidApiMatch[] = (responseData.results || responseData.data || responseData.matches || []).map((item: any) => ({
        url: item.url || item.link || item.page_url,
        score: item.score,
        thumbnail: item.thumbnail || item.image_url || item.thumb_url,
        title: item.title || item.description || item.name,
        // Map other fields from 'item' to 'RapidApiMatchSchema' fields
      })).filter((match: RapidApiMatch) => match.url); // Ensure basic validity

      return {
        success: true,
        matches: matches,
        message: responseData.message || (matches.length > 0 ? `${matches.length} matches found.` : "No matches found."),
        rawResponse: responseData,
      };

    } catch (error) {
      console.error('[RapidAPI Flow] Exception during API call or response processing:', error);
      let errorMessage = 'An unexpected error occurred during RapidAPI search.';
      if (error instanceof Error) {
        errorMessage = `RapidAPI Search Exception: ${error.message}`;
        if ((error as any).cause) {
          const cause = (error as any).cause;
          console.error('[RapidAPI Flow] Fetch error cause:', cause);
          try {
            errorMessage += ` Cause: ${JSON.stringify(cause)}`;
          } catch (stringifyError) {
            errorMessage += ` Cause: (Could not stringify - ${cause.toString()})`;
          }
        }
      }
      return { success: false, error: errorMessage, message: errorMessage };
    }
  }
);
