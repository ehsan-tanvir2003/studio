
// src/app/actions.ts
"use server";

import { searchPdlPersonProfiles, type PdlPersonSearchOutput, type PdlPersonSearchInput } from '@/ai/flows/pdl-person-search-flow';
import { searchFaceWithFaceCheck, type FaceCheckInput, type FaceCheckOutput } from '@/ai/flows/face-check-flow';
import { fetchCellTowerLocationFromOpenCellID, type CellTowerLocationFromOpenCellID } from '@/services/opencellid'; // Updated import
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

// --- FaceCheck.ID Search ---
// This action is currently not used as FaceSearch page directly links/embeds FaceCheck.ID website.
// Keeping it here for potential future API integration.
const faceCheckSearchSchema = z.object({
  imageDataUri: z.string().startsWith('data:image/', { message: "Image data URI must start with 'data:image/'" }),
});

export async function searchWithFaceCheckApi(
  imageDataUri: string
): Promise<FaceCheckOutput> {
  const validationResult = faceCheckSearchSchema.safeParse({ imageDataUri });
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors.map(e => e.message).join(', '),
    };
  }

  const input: FaceCheckInput = validationResult.data;

  try {
    const result = await searchFaceWithFaceCheck(input);
    return result;
  } catch (error) {
    console.error("Error in searchFaceWithFaceCheck flow:", error);
    let errorMessage = "An unexpected error occurred during FaceCheck.ID search.";
    if (error instanceof Error) {
      errorMessage = `FaceCheck search failed: ${error.message}`;
    }
    return { success: false, error: errorMessage };
  }
}


// --- Cell Tower Locator (using OpenCellID) ---
const BANGLADESH_MCC = 470; 

const cellTowerLocatorSchema = z.object({
  lac: z.coerce.number().int().positive("LAC must be a positive integer."),
  cellId: z.coerce.number().int().positive("Cell ID must be a positive integer."),
  mnc: z.string().min(1, "Operator selection is required."), // mnc from form is string
});

export type CellTowerLocatorInput = z.infer<typeof cellTowerLocatorSchema>;

// Define the return type for the locateCellTower action
export type CellTowerLocationResult = CellTowerLocationFromOpenCellID | { error: string };

export async function locateCellTower(
  input: CellTowerLocatorInput
): Promise<CellTowerLocationResult> {
  const validationResult = cellTowerLocatorSchema.safeParse(input);
  if (!validationResult.success) {
    return { error: validationResult.error.errors.map(e => e.message).join(', ') };
  }

  const { lac, cellId, mnc: mncString } = validationResult.data;
  const apiKey = process.env.OPENCELLID_API_KEY;

  if (!apiKey || apiKey === "YOUR_OPENCELLID_API_KEY_HERE" || apiKey.trim() === "") {
    console.error("OPENCELLID_API_KEY is not set or is a placeholder in .env file");
    return { error: "Service configuration error: OpenCellID API key missing or invalid." };
  }
  
  const mncNumber = parseInt(mncString, 10);
  if (isNaN(mncNumber)) {
      return { error: "Invalid operator MNC."}
  }

  // Call the new service function
  return fetchCellTowerLocationFromOpenCellID(apiKey, BANGLADESH_MCC, mncNumber, lac, cellId);
}
