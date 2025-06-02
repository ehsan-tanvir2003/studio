
// src/app/actions.ts
"use server";

import { searchPdlPersonProfiles, type PdlPersonSearchOutput, type PdlPersonSearchInput } from '@/ai/flows/pdl-person-search-flow';
import { fetchCellTowerLocation, type CellTowerLocation } from '@/services/unwiredlabs';
import * as z from 'zod';

// --- PeopleDataLabs Person Search ---
const pdlPersonSearchSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters long.").max(100, "Full name is too long."),
  location: z.string().max(100, "Location hint is too long.").optional().default(""), // Optional, defaults to empty string
  size: z.number().optional().default(10),
});

export async function searchPdlProfiles(
  fullName: string, 
  location?: string, // Location is now optional in the function signature as well
  size?: number
): Promise<PdlPersonSearchOutput> { // Return type directly from flow
  const validationResult = pdlPersonSearchSchema.safeParse({ fullName, location: location || "", size });
  if (!validationResult.success) {
    // Construct an error object similar to PdlPersonSearchOutput
    return { 
      matches: [], 
      totalMatches: 0,
      error: validationResult.error.errors.map(e => e.message).join(', ') 
    };
  }

  const input: PdlPersonSearchInput = validationResult.data;

  try {
    const result = await searchPdlPersonProfiles(input);
    return result;
  } catch (error) {
    console.error("Error in searchPdlPersonProfiles flow:", error);
    let errorMessage = "An unexpected error occurred during PDL profile search.";
     if (error instanceof Error) {
        if (error.message.includes("503") || error.message.toLowerCase().includes("overloaded") || error.message.toLowerCase().includes("service unavailable")) {
            errorMessage = "The PDL service is temporarily busy or unavailable. Please try again in a few moments.";
        } else {
            errorMessage = `PDL search failed: ${error.message}`;
        }
    }
    return { matches: [], totalMatches: 0, error: errorMessage };
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

  if (!apiKey || apiKey === "YOUR_UNWIREDLABS_API_KEY_HERE") {
    console.error("UNWIREDLABS_API_KEY is not set or is a placeholder in .env file");
    return { error: "Service configuration error: Unwired Labs API key missing or invalid." };
  }
  
  const mncNumber = parseInt(mnc, 10);
  if (isNaN(mncNumber)) {
      return { error: "Invalid operator MNC."}
  }

  return fetchCellTowerLocation(apiKey, BANGLADESH_MCC, mncNumber, lac, cellId);
}

