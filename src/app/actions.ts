
// src/app/actions.ts
"use server";

import { searchPdlPersonProfiles, type PdlPersonSearchOutput, type PdlPersonSearchInput } from '@/ai/flows/pdl-person-search-flow';
import { searchImageWithRapidApi, type RapidApiImageSearchInput, type RapidApiImageSearchOutput } from '@/ai/flows/rapidapi-face-search-flow';
import { fetchCellTowerLocationFromUnwiredLabs, type CellTowerLocation } from '@/services/unwiredlabs';
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

// --- RapidAPI Reverse Image Search ---
// Zod schema for the input received by this server action
const rapidApiActionInputSchema = z.object({
  imageDataUri: z.string().startsWith('data:image/', { message: "Image data URI must start with 'data:image/'" }),
  // apiEndpointUrl is no longer received from the client
});

export async function searchWithRapidApi(
  imageDataUri: string
  // apiEndpointUrl is no longer a parameter here
): Promise<RapidApiImageSearchOutput> {
  const validationResult = rapidApiActionInputSchema.safeParse({ imageDataUri });
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors.map(e => e.message).join(', '),
    };
  }

  const host = process.env.RAPIDAPI_HOST;
  // IMPORTANT: Replace "YOUR_REVERSE_IMAGE_SEARCH_PATH_HERE" with the actual API path from RapidAPI documentation.
  // For example, it might be "/searchByImage", "/upload", or "/reverse-image-search".
  const path = "/YOUR_REVERSE_IMAGE_SEARCH_PATH_HERE"; 

  if (!host || host.trim() === "") {
    console.error('[RapidAPI Action] CRITICAL: RAPIDAPI_HOST is not configured in .env file.');
    return { success: false, error: "RapidAPI Host is not configured on the server. Please check the .env file." };
  }
  if (path === "/YOUR_REVERSE_IMAGE_SEARCH_PATH_HERE" || path.trim() === "") {
    console.error('[RapidAPI Action] CRITICAL: The API path for reverse image search is not set in src/app/actions.ts.');
    return { success: false, error: "The specific RapidAPI endpoint path for reverse image search is not configured in the backend. Please contact support or a developer."};
  }
  
  const constructedApiEndpointUrl = `https://${host}${path}`;

  // This is the input for the Genkit flow, which still expects apiEndpointUrl
  const flowInput: RapidApiImageSearchInput = { 
    imageDataUri: validationResult.data.imageDataUri,
    apiEndpointUrl: constructedApiEndpointUrl
  };

  try {
    const result = await searchImageWithRapidApi(flowInput);
    return result;
  } catch (error) {
    console.error("Error in searchImageWithRapidApi flow:", error);
    let errorMessage = "An unexpected error occurred during RapidAPI image search.";
    if (error instanceof Error) {
      errorMessage = `RapidAPI search failed: ${error.message}`;
    }
    return { success: false, error: errorMessage };
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
