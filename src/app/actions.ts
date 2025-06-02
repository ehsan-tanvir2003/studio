
// src/app/actions.ts
"use server";

import { numberScan, type NumberScanOutput, type NumberScanInput } from '@/ai/flows/number-scan';
import { fetchCellTowerLocation, type CellTowerLocation } from '@/services/unwiredlabs';
import * as z from 'zod';

// --- Phone Number Scan ---
const phoneNumberSchema = z.string()
  .min(1, "Phone number is required.")
  .regex(/^(?:\+8801|8801|01)[13-9]\d{8}$/, "Please enter a valid Bangladeshi phone number (e.g., 01712345678 or +8801712345678).");

export async function performNumberScan(phoneNumber: string): Promise<NumberScanOutput | { error: string }> {
  const validationResult = phoneNumberSchema.safeParse(phoneNumber);
  if (!validationResult.success) {
    return { error: validationResult.error.errors[0].message };
  }

  const input: NumberScanInput = { phoneNumber: validationResult.data };

  try {
    const result = await numberScan(input);
    return {
      summary: result.summary || "No specific summary could be generated for this number.",
      sources: result.sources || [],
      associatedNames: result.associatedNames || [],
      potentialLocations: result.potentialLocations || [],
      socialMediaProfiles: result.socialMediaProfiles || [],
      businessListings: result.businessListings || []
    };
  } catch (error) {
    console.error("Error in numberScan AI flow:", error);
    if (error instanceof Error) {
        if (error.message.includes("503") || error.message.toLowerCase().includes("model is overloaded") || error.message.toLowerCase().includes("service unavailable")) {
            return { error: "The AI service is temporarily busy or unavailable. Please try again in a few moments." };
        }
        return { error: `AI processing failed: ${error.message}` };
    }
    return { error: "An unexpected error occurred during the AI scan." };
  }
}

// --- Cell Tower Locator ---
const BANGLADESH_MCC = 470; // Moved to be a local constant

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
  
  // Ensure mnc is a number for the service call
  const mncNumber = parseInt(mnc, 10);
  if (isNaN(mncNumber)) {
      return { error: "Invalid operator MNC."}
  }

  return fetchCellTowerLocation(apiKey, BANGLADESH_MCC, mncNumber, lac, cellId);
}

