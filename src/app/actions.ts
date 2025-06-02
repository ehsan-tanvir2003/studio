// src/app/actions.ts
"use server";

import { numberScan, type NumberScanOutput, type NumberScanInput } from '@/ai/flows/number-scan';
import * as z from 'zod';

// Schema for input validation for the phone number string.
// Matches typical North American numbers, 10 digits, optional +1 and common separators.
const phoneNumberSchema = z.string()
  .min(1, "Phone number is required.")
  .regex(/^(?:\+?1[-.\s]?)?(?:\(?([2-9][0-8][0-9])\)?[-.\s]?)?([2-9][0-9]{2})[-.\s]?([0-9]{4})$/, "Please enter a valid North American phone number (e.g., 123-456-7890 or (123)456-7890).");


export async function performNumberScan(phoneNumber: string): Promise<NumberScanOutput | { error: string }> {
  const validationResult = phoneNumberSchema.safeParse(phoneNumber);
  if (!validationResult.success) {
    // Return the first error message for simplicity
    return { error: validationResult.error.errors[0].message };
  }

  const input: NumberScanInput = { phoneNumber: validationResult.data };

  try {
    const result = await numberScan(input);
    
    // The AI flow might return an empty summary or empty sources if nothing is found.
    // This is a valid response, not an error.
    // Ensure the structure is consistent even if AI provides minimal data.
    return {
      summary: result?.summary || "No specific summary could be generated for this number.",
      sources: result?.sources || []
    };
  } catch (error) {
    console.error("Error in numberScan AI flow:", error);
    if (error instanceof Error) {
        return { error: `AI processing failed: ${error.message}` };
    }
    return { error: "An unexpected error occurred during the AI scan." };
  }
}
