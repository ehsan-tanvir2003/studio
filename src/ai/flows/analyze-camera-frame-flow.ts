
'use server';
/**
 * @fileOverview Analyzes an image frame from a camera feed, focusing on facial details.
 *
 * - analyzeCameraFrame - A function that takes an image data URI and returns facial analysis.
 * - AnalyzeCameraFrameInput - The input type for the analyzeCameraFrame function.
 * - AnalyzeCameraFrameOutput - The return type for the analyzeCameraFrame function.
 * - FaceAnalysis - Schema for details of a single detected face.
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
});
export type FaceAnalysis = z.infer<typeof FaceAnalysisSchema>;

const AnalyzeCameraFrameOutputSchema = z.object({
  faces: z.array(FaceAnalysisSchema).describe("An array of analyses for each detected face. Empty if no faces are detected or analyzable."),
  detectionSummary: z.string().describe("A brief summary, e.g., 'Detected 2 faces.' or 'No clearly analyzable faces were detected.'")
});
export type AnalyzeCameraFrameOutput = z.infer<typeof AnalyzeCameraFrameOutputSchema>;

export async function analyzeCameraFrame(input: AnalyzeCameraFrameInput): Promise<AnalyzeCameraFrameOutput> {
  return analyzeCameraFrameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCameraFramePrompt',
  input: { schema: AnalyzeCameraFrameInputSchema },
  output: { schema: AnalyzeCameraFrameOutputSchema },
  prompt: `You are an AI assistant specialized in analyzing human faces in images. Your task is to describe visible faces, but **do not attempt to identify or name individuals**. For each clearly visible face in the following image frame, provide:
1.  Estimated Age Range (e.g., 20-25, 40s, child, adult, senior).
2.  Estimated Gender (e.g., Male, Female, Unclear).
3.  Observed Dominant Mood/Emotion (e.g., Happy, Sad, Neutral, Surprised, Angry, Focused).
4.  Observed Behavior/Action (e.g., Smiling, Looking at the camera, Talking, Yawning, Looking away).

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
    const { output } = await prompt(input);
    if (!output) {
      return { 
        faces: [],
        detectionSummary: "The AI could not provide an analysis for this frame." 
      };
    }
    // Ensure faces is an array even if the LLM fails to provide it as one sometimes
    if (!Array.isArray(output.faces)) {
        output.faces = [];
    }
    return output;
  }
);

