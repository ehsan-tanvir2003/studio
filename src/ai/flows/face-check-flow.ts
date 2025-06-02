
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
      };
    }
    console.log(`[FaceCheck Flow] FACECHECK_API_KEY found.`);

    try {
      const { imageDataUri } = input;
      const parts = imageDataUri.split(',');
      if (parts.length !== 2) {
        return { success: false, error: 'Invalid image data URI format.' };
      }
      const meta = parts[0]; // "data:image/jpeg;base64"
      const base64Data = parts[1];
      
      const mimeType = meta.split(';')[0].split(':')[1];
      if (!mimeType || !mimeType.startsWith('image/')) {
         return { success: false, error: 'Invalid image MIME type in data URI.' };
      }
      const fileExtension = mimeType.split('/')[1] || 'jpg';


      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      const formData = new FormData();
      // Create a Blob from the Buffer
      const imageBlob = new Blob([imageBuffer], { type: mimeType });
      formData.append('image_file', imageBlob, `upload.${fileExtension}`);
      // formData.append('id_search_custom', 'your_custom_id_here'); // Optional: if you want to add custom ID

      console.log(`[FaceCheck Flow] Sending POST request to FaceCheck.ID API with image of type ${mimeType}`);
      const FACECHECK_API_URL = 'https://api.facecheck.id/v1/upload/image_file';
      
      const response = await fetch(FACECHECK_API_URL, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          // 'Content-Type': 'multipart/form-data' is set automatically by fetch with FormData
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log(`[FaceCheck Flow] Received response from FaceCheck.ID API with status: ${response.status} ${response.statusText}`);
      
      const responseData = JSON.parse(responseText);

      if (!response.ok) {
        console.error('[FaceCheck Flow] Error response details:', responseData);
        return {
          success: false,
          message: responseData.message || `FaceCheck.ID API Error (${response.status}): ${response.statusText}`,
          error: `FaceCheck.ID API Error (${response.status}): ${response.statusText} - ${responseData.message || 'No specific error message.'}`,
        };
      }
      
      // Assuming responseData matches FaceCheckOutputSchema structure on success
      return {
        success: responseData.success,
        id_search: responseData.id_search,
        items_count: responseData.items_count,
        items: responseData.items,
        message: responseData.message,
      };

    } catch (error) {
      console.error('[FaceCheck Flow] Exception during API call:', error);
      let errorMessage = 'An unexpected error occurred during FaceCheck.ID search.';
      if (error instanceof Error) {
        errorMessage = `FaceCheck.ID Search Exception: ${error.message}`;
      }
      return { success: false, error: errorMessage };
    }
  }
);
