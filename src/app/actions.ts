
// src/app/actions.ts
"use server";

import { pdlPersonSearch, type PDLPersonSearchOutput, type PDLPersonSearchInput } from '@/ai/flows/pdl-person-search-flow';
import { fetchCellTowerLocation, type CellTowerLocation } from '@/services/unwiredlabs';
import * as z from 'zod';

// --- Person Intel Search (Now using PeopleDataLabs) ---
const personSearchSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters long.").max(100, "Full name is too long."),
  city: z.string().min(2, "City name must be at least 2 characters long.").max(100, "City name is too long."),
});

export async function performPersonSearch(
  fullName: string, 
  city: string
): Promise<PDLPersonSearchOutput | { error: string }> {
  const validationResult = personSearchSchema.safeParse({ fullName, city });
  if (!validationResult.success) {
    return { error: validationResult.error.errors.map(e => e.message).join(', ') };
  }

  const input: PDLPersonSearchInput = validationResult.data;

  try {
    const result = await pdlPersonSearch(input);
    if (result.errorMessage) {
      return { error: result.errorMessage };
    }
    return {
      totalMatches: result.totalMatches,
      matches: result.matches || [],
    };
  } catch (error) {
    console.error("Error in pdlPersonSearch AI flow:", error);
    if (error instanceof Error) {
        if (error.message.includes("503") || error.message.toLowerCase().includes("model is overloaded") || error.message.toLowerCase().includes("service unavailable")) {
            return { error: "The AI service is temporarily busy or unavailable. Please try again in a few moments." };
        }
         if (error.message.toLowerCase().includes('api key')) {
            return { error: "PDL API Key error. Please check your configuration."}
        }
        return { error: `AI processing failed: ${error.message}` };
    }
    return { error: "An unexpected error occurred during the PDL search." };
  }
}

// --- Cell Tower Locator ---
const BANGLADESH_MCC = 470; 

const cellTowerLocatorSchema = z.object({
  lac: z.coerce.number().int().positive("LAC must be a positive integer."),
  cellId: z.coerce.number().int().positive("Cell ID must be a positive integer."),
  mnc: z.string().min(1, "Operator selection is required."),
});

export type CellTowerLocatorInput = z.infer<typeof cellTowerLocatorSchema>;

export async function locateCellTower(
  input: CellTowerLocatorInput
): Promise<CellTowerLocation | { error: string }> {
  const validationResult = cellTowerLocatorSchema.safeParse(input);
  if (!validationResult.success) {
    return { error: validationResult.error.errors.map(e => e.message).join(', ') };
  }

  const { lac, cellId, mnc } = validationResult.data;
  const apiKey = process.env.UNWIREDLABS_API_KEY;

  if (!apiKey) {
    console.error("UNWIREDLABS_API_KEY is not set in .env file");
    return { error: "Service configuration error: API key missing." };
  }
  
  const mncNumber = parseInt(mnc, 10);
  if (isNaN(mncNumber)) {
      return { error: "Invalid operator MNC."}
  }

  return fetchCellTowerLocation(apiKey, BANGLADESH_MCC, mncNumber, lac, cellId);
}

    
