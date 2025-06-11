
'use server';
/**
 * @fileOverview Analyzes an image frame from a camera feed, focusing on facial details
 * and providing bounding boxes for detected faces.
 *
 * - analyzeCameraFrame - A function that takes an image data URI and returns facial analysis.
 * - AnalyzeCameraFrameInput - The input type for the analyzeCameraFrame function.
 * - AnalyzeCameraFrameOutput - The return type for the analyzeCameraFrame function.
 * - FaceAnalysis - Schema for details of a single detected face, including its bounding box.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeCameraFrameInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image frame captured from a camera, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeCameraFrameInput = z.infer<typeof AnalyzeCameraFrameInputSchema>;

const FaceAnalysisSchema = z.object({
  estimatedAgeRange: z.string().describe('Estimated age range of the person (e.g., 20-25, 40s, child, adult, senior).'),
  estimatedGender: z.string().describe('Estimated gender of the person (e.g., Male, Female, Unclear).'),
  observedMood: z.string().describe('Observed dominant mood or emotion (e.g., Happy, Sad, Neutral, Surprised, Angry, Focused).'),
  observedBehavior: z.string().describe('Observed behavior or action (e.g., Smiling, Looking at camera, Talking, Yawning, Looking away).'),
  boundingBox: z.object({
    x: z.number().min(0).max(1).describe('Normalized X coordinate of the top-left corner of the bounding box (0.0 to 1.0).'),
    y: z.number().min(0).max(1).describe('Normalized Y coordinate of the top-left corner of the bounding box (0.0 to 1.0).'),
    width: z.number().min(0).max(1).describe('Normalized width of the bounding box (0.0 to 1.0).'),
    height: z.number().min(0).max(1).describe('Normalized height of the bounding box (0.0 to 1.0).'),
  }).optional().describe('Bounding box of the detected face, with origin at the top-left. Provided if a face is clearly identifiable for boxing.')
});
export type FaceAnalysis = z.infer<typeof FaceAnalysisSchema>;

const AnalyzeCameraFrameOutputSchema = z.object({
  faces: z.array(FaceAnalysisSchema).describe("An array of analyses for each detected face. Empty if no faces are detected or analyzable."),
  detectionSummary: z.string().describe("A brief summary, e.g., 'Detected 2 faces.' or 'No clearly analyzable faces were detected.'"),
  error: z.string().optional().describe("Error message if the analysis failed.")
});
export type AnalyzeCameraFrameOutput = z.infer<typeof AnalyzeCameraFrameOutputSchema>;

export async function analyzeCameraFrame(input: AnalyzeCameraFrameInput): Promise<AnalyzeCameraFrameOutput> {
  return analyzeCameraFrameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCameraFramePrompt',
  input: { schema: AnalyzeCameraFrameInputSchema },
  output: { schema: AnalyzeCameraFrameOutputSchema.omit({ error: true }) }, // The prompt itself doesn't output an error field
  prompt: `You are an AI assistant specialized in analyzing human faces in images. Your task is to describe visible faces, but **do not attempt to identify or name individuals**. For each clearly visible face in the following image frame, provide:
1.  Estimated Age Range (e.g., 20-25, 40s, child, adult, senior).
2.  Estimated Gender (e.g., Male, Female, Unclear).
3.  Observed Dominant Mood/Emotion (e.g., Happy, Sad, Neutral, Surprised, Angry, Focused).
4.  Observed Behavior/Action (e.g., Smiling, Looking at the camera, Talking, Yawning, Looking away).
5.  A 'boundingBox' object containing 'x', 'y', 'width', and 'height' fields. These should be **normalized coordinates (ranging from 0.0 to 1.0)** relative to the image dimensions, where (x,y) represents the **top-left corner** of the bounding box. If a face cannot be clearly boxed, you may omit the boundingBox for that specific face.

If multiple faces are present, provide these details for each.
Your 'detectionSummary' should state how many faces were analyzed or if no clearly analyzable faces were detected.
The 'faces' array should contain an object for each analyzed face. If no faces are detected, the 'faces' array should be empty.

Image Frame:
{{media url=imageDataUri}}`,
});

const analyzeCameraFrameFlow = ai.defineFlow(
  {
    name: 'analyzeCameraFrameFlow',
    inputSchema: AnalyzeCameraFrameInputSchema,
    outputSchema: AnalyzeCameraFrameOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        return { 
          faces: [],
          detectionSummary: "The AI could not provide an analysis for this frame.",
          error: "AI model returned no output."
        };
      }
      // Ensure faces is an array even if the LLM fails to provide it as one sometimes
      if (!Array.isArray(output.faces)) {
          output.faces = [];
      }
      return output;
    } catch (err) {
      console.error('[analyzeCameraFrameFlow] Error during prompt execution:', err);
      let errorMessage = "An unexpected error occurred during AI frame analysis.";
      if (err instanceof Error) {
        errorMessage = `AI analysis failed: ${err.message}`;
      }
      // Check if error message indicates an API key issue for Google AI
      if (typeof err === 'string' && (err.toLowerCase().includes('api key not valid') || err.toLowerCase().includes('permission denied'))) {
        errorMessage = `AI analysis failed: Invalid or missing GEMINI_API_KEY. Please check server configuration. Original error: ${err}`;
      } else if (err instanceof Error && (err.message.toLowerCase().includes('api key not valid') || err.message.toLowerCase().includes('permission denied'))) {
        errorMessage = `AI analysis failed: Invalid or missing GEMINI_API_KEY. Please check server configuration. Original error: ${err.message}`;
      }
      
      return {
        faces: [],
        detectionSummary: "Analysis could not be completed due to an error.",
        error: errorMessage
      };
    }
  }
);

    