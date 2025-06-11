
'use server';

/**
 * @fileOverview Summarizes the content of a document (PDF, webpage) given its URL.
 *
 * - summarizeDocument - A function that summarizes the content of a document.
 * - SummarizeDocumentInput - The input type for the summarizeDocument function.
 * - SummarizeDocumentOutput - The return type for the summarizeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDocumentInputSchema = z.object({
  documentUrl: z.string().url().describe('The URL of the document to summarize.'),
});
export type SummarizeDocumentInput = z.infer<typeof SummarizeDocumentInputSchema>;

const SummarizeDocumentOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the document content.'),
});
export type SummarizeDocumentOutput = z.infer<typeof SummarizeDocumentOutputSchema>;

export async function summarizeDocument(input: SummarizeDocumentInput): Promise<SummarizeDocumentOutput> {
  return summarizeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeDocumentPrompt',
  input: {schema: SummarizeDocumentInputSchema},
  output: {schema: SummarizeDocumentOutputSchema},
  prompt: `You are an expert summarizer. Please summarize the content of the document at the following URL:\n\n{{{documentUrl}}}`,
});

const summarizeDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeDocumentFlow',
    inputSchema: SummarizeDocumentInputSchema,
    outputSchema: SummarizeDocumentOutputSchema,
  },
  async (input): Promise<SummarizeDocumentOutput> => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        console.error('[summarizeDocumentFlow] Prompt returned no output.');
        return { summary: '[Error: No summary could be generated due to missing output from AI model.]' };
      }
      return output;
    } catch (error) {
      console.error('[summarizeDocumentFlow] Error during document summarization:', error);
      let errorMessage = 'Error during summarization.';
      if (error instanceof Error) {
        errorMessage = `Error during summarization: ${error.message}`;
      }
      // Truncate if too long, as summary might have length constraints in UI
      const displayError = `[AI Summary Error: ${errorMessage.substring(0, 200)}${errorMessage.length > 200 ? '...' : ''}]`;
      return { summary: displayError };
    }
  }
);
