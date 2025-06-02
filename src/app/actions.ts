
// src/app/actions.ts
"use server";

import { generatePersonProfile, type PersonProfileOutput, type PersonProfileInput } from '@/ai/flows/person-profile-builder-flow';
import { fetchCellTowerLocation, type CellTowerLocation } from '@/services/unwiredlabs';
import * as z from 'zod';

// --- AI Person Profile Synthesizer ---
const personProfileSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters long.").max(100, "Full name is too long."),
  locationHint: z.string().min(2, "Location hint must be at least 2 characters long.").max(100, "Location hint is too long."),
});

export async function generateAiPersonProfile(
  fullName: string, 
  locationHint: string
): Promise<PersonProfileOutput | { error: string }> {
  const validationResult = personProfileSchema.safeParse({ fullName, locationHint });
  if (!validationResult.success) {
    return { error: validationResult.error.errors.map(e => e.message).join(', ') };
  }

  const input: PersonProfileInput = validationResult.data;

  try {
    const result = await generatePersonProfile(input);
    return result; // The flow itself will throw if output is null
  } catch (error) {
    console.error("Error in generatePersonProfile AI flow:", error);
    if (error instanceof Error) {
        if (error.message.includes("503") || error.message.toLowerCase().includes("model is overloaded") || error.message.toLowerCase().includes("service unavailable")) {
            return { error: "The AI service is temporarily busy or unavailable. Please try again in a few moments." };
        }
        return { error: `AI profile generation failed: ${error.message}` };
    }
    return { error: "An unexpected error occurred during AI profile generation." };
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
