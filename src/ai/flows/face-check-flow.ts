
'use server';
/**
 * @fileOverview Interacts with the FaceCheck.ID API to perform reverse face image searches.
 *
 * - searchFaceWithFaceCheck - A function that uploads an image and gets search results.
 * - FaceCheckInput - The input type for the searchFaceWithFaceCheck function.
 * - FaceCheckMatch - Represents a single match found by FaceCheck.ID.
 * - FaceCheckOutput - The return type for the searchFaceWithFaceCheck function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Buffer } from 'buffer'; // For Node.js environment

const FaceCheckInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image of a face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type FaceCheckInput = z.infer<typeof FaceCheckInputSchema>;

const FaceCheckMatchSchema = z.object({
  url: z.string().url().describe('URL of the found profile or image.'),
  score: z.number().describe('Confidence score of the match (0-100).'),
  thumbnail: z.string().url().nullable().describe('URL of the thumbnail for the match.'),
});
export type FaceCheckMatch = z.infer<typeof FaceCheckMatchSchema>;

const FaceCheckOutputSchema = z.object({
  success: z.boolean().describe('Whether the API call was successful.'),
  id_search: z.string().optional().nullable().describe('The search ID provided by FaceCheck.ID.'),
  items_count: z.number().optional().nullable().describe('Number of items found.'),
  items: z.array(FaceCheckMatchSchema).optional().nullable().describe('Array of matching items.'),
  message: z.string().optional().nullable().describe('A message from the API, usually an error message if success is false.'),
  error: z.string().optional().describe('Internal error message if the flow failed before/after API call.')
});
export type FaceCheckOutput = z.infer<typeof FaceCheckOutputSchema>;


export async function searchFaceWithFaceCheck(input: FaceCheckInput): Promise<FaceCheckOutput> {
  return faceCheckFlow(input);
}

const faceCheckFlow = ai.defineFlow(
  {
    name: 'faceCheckFlow',
    inputSchema: FaceCheckInputSchema,
    outputSchema: FaceCheckOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.FACECHECK_API_KEY;
    console.log('[FaceCheck Flow] Invoked.');

    if (!apiKey || apiKey === "YOUR_FACECHECK_API_KEY_HERE" || apiKey.trim() === "") {
      console.error('[FaceCheck Flow] CRITICAL: FACECHECK_API_KEY is not configured or is a placeholder.');
      return {
        success: false,
        error: 'FaceCheck.ID API Key is not configured. Please check server configuration.',
        message: 'FaceCheck.ID API Key is not configured. Please check server configuration.',
      };
    }
    console.log(`[FaceCheck Flow] FACECHECK_API_KEY found (starts with: ${apiKey.substring(0, Math.min(5, apiKey.length))}).`);

    try {
      const { imageDataUri } = input;
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
      
      const formData = new FormData();
      const imageBlob = new Blob([imageBuffer], { type: mimeType });
      formData.append('image_file', imageBlob, `upload.${fileExtension}`);

      const FACECHECK_API_URL = 'https://api.facecheck.id/v1/upload/image_file';
      console.log(`[FaceCheck Flow] Sending POST request to ${FACECHECK_API_URL} with image of type ${mimeType}`);
      
      const response = await fetch(FACECHECK_API_URL, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          // 'Content-Type': 'multipart/form-data' // Typically set automatically by fetch with FormData
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log(`[FaceCheck Flow] Received response from FaceCheck.ID API with status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.error(`[FaceCheck Flow] API returned error. Status: ${response.status}. Raw response (first 500 chars): ${responseText.substring(0, 500)}`);
        let errorMsg = `FaceCheck.ID API Error (${response.status} ${response.statusText})`;
        try {
          const errorJson = JSON.parse(responseText);
          if (errorJson && errorJson.message) {
            errorMsg += ` - ${errorJson.message}`;
          } else if (typeof errorJson === 'string') {
             errorMsg += ` - ${errorJson}`;
          }
        } catch (e) {
          // Response was not JSON or JSON was malformed
          if(responseText.length > 0 && responseText.length < 300) { // If response text is short, include it
            errorMsg += ` - ${responseText}`;
          } else if (responseText.length === 0) {
            errorMsg += ` - Empty error response from API.`;
          }
        }
        return {
          success: false,
          message: errorMsg,
          error: errorMsg, 
        };
      }
      
      // If response.ok, now parse for successful data
      const responseData = JSON.parse(responseText); // This might still throw if success response is not valid JSON
      
      return {
        success: responseData.success !== undefined ? responseData.success : true, // Assume true if success field is missing but status was 2xx
        id_search: responseData.id_search,
        items_count: responseData.items_count,
        items: responseData.items,
        message: responseData.message,
      };

    } catch (error) {
      console.error('[FaceCheck Flow] Exception during API call or response processing:', error);
      let errorMessage = 'An unexpected error occurred during FaceCheck.ID search.';
      if (error instanceof Error) {
        errorMessage = `FaceCheck.ID Search Exception: ${error.message}`;
        // Log additional properties if they exist, especially 'cause' for fetch errors
        if ((error as any).cause) {
          const cause = (error as any).cause;
          console.error('[FaceCheck Flow] Fetch error cause:', cause);
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
