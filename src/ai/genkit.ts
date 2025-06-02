
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Attempt to retrieve the API key from environment variables
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  // This warning will appear in the server logs if the key isn't found when this module loads.
  console.warn(
    'WARNING: GOOGLE_API_KEY or GEMINI_API_KEY not found in environment variables. ' +
    'The Genkit Google AI plugin may not authenticate correctly. ' +
    'Ensure the key is set in your .env file and accessible to the server process.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey, // Explicitly pass the API key
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
