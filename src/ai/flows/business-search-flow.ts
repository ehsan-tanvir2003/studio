
'use server';
/**
 * @fileOverview A mock business search AI flow.
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
  // Add other fields that might be extracted from documents, e.g.,
  // servicesOffered: z.array(z.string()).optional(),
  // yearFounded: z.number().optional(),
});
export type BusinessInfo = z.infer<typeof BusinessInfoSchema>;

const BusinessSearchOutputSchema = z.object({
  matches: z.array(BusinessInfoSchema).describe('Array of matching business information from the mock dataset.'),
  message: z.string().optional().describe('A message about the search operation.'),
  error: z.string().optional().describe('Error message if the search failed.'),
});
export type BusinessSearchOutput = z.infer<typeof BusinessSearchOutputSchema>;

// Mock Dataset - In a real application, this would come from an indexed database
// of processed document content.
const mockBusinessData: BusinessInfo[] = [
  {
    id: 'biz001',
    name: 'Innovatech Solutions Ltd.',
    category: 'Technology & Software Development',
    summary: 'Provides cutting-edge software solutions, cloud computing services, and AI-driven analytics for various industries. Specializes in custom enterprise applications.',
    keywords: ['software', 'cloud', 'ai', 'analytics', 'enterprise', 'tech solutions', 'innovation'],
    contact: { phone: '555-0101', email: 'contact@innovatech.com', address: '123 Tech Park, Silicon Valley, CA' }
  },
  {
    id: 'biz002',
    name: 'GreenLeaf Organics',
    category: 'Retail - Food & Beverage',
    summary: 'Offers a wide range of organic food products, fresh produce, and health supplements. Committed to sustainable farming and healthy living.',
    keywords: ['organic', 'food', 'health', 'supplements', 'sustainable', 'farming', 'retail'],
    contact: { phone: '555-0202', email: 'info@greenleaf.org', address: '45 Grove Lane, Wellness City, TX' }
  },
  {
    id: 'biz003',
    name: 'Precision Engineering Inc.',
    category: 'Manufacturing & Industrial',
    summary: 'Specializes in high-precision CNC machining, custom parts manufacturing, and industrial equipment repair. Serves aerospace and automotive sectors.',
    keywords: ['engineering', 'cnc machining', 'manufacturing', 'industrial parts', 'aerospace', 'automotive'],
    contact: { phone: '555-0303', email: 'sales@precisioneng.co', address: '789 Industrial Blvd, Motor City, MI' }
  },
  {
    id: 'biz004',
    name: 'Capital Advisors Group',
    category: 'Financial Services & Consulting',
    summary: 'Provides expert financial planning, investment management, and corporate advisory services. Helps clients achieve long-term financial goals.',
    keywords: ['finance', 'investment', 'consulting', 'advisory', 'wealth management', 'financial planning'],
    contact: { phone: '555-0404', email: 'desk@capitaladvisors.com', address: '1 Financial Plaza, New York, NY' }
  },
  {
    id: 'biz005',
    name: 'Global Logistics Solutions',
    category: 'Logistics & Transportation',
    summary: 'International freight forwarding, supply chain management, and warehousing solutions. Efficient and reliable shipping services worldwide.',
    keywords: ['logistics', 'shipping', 'freight', 'supply chain', 'transport', 'warehousing', 'global'],
    contact: { phone: '555-0505', email: 'ops@globallogistics.net', address: 'Port City Docks, Unit 5, CA' }
  }
];

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
      return { matches: [], message: 'Search term was empty. No results to display from mock data.' };
    }

    try {
      // Simulate a search against the mock data
      const results = mockBusinessData.filter(business => {
        const searchableText = `
          ${business.name.toLowerCase()} 
          ${business.category.toLowerCase()} 
          ${business.summary.toLowerCase()} 
          ${business.keywords.join(' ').toLowerCase()}
          ${business.contact?.email?.toLowerCase() || ''}
          ${business.contact?.address?.toLowerCase() || ''}
        `;
        return searchableText.includes(searchTerm);
      });

      console.log(`[Business Search Flow] Found ${results.length} matches in mock data.`);
      return {
        matches: results,
        message: `Successfully searched mock data. Found ${results.length} item(s).`
      };

    } catch (error) {
      console.error('[Business Search Flow] Error during mock search:', error);
      let errorMessage = 'An unexpected error occurred during the business search.';
      if (error instanceof Error) {
        errorMessage = `Business Search Exception: ${error.message}`;
      }
      return { matches: [], error: errorMessage, message: "Search failed due to an internal error." };
    }
  }
);
