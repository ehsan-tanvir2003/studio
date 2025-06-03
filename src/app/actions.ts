
// src/app/actions.ts
"use server";

import { searchPdlPersonProfiles, type PdlPersonSearchOutput, type PdlPersonSearchInput } from '@/ai/flows/pdl-person-search-flow';
import { analyzeCameraFrame, type AnalyzeCameraFrameInput, type AnalyzeCameraFrameOutput } from '@/ai/flows/analyze-camera-frame-flow';
import { fetchCellTowerLocationFromUnwiredLabs, type CellTowerLocation } from '@/services/unwiredlabs';
import { searchImagesWithTextQuery, type RapidApiTextImageSearchInput, type RapidApiTextImageSearchOutput } from '@/ai/flows/rapidapi-text-image-search-flow'; // Updated import
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

// --- RapidAPI Text-Based Image Search ---
const rapidApiTextSearchActionInputSchema = z.object({ // Renamed schema
  query: z.string().min(1, "Search query cannot be empty.").max(200, "Search query is too long."),
  limit: z.number().optional().default(10),
});

export async function searchWithRapidApiAction( // Function name kept same for now, but logic changed
  query: string,
  limit?: number
): Promise<RapidApiTextImageSearchOutput> { // Output type updated
  const validationResult = rapidApiTextSearchActionInputSchema.safeParse({ query, limit });
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors.map(e => e.message).join(', '),
      message: validationResult.error.errors.map(e => e.message).join(', '),
    };
  }

  const rapidApiHost = process.env.RAPIDAPI_HOST; // Should be real-time-image-search.p.rapidapi.com
  if (!rapidApiHost) {
    return { success: false, error: "RAPIDAPI_HOST is not configured in .env file.", message: "Server configuration error." };
  }

  // This is the specific path for the real-time-image-search API
  const apiPath = "/search"; 
  
  console.log(`[RapidAPI Action] Constructed full endpoint URL: https://${rapidApiHost}${apiPath}`);
  
  const flowInput: RapidApiTextImageSearchInput = { 
    query: validationResult.data.query,
    limit: validationResult.data.limit,
    apiEndpointUrl: `https://${rapidApiHost}${apiPath}`, // Pass the full base URL to the flow
  };

  try {
    const result = await searchImagesWithTextQuery(flowInput); // Calling updated flow
    return result;
  } catch (error) {
    console.error("Error in searchImagesWithTextQuery flow:", error);
    let errorMessage = "An unexpected error occurred during RapidAPI image search.";
    if (error instanceof Error) {
      errorMessage = `RapidAPI image search failed: ${error.message}`;
    }
    return { success: false, error: errorMessage, message: errorMessage };
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
