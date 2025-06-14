
'use server';
/**
 * @fileOverview Interacts with a RapidAPI endpoint for reverse image search via direct image upload.
 *
 * - searchWithImageData - A function that uploads an image and gets search results.
 * - DirectImageSearchInput - The input type for the function.
 * - DirectVisualMatch - Represents a single match found.
 * - DirectImageSearchOutput - The return type for the function.
 *
 * IMPORTANT: This flow requires RAPIDAPI_KEY, RAPIDAPI_DIRECT_IMAGE_UPLOAD_HOST,
 * and RAPIDAPI_DIRECT_IMAGE_UPLOAD_ENDPOINT_PATH to be set in the .env file.
 * You may also need to customize the FormData field name for the image (default: 'image_file')
 * and the response parsing to match the specific RapidAPI endpoint you choose.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Buffer } from 'buffer';

const DirectImageSearchInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DirectImageSearchInput = z.infer<typeof DirectImageSearchInputSchema>;

// Schema similar to VisualMatch from the old visual-matches-flow.ts for compatibility
const DirectVisualMatchSchema = z.object({
  title: z.string().optional().nullable().describe('Title of the matched item.'),
  link: z.string().url().optional().nullable().describe('Direct link to the item or page (often the source URL of the image or product page).'), // 'url' from RapidApiMatch maps to 'link'
  source: z.string().optional().nullable().describe('The source website or domain (e.g., eBay.com).'),
  thumbnailUrl: z.string().url().optional().nullable().describe('URL of a thumbnail for the match.'), // 'thumbnail' from RapidApiMatch maps to 'thumbnailUrl'
  price: z.string().optional().nullable().describe('Price information, if available (often a string like "$19.99").'), // Added if API provides it
  score: z.number().optional().nullable().describe('Confidence score of the match (if provided by API).'), // Added from RapidApiMatch
  raw: z.any().optional().nullable().describe('Original raw data for this match item for inspection.')
});
export type DirectVisualMatch = z.infer<typeof DirectVisualMatchSchema>;

// Schema similar to VisualMatchesOutput for compatibility
const DirectImageSearchOutputSchema = z.object({
  success: z.boolean().describe('Whether the API call was successful based on HTTP status.'),
  matches: z.array(DirectVisualMatchSchema).optional().nullable().describe('Array of matching items.'),
  message: z.string().optional().nullable().describe('A message from the API, or an error message if success is false.'),
  error: z.string().optional().describe('Internal error message if the flow failed.'),
  rawResponse: z.any().optional().describe('The raw response from the API for debugging if needed.')
});
export type DirectImageSearchOutput = z.infer<typeof DirectImageSearchOutputSchema>;

export async function searchWithImageData(input: DirectImageSearchInput): Promise<DirectImageSearchOutput> {
  return directImageSearchFlow(input);
}

const directImageSearchFlow = ai.defineFlow(
  {
    name: 'directImageSearchFlow',
    inputSchema: DirectImageSearchInputSchema,
    outputSchema: DirectImageSearchOutputSchema,
  },
  async (input) => {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_DIRECT_IMAGE_UPLOAD_HOST;
    const rapidApiEndpointPath = process.env.RAPIDAPI_DIRECT_IMAGE_UPLOAD_ENDPOINT_PATH;

    console.log('[Direct Image Search Flow] Invoked.');
    console.log(`[Direct Image Search Flow] Attempting to use RAPIDAPI_KEY (starts with): ${rapidApiKey ? rapidApiKey.substring(0, Math.min(5, rapidApiKey.length)) : 'NOT SET'}`);
    console.log(`[Direct Image Search Flow] Attempting to use RAPIDAPI_DIRECT_IMAGE_UPLOAD_HOST: ${rapidApiHost || 'NOT SET'}`);
    console.log(`[Direct Image Search Flow] Attempting to use RAPIDAPI_DIRECT_IMAGE_UPLOAD_ENDPOINT_PATH: ${rapidApiEndpointPath || 'NOT SET'}`);


    if (!rapidApiKey || rapidApiKey.trim() === "") {
      console.error('[Direct Image Search Flow] CRITICAL: RAPIDAPI_KEY is not configured.');
      return { success: false, error: 'RAPIDAPI_KEY is not configured.', message: 'Server configuration error: API Key missing.' };
    }
    if (!rapidApiHost || rapidApiHost.trim() === "") {
      console.error('[Direct Image Search Flow] CRITICAL: RAPIDAPI_DIRECT_IMAGE_UPLOAD_HOST is not configured.');
      return { success: false, error: 'RAPIDAPI_DIRECT_IMAGE_UPLOAD_HOST is not configured.', message: 'Server configuration error: API Host missing.' };
    }
    if (!rapidApiEndpointPath || rapidApiEndpointPath.trim() === "") {
      console.error('[Direct Image Search Flow] CRITICAL: RAPIDAPI_DIRECT_IMAGE_UPLOAD_ENDPOINT_PATH is not configured.');
      return { success: false, error: 'RAPIDAPI_DIRECT_IMAGE_UPLOAD_ENDPOINT_PATH is not configured.', message: 'Server configuration error: API Path missing.' };
    }

    const apiEndpointUrl = `https://${rapidApiHost}${rapidApiEndpointPath.startsWith('/') ? '' : '/'}${rapidApiEndpointPath}`;
    
    console.log(`[Direct Image Search Flow] Constructed Target API Endpoint URL: ${apiEndpointUrl}`);

    try {
      const { imageDataUri } = input;
      const parts = imageDataUri.split(',');
      if (parts.length !== 2) {
        return { success: false, error: 'Invalid image data URI format.', message: 'Invalid image data URI format.' };
      }
      const meta = parts[0]; 
      const base64Data = parts[1];
      
      const mimeTypeMatch = meta.match(/^data:(image\/[a-zA-Z+]+);base64$/);
      if (!mimeTypeMatch || !mimeTypeMatch[1]) {
         return { success: false, error: 'Invalid image MIME type in data URI.', message: 'Invalid image MIME type in data URI.' };
      }
      const mimeType = mimeTypeMatch[1];
      const fileExtension = mimeType.split('/')[1] || 'jpg'; // Default to jpg if not specified

      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      const formData = new FormData();
      const imageBlob = new Blob([imageBuffer], { type: mimeType });
      // IMPORTANT: Customize this field name ('image_file') if your chosen RapidAPI service expects a different one.
      formData.append('image_file', imageBlob, `upload.${fileExtension}`); 

      console.log(`[Direct Image Search Flow] Sending POST request to ${apiEndpointUrl} with image of type ${mimeType}`);
      
      const response = await fetch(apiEndpointUrl, {
        method: 'POST', 
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': rapidApiHost,
          // 'Content-Type': 'multipart/form-data' is usually set automatically by fetch with FormData
        },
        body: formData, 
      });

      const responseText = await response.text();
      console.log(`[Direct Image Search Flow] Received response from API with status: ${response.status} ${response.statusText}`);
      
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(`[Direct Image Search Flow] Could not parse API response as JSON. Status: ${response.status}. Raw response (first 500 chars): ${responseText.substring(0, 500)}`);
        if (response.ok) { 
             return {
                success: false, // Set to false because we couldn't parse expected JSON
                matches: null,
                message: `API response was not valid JSON, though status was ${response.status}.`,
                error: `API response was not valid JSON. Raw: ${responseText.substring(0,100)}...`,
                rawResponse: responseText,
            };
        }
        // If not response.ok and JSON parse fails, the !response.ok block below will handle it.
      }

      if (!response.ok) {
        console.error(`[Direct Image Search Flow] API returned error. Status: ${response.status}. Parsed/Raw response (first 500 chars): ${JSON.stringify(responseData || responseText).substring(0, 500)}`);
        let errorMsg = `RapidAPI Error (${response.status} ${response.statusText})`;
        if (responseData && (responseData.message || responseData.error || responseData.detail || responseData.reason)) {
          errorMsg += ` - ${responseData.message || responseData.error || responseData.detail || responseData.reason}`;
        } else if (responseText.length > 0 && responseText.length < 300 && !responseText.toLowerCase().includes("html")) {
          // Add raw response text if it's short and not HTML
          errorMsg += ` - ${responseText}`;
        }
        // Specific check for 404
        if (response.status === 404) {
          errorMsg += ` - API endpoint not found. Please verify RAPIDAPI_DIRECT_IMAGE_UPLOAD_HOST ('${rapidApiHost}') and RAPIDAPI_DIRECT_IMAGE_UPLOAD_ENDPOINT_PATH ('${rapidApiEndpointPath}') in your .env file. The constructed URL was: ${apiEndpointUrl}`;
        }

        return {
          success: false,
          matches: null,
          message: errorMsg,
          error: errorMsg,
          rawResponse: responseData || responseText,
        };
      }
      
      // CUSTOMIZE RESPONSE PARSING FOR YOUR CHOSEN REVERSE IMAGE SEARCH API
      // This part is highly dependent on the specific API used.
      // Assuming it returns an array of matches directly or within a 'results', 'matches', or 'items' key.
      let potentialMatches: any[] = [];
      if (Array.isArray(responseData)) {
        potentialMatches = responseData;
      } else if (responseData.results && Array.isArray(responseData.results)) {
        potentialMatches = responseData.results;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        potentialMatches = responseData.data;
      } else if (responseData.matches && Array.isArray(responseData.matches)) {
        potentialMatches = responseData.matches;
      } else if (responseData.visual_matches && Array.isArray(responseData.visual_matches)) { // from old lens api
        potentialMatches = responseData.visual_matches;
      }
      // Add other common patterns if needed

      // Map API response fields to DirectVisualMatchSchema
      const matches: DirectVisualMatch[] = potentialMatches.map((item: any) => ({
        title: item.title || item.name || item.description,
        link: item.url || item.link || item.page_url || item.source_url || item.image_url, // 'url' for image, 'link' for page
        source: item.source || item.domain || item.site_name || item.displayed_link,
        thumbnailUrl: item.thumbnail || item.thumbnail_url || item.image_thumbnail || item.thumb_url, // various possible thumbnail fields
        price: item.price?.value ? `${item.price.currency || ''}${item.price.value}` : (typeof item.price === 'string' ? item.price : undefined),
        score: item.score || item.similarity,
        raw: item, // Store original item
      })).filter((match: DirectVisualMatch) => match.link || match.title); // Ensure there's some useful data

      if (potentialMatches.length > 0 && matches.length === 0 && response.ok) {
        console.warn("[Direct Image Search Flow] API returned data, but mapping to DirectVisualMatchSchema failed for all items. Check rawResponse.");
        return {
          success: true, // API call was ok, but data mapping issue
          matches: [],
          message: "Data retrieved, but could not be mapped to standard format. See raw response.",
          rawResponse: responseData,
        };
      }
      
      return {
        success: true,
        matches: matches,
        message: responseData.message || (matches.length > 0 ? `${matches.length} matches found.` : "No matches found or API response structure not recognized."),
        rawResponse: responseData,
      };

    } catch (error) {
      console.error('[Direct Image Search Flow] Exception during API call or response processing:', error);
      let errorMessage = 'An unexpected error occurred during direct image search.';
      if (error instanceof Error) {
        errorMessage = `Direct Image Search Exception: ${error.message}`;
      }
      return { success: false, matches: null, error: errorMessage, message: errorMessage };
    }
  }
);
    
