
// src/app/actions.ts
"use server";

import { personIntelSearch, type PersonIntelOutput, type PersonIntelInput } from '@/ai/flows/person-intel-flow'; // Updated import
import { fetchCellTowerLocation, type CellTowerLocation } from '@/services/unwiredlabs';
import * as z from 'zod';

// --- Person Intel Search (Previously Phone Number Scan) ---
const personSearchSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters long.").max(100, "Full name is too long."),
  city: z.string().min(2, "City name must be at least 2 characters long.").max(100, "City name is too long."),
});

export async function performPersonSearch(
  fullName: string, 
  city: string
): Promise<PersonIntelOutput | { error: string }> {
  const validationResult = personSearchSchema.safeParse({ fullName, city });
  if (!validationResult.success) {
    return { error: validationResult.error.errors.map(e => e.message).join(', ') };
  }

  const input: PersonIntelInput = validationResult.data;

  try {
    const result = await personIntelSearch(input);
    return {
      overallSummary: result.overallSummary || "No specific summary could be generated.",
      probableMatches: result.probableMatches || [],
      dataSourcesAnalyzed: result.dataSourcesAnalyzed || [],
    };
  } catch (error) {
    console.error("Error in personIntelSearch AI flow:", error);
    if (error instanceof Error) {
        if (error.message.includes("503") || error.message.toLowerCase().includes("model is overloaded") || error.message.toLowerCase().includes("service unavailable")) {
            return { error: "The AI service is temporarily busy or unavailable. Please try again in a few moments." };
        }
        return { error: `AI processing failed: ${error.message}` };
    }
    return { error: "An unexpected error occurred during the AI search." };
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

    