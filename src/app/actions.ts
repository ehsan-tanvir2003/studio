
// src/app/actions.ts
"use server";

import { numberScan, type NumberScanOutput, type NumberScanInput } from '@/ai/flows/number-scan';
import * as z from 'zod';

// Schema for input validation for Bangladeshi phone numbers.
// Matches 01XXXXXXXXX or +8801XXXXXXXXX (or 8801XXXXXXXXX)
// Operator codes start with 1 or 3-9 after the '01' or '+8801' prefix.
const phoneNumberSchema = z.string()
  .min(1, "Phone number is required.")
  .regex(/^(?:\+8801|8801|01)[13-9]\d{8}$/, "Please enter a valid Bangladeshi phone number (e.g., 01712345678 or +8801712345678).");


export async function performNumberScan(phoneNumber: string): Promise<NumberScanOutput | { error: string }> {
  const validationResult = phoneNumberSchema.safeParse(phoneNumber);
  if (!validationResult.success) {
    // Return the first error message for simplicity
    return { error: validationResult.error.errors[0].message };
  }

  const input: NumberScanInput = { phoneNumber: validationResult.data };

  try {
    const result = await numberScan(input);
    
    // Ensure the structure is consistent even if AI provides minimal data for optional fields.
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

