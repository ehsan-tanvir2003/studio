
'use server';
/**
 * @fileOverview Analyzes an image frame from a camera feed.
 *
 * - analyzeCameraFrame - A function that takes an image data URI and returns a description.
 * - AnalyzeCameraFrameInput - The input type for the analyzeCameraFrame function.
 * - AnalyzeCameraFrameOutput - The return type for the analyzeCameraFrame function.
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

const AnalyzeCameraFrameOutputSchema = z.object({
  analysis: z.string().describe("The AI's analysis of the camera frame, describing objects, scene, and activities."),
});
export type AnalyzeCameraFrameOutput = z.infer<typeof AnalyzeCameraFrameOutputSchema>;

export async function analyzeCameraFrame(input: AnalyzeCameraFrameInput): Promise<AnalyzeCameraFrameOutput> {
  return analyzeCameraFrameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCameraFramePrompt',
  input: { schema: AnalyzeCameraFrameInputSchema },
  output: { schema: AnalyzeCameraFrameOutputSchema },
  prompt: `You are an AI assistant. Analyze the following image frame captured from a camera and provide a concise description of the scene.
Include any prominent objects, people (describe them generally, e.g., "a person walking", "two people talking", without attempting to identify them), and activities.
What are the key details in this image?

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
      // This case should ideally be handled by Zod schema validation if the LLM returns nothing,
      // but good to have a fallback.
      return { analysis: "The AI could not provide an analysis for this frame." };
    }
    return output;
  }
);
