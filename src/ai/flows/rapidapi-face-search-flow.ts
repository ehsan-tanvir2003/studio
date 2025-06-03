
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
  source: z.string().optional().nullable().describe('Source website or domain of the image (if provided).'),
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
    console.log('[RapidAPI Reverse Image Search Flow] Invoked.');

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
      const meta = parts[0]; 
      const base64Data = parts[1];
      
      const mimeTypeMatch = meta.match(/^data:(image\/[a-zA-Z+]+);base64$/);
      if (!mimeTypeMatch || !mimeTypeMatch[1]) {
         return { success: false, error: 'Invalid image MIME type in data URI.', message: 'Invalid image MIME type in data URI.' };
      }
      const mimeType = mimeTypeMatch[1];
      const fileExtension = mimeType.split('/')[1] || 'jpg';

      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      const formData = new FormData();
      const imageBlob = new Blob([imageBuffer], { type: mimeType });
      // Field name depends on the specific API. Common names: 'image_file', 'file', 'source', 'img'.
      // For face-recognition-api1.p.rapidapi.com/detect, it's often 'source'.
      formData.append('source', imageBlob, `upload.${fileExtension}`); 

      console.log(`[RapidAPI Flow] Sending POST request to ${apiEndpointUrl} with image of type ${mimeType}`);
      
      const response = await fetch(apiEndpointUrl, {
        method: 'POST', 
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': rapidApiHost,
        },
        body: formData, 
      });

      const responseText = await response.text();
      console.log(`[RapidAPI Flow] Received response from API with status: ${response.status} ${response.statusText}`);
      
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(`[RapidAPI Flow] Could not parse API response as JSON. Status: ${response.status}. Raw response (first 500 chars): ${responseText.substring(0, 500)}`);
        if (response.ok) { 
             return {
                success: false,
                message: `API response was not valid JSON, though status was ${response.status}.`,
                error: `API response was not valid JSON. Raw: ${responseText.substring(0,100)}...`,
                rawResponse: responseText,
            };
        }
      }

      if (!response.ok) {
        console.error(`[RapidAPI Flow] API returned error. Status: ${response.status}. Parsed/Raw response (first 500 chars): ${JSON.stringify(responseData || responseText).substring(0, 500)}`);
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
          rawResponse: responseData || responseText,
        };
      }
      
      // CUSTOMIZE RESPONSE PARSING FOR REVERSE IMAGE SEARCH
      // This will be highly dependent on the specific API used.
      // The face-recognition-api1.p.rapidapi.com/detect endpoint might return an array of detected faces/matches.
      let potentialMatches: any[] = [];
      if (Array.isArray(responseData)) { // If the root is an array
        potentialMatches = responseData;
      } else if (responseData.results && Array.isArray(responseData.results)) {
        potentialMatches = responseData.results;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        potentialMatches = responseData.data;
      } else if (responseData.matches && Array.isArray(responseData.matches)) {
        potentialMatches = responseData.matches;
      } else if (responseData.detections && Array.isArray(responseData.detections)) { // Specific to some face detection APIs
        potentialMatches = responseData.detections.map((det: any) => ({
          url: det.profile_url || det.image_url || `detection:${det.face_id || Math.random().toString(36).substring(7)}`, // Placeholder if no direct URL
          score: det.confidence || det.score,
          thumbnail: det.thumbnail_url || det.cropped_image_url || det.face_thumbnail, // Attempt multiple fields
          title: det.name || `Detected Face (ID: ${det.face_id || 'N/A'})`,
          source: 'face-recognition-api', // Example source
        }));
      } else if (typeof responseData === 'object' && responseData !== null) { // If it's a single object, wrap in array
        potentialMatches = [responseData];
      }


      const matches: RapidApiMatch[] = potentialMatches.map((item: any) => ({
        url: item.url || item.link || item.page_url || item.image_url || "https://example.com/no-url-found", // Default URL
        score: item.score || item.similarity || item.confidence, // Add confidence
        thumbnail: item.thumbnail || item.image_url || item.thumb_url || item.thumbnail_url || item.cropped_image_url || item.face_thumbnail,
        title: item.title || item.description || item.name,
        source: item.source || item.domain || rapidApiHost, // Use host as fallback source
      })).filter((match: RapidApiMatch) => match.url !== "https://example.com/no-url-found");

      return {
        success: true,
        matches: matches,
        message: responseData.message || (matches.length > 0 ? `${matches.length} matches found.` : "No matches found or API response structure not recognized as matches."),
        rawResponse: responseData,
      };

    } catch (error) {
      console.error('[RapidAPI Flow] Exception during API call or response processing:', error);
      let errorMessage = 'An unexpected error occurred during RapidAPI reverse image search.';
      if (error instanceof Error) {
        errorMessage = `RapidAPI Reverse Image Search Exception: ${error.message}`;
      }
      return { success: false, error: errorMessage, message: errorMessage };
    }
  }
);
