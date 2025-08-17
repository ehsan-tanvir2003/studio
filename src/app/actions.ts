"use server";

import { fetchCellTowerLocationFromUnwiredLabs, type CellTowerLocation } from '@/services/unwiredlabs';
import * as z from 'zod';

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
