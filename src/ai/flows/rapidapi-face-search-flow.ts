
'use server';
/**
 * @fileOverview Interacts with a RapidAPI reverse image search API.
 *
 * - searchImageWithRapidApi - A function that uploads an image and gets search results.
 * - RapidApiImageSearchInput - The input type for the searchImageWithRapidApi function.
 * - RapidApiMatch - Represents a single match found by the API.
 * - RapidApiImageSearchOutput - The return type for the searchImageWithRapidApi function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Buffer } from 'buffer'; // For Node.js environment

const RapidApiImageSearchInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  apiEndpointUrl: z.string().url().describe('The specific RapidAPI endpoint URL for the reverse image search.'),
});
export type RapidApiImageSearchInput = z.infer<typeof RapidApiImageSearchInputSchema>;

const RapidApiMatchSchema = z.object({
  url: z.string().url().describe('URL of the found image or page.'),
  score: z.number().optional().nullable().describe('Confidence score of the match (if provided by API).'),
  title: z.string().optional().nullable().describe('Title or description of the match (if provided).'),
  thumbnail: z.string().url().optional().nullable().describe('URL of the thumbnail for the match (if provided).'),
});
export type RapidApiMatch = z.infer<typeof RapidApiMatchSchema>;

const RapidApiImageSearchOutputSchema = z.object({
  success: z.boolean().describe('Whether the API call was successful.'),
  matches: z.array(RapidApiMatchSchema).optional().nullable().describe('Array of matching items.'),
  message: z.string().optional().nullable().describe('A message from the API, usually an error message if success is false.'),
  error: z.string().optional().describe('Internal error message if the flow failed before/after API call.')
});
export type RapidApiImageSearchOutput = z.infer<typeof RapidApiImageSearchOutputSchema>;


export async function searchImageWithRapidApi(input: RapidApiImageSearchInput): Promise<RapidApiImageSearchOutput> {
  return rapidApiFaceSearchFlow(input);
}

const rapidApiFaceSearchFlow = ai.defineFlow(
  {
    name: 'rapidApiFaceSearchFlow',
    inputSchema: RapidApiImageSearchInputSchema,
    outputSchema: RapidApiImageSearchOutputSchema,
  },
  async (input) => {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST;
    
    console.log('[RapidAPI Flow] Invoked.');

    if (!rapidApiKey || rapidApiKey.trim() === "") {
      console.error('[RapidAPI Flow] CRITICAL: RAPIDAPI_KEY is not configured.');
      return {
        success: false,
        error: 'RapidAPI Key is not configured. Please check server configuration (.env file).',
      };
    }
    if (!rapidApiHost || rapidApiHost.trim() === "") {
      console.error('[RapidAPI Flow] CRITICAL: RAPIDAPI_HOST is not configured.');
      return {
        success: false,
        error: 'RapidAPI Host is not configured. Please check server configuration (.env file).',
      };
    }
     if (!input.apiEndpointUrl || input.apiEndpointUrl.trim() === "") {
      console.error('[RapidAPI Flow] CRITICAL: RapidAPI Endpoint URL is not provided in input.');
      return {
        success: false,
        error: 'RapidAPI Endpoint URL is missing. This needs to be configured by the developer based on the chosen API.',
      };
    }

    console.log(`[RapidAPI Flow] RAPIDAPI_KEY and RAPIDAPI_HOST found.`);

    try {
      const { imageDataUri, apiEndpointUrl } = input;
      const parts = imageDataUri.split(',');
      if (parts.length !== 2) {
        return { success: false, error: 'Invalid image data URI format.' };
      }
      const meta = parts[0]; 
      const base64Data = parts[1];
      
      const mimeType = meta.split(';')[0].split(':')[1];
      if (!mimeType || !mimeType.startsWith('image/')) {
         return { success: false, error: 'Invalid image MIME type in data URI.' };
      }

      // IMPORTANT: The way you send the image data (e.g., form-data, JSON with base64)
      // depends heavily on the specific RapidAPI endpoint you choose.
      // This is a generic example assuming the API might take a base64 string in a JSON payload.
      // You WILL LIKELY NEED TO MODIFY THIS SECTION.
      
      // Example: Sending as JSON with base64 data
      // const requestBody = JSON.stringify({ image_base64: base64Data });
      // const headers = {
      //   'content-type': 'application/json',
      //   'X-RapidAPI-Key': rapidApiKey,
      //   'X-RapidAPI-Host': rapidApiHost,
      // };

      // Example: Sending as form-data (if API expects file upload)
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const imageBlob = new Blob([imageBuffer], { type: mimeType });
      const formData = new FormData();
      formData.append('image_file', imageBlob, `upload.${mimeType.split('/')[1] || 'jpg'}`); // 'image_file' is a common field name

      console.log(`[RapidAPI Flow] Sending POST request to RapidAPI endpoint: ${apiEndpointUrl} with image of type ${mimeType}`);
      
      const response = await fetch(apiEndpointUrl, { // Use the dynamic URL from input
        method: 'POST',
        headers: {
          // 'Content-Type' is often set automatically by fetch with FormData
          // If sending JSON, you'd uncomment the 'content-type': 'application/json' above.
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': rapidApiHost,
        },
        body: formData, // or requestBody if sending JSON
      });

      const responseText = await response.text();
      console.log(`[RapidAPI Flow] Received response from RapidAPI endpoint with status: ${response.status} ${response.statusText}`);
      
      const responseData = JSON.parse(responseText);

      if (!response.ok) {
        console.error('[RapidAPI Flow] Error response details:', responseData);
        return {
          success: false,
          message: responseData.message || `RapidAPI Error (${response.status}): ${response.statusText}`,
          error: `RapidAPI Error (${response.status}): ${response.statusText} - ${responseData.message || 'No specific error message.'}`,
        };
      }
      
      // IMPORTANT: The structure of responseData.matches (or equivalent)
      // is highly dependent on the specific RapidAPI endpoint.
      // This is a generic mapping. You WILL LIKELY NEED TO MODIFY THIS.
      const matches: RapidApiMatch[] = (responseData.results || responseData.data || responseData.matches || []).map((item: any) => ({
        url: item.url || item.link || item.page_url,
        score: typeof item.score === 'number' ? item.score : (typeof item.confidence === 'number' ? item.confidence : null),
        title: item.title || item.description || item.name,
        thumbnail: item.thumbnail_url || item.thumbnail || item.image_thumbnail,
      }));

      return {
        success: true,
        matches: matches,
        message: responseData.message || "Search completed successfully.",
      };

    } catch (error) {
      console.error('[RapidAPI Flow] Exception during API call:', error);
      let errorMessage = 'An unexpected error occurred during RapidAPI image search.';
      if (error instanceof Error) {
        errorMessage = `RapidAPI Search Exception: ${error.message}`;
      }
      return { success: false, error: errorMessage };
    }
  }
);
