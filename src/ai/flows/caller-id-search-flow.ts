
'use server';
/**
 * @fileOverview Searches for caller ID details using the Eyecon RapidAPI service.
 *
 * - searchCallerId - A function that fetches caller ID information.
 * - CallerIdSearchInput - The input type for the searchCallerId function.
 * - CallerIdSearchOutput - The return type for the searchCallerId function.
 * - CallerIdData - Schema for the actual caller ID information.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CallerIdSearchInputSchema = z.object({
  phoneNumber: z.string().min(7, "Phone number seems too short.").regex(/^[0-9]+$/, "Phone number should only contain digits.").describe('The phone number to search for, including country code without leading + or 00 (e.g., 1XXXXXXXXXX for US, 971501234567 for UAE).'),
});
export type CallerIdSearchInput = z.infer<typeof CallerIdSearchInputSchema>;

const SocialMediaInfoSchema = z.object({
  type: z.string().optional().nullable().describe("Type of social media (e.g., facebook, whatsapp, instagram)"),
  id: z.string().optional().nullable().describe("User ID or link for the social media"),
  name: z.string().optional().nullable().describe("Name associated with the social media profile"),
  photo: z.string().url().optional().nullable().describe("URL to profile photo on social media"),
});

const CallerIdDataSchema = z.object({
  name: z.string().optional().nullable().describe('The name associated with the phone number.'),
  photo: z.string().url().optional().nullable().describe('URL to a profile photo, if available.'),
  type: z.string().optional().nullable().describe('Type of number (e.g., mobile, landline).'),
  country: z.string().optional().nullable().describe('Country associated with the number.'),
  carrier: z.string().optional().nullable().describe('Carrier information, if available.'),
  socialMedia: z.array(SocialMediaInfoSchema).optional().nullable().describe('Array of social media profiles linked to the number.'),
  isSpam: z.boolean().optional().nullable().describe('Indicates if the number is reported as spam.'),
  tags: z.array(z.string()).optional().nullable().describe('Tags associated with the number (e.g., Spam, Business).'),
  lastSeen: z.string().optional().nullable().describe("User's last seen status on relevant platforms."),
  email: z.string().email().optional().nullable().describe("Email address associated with the number."),
  otherPhones: z.array(z.string()).optional().nullable().describe("Other phone numbers associated with this contact."),
  // Add other fields based on actual API response if needed
});
export type CallerIdData = z.infer<typeof CallerIdDataSchema>;

const CallerIdSearchOutputSchema = z.object({
  success: z.boolean().describe('Whether the API call was successful.'),
  data: CallerIdDataSchema.optional().nullable().describe('The caller ID information, if found.'),
  message: z.string().optional().nullable().describe('A message from the API, or an error message if success is false.'),
  error: z.string().optional().describe('Internal error message if the flow failed or API returned an error.'),
  rawResponse: z.any().optional().describe('The raw response from the API for debugging.'),
});
export type CallerIdSearchOutput = z.infer<typeof CallerIdSearchOutputSchema>;

export async function searchCallerId(input: CallerIdSearchInput): Promise<CallerIdSearchOutput> {
  return callerIdSearchFlow(input);
}

const callerIdSearchFlow = ai.defineFlow(
  {
    name: 'callerIdSearchFlow',
    inputSchema: CallerIdSearchInputSchema,
    outputSchema: CallerIdSearchOutputSchema,
  },
  async (input) => {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_EYECON_HOST; // Using specific host for Eyecon
    console.log('[Caller ID Flow] Invoked.');

    if (!rapidApiKey || rapidApiKey.trim() === "") {
      console.error('[Caller ID Flow] CRITICAL: RAPIDAPI_KEY is not configured.');
      return {
        success: false,
        error: 'RapidAPI Key is not configured. Please check server configuration.',
        message: 'RapidAPI Key is not configured.',
      };
    }
    if (!rapidApiHost || rapidApiHost.trim() === "") {
      console.error('[Caller ID Flow] CRITICAL: RAPIDAPI_EYECON_HOST is not configured.');
      return {
        success: false,
        error: 'RapidAPI Eyecon Host is not configured. Please check server configuration.',
        message: 'RapidAPI Eyecon Host is not configured.',
      };
    }
    console.log(`[Caller ID Flow] Using Key (starts with: ${rapidApiKey.substring(0, Math.min(5, rapidApiKey.length))}) and Host: ${rapidApiHost}`);

    const { phoneNumber } = input;
    const apiEndpointUrl = `https://${rapidApiHost}/?phone=${encodeURIComponent(phoneNumber)}`;
    console.log(`[Caller ID Flow] Target Endpoint URL: ${apiEndpointUrl}`);

    try {
      const response = await fetch(apiEndpointUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': rapidApiHost,
          'x-rapidapi-key': rapidApiKey,
        },
      });

      const responseText = await response.text();
      console.log(`[Caller ID Flow] Received response from API with status: ${response.status} ${response.statusText}`);
      
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(`[Caller ID Flow] Could not parse API response as JSON. Status: ${response.status}. Raw response (first 500 chars): ${responseText.substring(0, 500)}`);
        return {
            success: false,
            message: `API response was not valid JSON (status ${response.status}).`,
            error: `API response was not valid JSON. Raw: ${responseText.substring(0,100)}...`,
            rawResponse: responseText,
        };
      }

      if (!response.ok) {
        console.error(`[Caller ID Flow] API returned error. Status: ${response.status}. Parsed/Raw response: ${JSON.stringify(responseData || responseText).substring(0, 500)}`);
        let errorMsg = `RapidAPI Error (${response.status} ${response.statusText})`;
        if (responseData && (responseData.message || responseData.error || responseData.reason)) {
          errorMsg += ` - ${responseData.message || responseData.error || responseData.reason}`;
        } else if (responseText.length > 0 && responseText.length < 300 && !responseText.toLowerCase().includes("html")) {
          errorMsg += ` - ${responseText}`;
        }
        return {
          success: false,
          message: errorMsg,
          error: errorMsg,
          rawResponse: responseData || responseText,
        };
      }
      
      // Assuming Eyecon API returns data directly or within a 'data' field.
      // This needs to be adjusted based on the actual API response structure.
      // The provided cURL doesn't show the response body structure.
      // For now, let's assume the responseData IS the CallerIdData or is under responseData.data
      let callerData = responseData; 
      if (responseData.data && typeof responseData.data === 'object') {
        callerData = responseData.data;
      } else if (responseData.results && typeof responseData.results === 'object') { // Another common pattern
        callerData = responseData.results;
      } else if (Array.isArray(responseData) && responseData.length > 0 && typeof responseData[0] === 'object'){ // If it's an array of one result
        callerData = responseData[0];
      }

      // Basic validation: if no name or key identifier, it might be "not found" or an error
      if (!callerData || (!callerData.name && !callerData.photo && !callerData.socialMedia && Object.keys(callerData).length < 2) ) {
        // Check if responseData contains a message indicating "not found"
        const apiMessage = responseData.message || responseData.reason || "No specific message from API.";
        if (apiMessage.toLowerCase().includes("not found") || apiMessage.toLowerCase().includes("no user") || response.status === 404) {
           return {
            success: true, // API call was successful, but no data found
            data: null,
            message: `No caller ID information found for ${phoneNumber}. ${apiMessage}`,
            rawResponse: responseData,
          };
        }
        // If some data but seems incomplete, treat as partial success or data issue
        // For now, if main identifiers missing, treat as no data.
         return {
            success: true,
            data: null, // Explicitly null if no meaningful data
            message: responseData.message || "Caller ID information not found or incomplete.",
            rawResponse: responseData,
          };
      }


      // Map the API response to our CallerIdDataSchema.
      // This is a best-guess mapping and might need adjustment.
      const mappedData: CallerIdData = {
        name: callerData.name || (callerData.contact && callerData.contact.name) || null,
        photo: callerData.photo || (callerData.contact && callerData.contact.photo) || (callerData.image_url) || null,
        type: callerData.type || (callerData.phone_type) || null,
        country: callerData.country || (callerData.country_name) || null,
        carrier: callerData.carrier || null,
        socialMedia: Array.isArray(callerData.social_media) ? callerData.social_media.map((sm: any) => ({
            type: sm.type || sm.platform,
            id: sm.id || sm.url,
            name: sm.name,
            photo: sm.photo
        })) : (callerData.socials ? Object.entries(callerData.socials).map(([key, value]: [string, any]) => ({ type: key, id: value.id || value.url, name: value.name, photo: value.photo })) : []),
        isSpam: callerData.isSpam || (callerData.spam_score && callerData.spam_score > 50) || null, // Example spam logic
        tags: Array.isArray(callerData.tags) ? callerData.tags : [],
        lastSeen: callerData.last_seen || callerData.lastSeen,
        email: callerData.email,
        otherPhones: callerData.other_phones || callerData.otherPhones,
      };
      
      return {
        success: true,
        data: mappedData,
        message: responseData.message || "Caller ID information retrieved successfully.",
        rawResponse: responseData,
      };

    } catch (error) {
      console.error('[Caller ID Flow] Exception during API call or response processing:', error);
      let errorMessage = 'An unexpected error occurred during Caller ID search.';
      if (error instanceof Error) {
        errorMessage = `Caller ID Search Exception: ${error.message}`;
      }
      return { success: false, error: errorMessage, message: errorMessage };
    }
  }
);
