
// src/app/actions.ts
"use server";

import { searchPdlPersonProfiles, type PdlPersonSearchOutput, type PdlPersonSearchInput } from '@/ai/flows/pdl-person-search-flow';
import { fetchCellTowerLocationFromUnwiredLabs, type CellTowerLocation } from '@/services/unwiredlabs';
import { searchCallerId, type CallerIdSearchInput, type CallerIdSearchOutput } from '@/ai/flows/caller-id-search-flow';
import { searchVisualMatchesWithUrl, type VisualMatchesInput, type VisualMatchesOutput } from '@/ai/flows/visual-matches-flow';
import * as z from 'zod';

// --- PeopleDataLabs Person Search ---
const pdlPersonSearchSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters long.").max(100, "Full name is too long."),
  location: z.string().max(100, "Location hint is too long.").optional().default(""),
  size: z.number().optional().default(10),
});

export async function searchPdlProfiles(
  fullName: string, 
  location?: string,
  size?: number
): Promise<PdlPersonSearchOutput> { 
  const validationResult = pdlPersonSearchSchema.safeParse({ fullName, location: location || "", size });
  if (!validationResult.success) {
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

// --- Cell Tower Locator (using Unwired Labs) ---
const BANGLADESH_MCC = 470; 

const cellTowerLocatorSchema = z.object({
  lac: z.coerce.number().int().positive("LAC must be a positive integer."),
  cellId: z.coerce.number().int().positive("Cell ID must be a positive integer."),
  mnc: z.string().min(1, "Operator selection is required."), 
});

export type CellTowerLocatorInput = z.infer<typeof cellTowerLocatorSchema>;

export type CellTowerLocationResult = CellTowerLocation | { error: string };

export async function locateCellTower(
  input: CellTowerLocatorInput
): Promise<CellTowerLocationResult> {
  const validationResult = cellTowerLocatorSchema.safeParse(input);
  if (!validationResult.success) {
    return { error: validationResult.error.errors.map(e => e.message).join(', ') };
  }

  const { lac, cellId, mnc: mncString } = validationResult.data;
  const apiKey = process.env.UNWIREDLABS_API_KEY; 

  if (!apiKey || apiKey === "YOUR_UNWIREDLABS_API_KEY_HERE" || apiKey.trim() === "") { 
    console.error("UNWIREDLABS_API_KEY is not set or is a placeholder in .env file");
    return { error: "Service configuration error: Unwired Labs API key missing or invalid." };
  }
  
  const mncNumber = parseInt(mncString, 10);
  if (isNaN(mncNumber)) {
      return { error: "Invalid operator MNC."}
  }

  return fetchCellTowerLocationFromUnwiredLabs(apiKey, BANGLADESH_MCC, mncNumber, lac, cellId, 'gsm');
}

// --- Caller ID Search (using Eyecon RapidAPI) ---
const callerIdSearchActionSchema = z.object({
  countryCode: z.string().regex(/^[0-9]+$/, "Country code should only contain digits."),
  nationalNumber: z.string().min(5, "Phone number seems too short.").regex(/^[0-9]+$/, "Phone number should only contain digits."),
});

export async function searchCallerIdDetails(
  countryCode: string,
  nationalNumber: string
): Promise<CallerIdSearchOutput> {
  const validationResult = callerIdSearchActionSchema.safeParse({ countryCode, nationalNumber });
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors.map(e => e.message).join(', '),
      message: validationResult.error.errors.map(e => e.message).join(', '),
    };
  }

  const flowInput: CallerIdSearchInput = { 
    countryCode: validationResult.data.countryCode,
    nationalNumber: validationResult.data.nationalNumber,
  };

  try {
    const result = await searchCallerId(flowInput);
    return result;
  } catch (error) {
    console.error("Error in searchCallerId flow:", error);
    let errorMessage = "An unexpected error occurred during Caller ID search.";
    if (error instanceof Error) {
      errorMessage = `Caller ID search failed: ${error.message}`;
    }
    return { success: false, error: errorMessage, message: errorMessage };
  }
}

// --- Visual Matches Image Search (using Real-Time Lens Data RapidAPI) ---
const visualMatchesSearchActionSchema = z.object({
  imageUrl: z.string().url("A valid public HTTP/HTTPS URL for the image is required."),
  language: z.string().optional(),
  country: z.string().optional(),
});

export async function searchVisualMatchesAction(
  imageUrl: string,
  language?: string,
  country?: string
): Promise<VisualMatchesOutput> {
  const validationResult = visualMatchesSearchActionSchema.safeParse({ imageUrl, language, country });
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors.map(e => e.message).join(', '),
      message: validationResult.error.errors.map(e => e.message).join(', '),
    };
  }

  const flowInput: VisualMatchesInput = { 
    imageUrl: validationResult.data.imageUrl,
    language: validationResult.data.language,
    country: validationResult.data.country,
  };

  try {
    const result = await searchVisualMatchesWithUrl(flowInput);
    return result;
  } catch (error) {
    console.error("Error in searchVisualMatchesWithUrl flow:", error);
    let errorMessage = "An unexpected error occurred during visual matches search.";
    if (error instanceof Error) {
      errorMessage = `Visual matches search failed: ${error.message}`;
    }
    return { success: false, error: errorMessage, message: errorMessage };
  }
}
