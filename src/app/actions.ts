
// src/app/actions.ts
"use server";

import { searchPdlPersonProfiles, type PdlPersonSearchOutput, type PdlPersonSearchInput } from '@/ai/flows/pdl-person-search-flow';
import { analyzeCameraFrame, type AnalyzeCameraFrameInput, type AnalyzeCameraFrameOutput } from '@/ai/flows/analyze-camera-frame-flow';
import { fetchCellTowerLocationFromUnwiredLabs, type CellTowerLocation } from '@/services/unwiredlabs';
import { searchFaceWithFaceCheck, type FaceCheckInput, type FaceCheckOutput } from '@/ai/flows/face-check-flow';
import * as z from 'zod';

// --- PeopleDataLabs Person Search (Retained for potential future use, not primary for InfoSleuth page anymore) ---
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

// --- FaceCheck.ID Reverse Image Search ---
const faceCheckActionInputSchema = z.object({
  imageDataUri: z.string().startsWith('data:image/', { message: "Image data URI must start with 'data:image/'" }),
});

export async function searchFaceWithFaceCheckAction(
  imageDataUri: string
): Promise<FaceCheckOutput> {
  const validationResult = faceCheckActionInputSchema.safeParse({ imageDataUri });
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors.map(e => e.message).join(', '),
    };
  }
  
  const flowInput: FaceCheckInput = { 
    imageDataUri: validationResult.data.imageDataUri,
  };

  try {
    const result = await searchFaceWithFaceCheck(flowInput);
    return result;
  } catch (error) {
    console.error("Error in searchFaceWithFaceCheck flow:", error);
    let errorMessage = "An unexpected error occurred during FaceCheck.ID search.";
    if (error instanceof Error) {
      errorMessage = `FaceCheck.ID search failed: ${error.message}`;
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

// --- Camera Frame Analysis ---
const cameraFrameAnalysisSchema = z.object({
  imageDataUri: z.string().startsWith('data:image/', { message: "Image data URI must start with 'data:image/'" }),
});

export async function analyzeImageFrame(
  imageDataUri: string
): Promise<AnalyzeCameraFrameOutput | { error: string }> {
  const validationResult = cameraFrameAnalysisSchema.safeParse({ imageDataUri });
  if (!validationResult.success) {
    return { 
      error: validationResult.error.errors.map(e => e.message).join(', ') 
    };
  }

  const input: AnalyzeCameraFrameInput = validationResult.data;

  try {
    const result = await analyzeCameraFrame(input);
    return result;
  } catch (error) {
    console.error("Error in analyzeCameraFrame flow:", error);
    let errorMessage = "An unexpected error occurred during image frame analysis.";
     if (error instanceof Error) {
        errorMessage = `Frame analysis failed: ${error.message}`;
    }
    return { error: errorMessage };
  }
}
