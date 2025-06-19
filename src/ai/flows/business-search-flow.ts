
'use server';
/**
 * @fileOverview A business search AI flow.
 *
 * - searchBusinesses - A function that simulates searching business data.
 * - BusinessSearchInput - The input type for the searchBusinesses function.
 * - BusinessInfo - Schema for a business information record.
 * - BusinessSearchOutput - The return type for the searchBusinesses function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BusinessSearchInputSchema = z.object({
  searchTerm: z.string().describe('The term to search for in business data.'),
});
export type BusinessSearchInput = z.infer<typeof BusinessSearchInputSchema>;

const BusinessInfoSchema = z.object({
  id: z.string().describe("Unique ID for the business entry."),
  name: z.string().describe("Name of the business."),
  category: z.string().describe("Type or category of the business."),
  summary: z.string().describe("A brief summary of the business or its services."),
  keywords: z.array(z.string()).describe("Keywords associated with the business."),
  contact: z.object({
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
  }).optional().nullable().describe("Contact information for the business."),
  // Additional fields that might be extracted from documents:
  sourceDocument: z.string().optional().describe("Name or ID of the document this info came from."),
  extractedTextSnippets: z.array(z.string()).optional().describe("Relevant text snippets from the document."),
});
export type BusinessInfo = z.infer<typeof BusinessInfoSchema>;

const BusinessSearchOutputSchema = z.object({
  matches: z.array(BusinessInfoSchema).describe('Array of matching business information from the indexed document data.'),
  message: z.string().optional().describe('A message about the search operation.'),
  error: z.string().optional().describe('Error message if the search failed.'),
});
export type BusinessSearchOutput = z.infer<typeof BusinessSearchOutputSchema>;

// In a real application, this array would be populated by querying a
// persistent database (e.g., Firestore, PostgreSQL, Elasticsearch)
// where data extracted from uploaded documents is stored and indexed.
const allBusinessDataFromPersistentStore: BusinessInfo[] = [];
// For demonstration, if you want to manually add data here for testing the search logic
// while the backend is being developed, you can do so. Example:
// allBusinessDataFromPersistentStore.push({
//   id: 'doc001_bizA',
//   name: 'Example Tech Inc from Uploaded Doc',
//   category: 'Software Development',
//   summary: 'This company was mentioned in document X and specializes in AI.',
//   keywords: ['ai', 'software', 'documentX'],
//   contact: { phone: '555-9999', email: 'test@exampletechdoc.com' },
//   sourceDocument: 'DocumentX.pdf'
// });


export async function searchBusinesses(input: BusinessSearchInput): Promise<BusinessSearchOutput> {
  return businessSearchFlow(input);
}

const businessSearchFlow = ai.defineFlow(
  {
    name: 'businessSearchFlow',
    inputSchema: BusinessSearchInputSchema,
    outputSchema: BusinessSearchOutputSchema,
  },
  async (input) => {
    console.log('[Business Search Flow] Invoked with search term:', input.searchTerm);
    const searchTerm = input.searchTerm.toLowerCase().trim();

    if (!searchTerm) {
      return { matches: [], message: 'Search term was empty. No results to display.' };
    }

    //
    // THIS IS WHERE YOU WOULD INTEGRATE WITH YOUR REAL DATA SOURCE
    // - Fetch data from your database/search index.
    // - For now, it uses the 'allBusinessDataFromPersistentStore' array.
    // - In a production system, this array would be dynamically populated.
    //
    if (allBusinessDataFromPersistentStore.length === 0) {
      return { 
        matches: [], 
        message: 'No business data has been indexed yet. Upload documents to populate the search index. (Backend processing required).',
      };
    }

    try {
      // Simulate a search against the (currently empty or manually populated) data store
      const results = allBusinessDataFromPersistentStore.filter(business => {
        const searchableText = `
          ${business.name.toLowerCase()} 
          ${business.category.toLowerCase()} 
          ${business.summary.toLowerCase()} 
          ${business.keywords.join(' ').toLowerCase()}
          ${business.contact?.email?.toLowerCase() || ''}
          ${business.contact?.address?.toLowerCase() || ''}
          ${business.sourceDocument?.toLowerCase() || ''}
          ${(business.extractedTextSnippets || []).join(' ').toLowerCase()}
        `;
        return searchableText.includes(searchTerm);
      });

      console.log(`[Business Search Flow] Found ${results.length} matches in the current data store.`);
      return {
        matches: results,
        message: `Successfully searched the current data store. Found ${results.length} item(s).`
      };

    } catch (error) {
      console.error('[Business Search Flow] Error during search:', error);
      let errorMessage = 'An unexpected error occurred during the business search.';
      if (error instanceof Error) {
        errorMessage = `Business Search Exception: ${error.message}`;
      }
      return { matches: [], error: errorMessage, message: "Search failed due to an internal error." };
    }
  }
);

// Placeholder function for where document processing would be triggered
// This would typically be a separate backend service/Cloud Function.
export async function processAndIndexDocument(fileData: any /* actual file data type */, fileName: string): Promise<{ success: boolean; message: string }> {
  console.log(`[Business Search Flow] Received request to process document: ${fileName}`);
  // 1. Store the file (e.g., Firebase Storage)
  // 2. Extract content (PDF text, Excel data)
  // 3. Structure the data (e.g., into BusinessInfo objects)
  // 4. Index the data into your search database (e.g., Firestore, Elasticsearch)
  //
  // For now, this is a placeholder.
  return {
    success: false,
    message: `Document processing and indexing for '${fileName}' is not yet implemented. This requires backend development. The file was not stored or indexed.`
  };
}
