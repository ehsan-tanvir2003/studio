
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {config} from 'dotenv';
import path from 'path';

// Explicitly load .env from the project root.
// This ensures that for this module's execution, .env is loaded.
// It might be redundant if Next.js or another part of the toolchain already does it.
try {
  config({ path: path.resolve(process.cwd(), '.env') });
  console.log('[Genkit Init] Successfully called dotenv.config().');
  console.log('[Genkit Init] GEMINI_API_KEY from process.env after config:', process.env.GEMINI_API_KEY ? 'Loaded' : 'Not Loaded');
  console.log('[Genkit Init] GOOGLE_API_KEY from process.env after config:', process.env.GOOGLE_API_KEY ? 'Loaded' : 'Not Loaded');
  console.log('[Genkit Init] PEOPLEDATALABS_API_KEY from process.env after config:', process.env.PEOPLEDATALABS_API_KEY ? 'Loaded' : 'Not Loaded');
} catch (e) {
  console.error('[Genkit Init] Failed to load .env file:', e);
}

// Attempt to retrieve the API key from environment variables
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

// Log the key (or lack thereof) for debugging
// Only log a portion of the key for security if found
const apiKeyPreview = apiKey ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}` : "NOT FOUND";
console.log(`[Genkit Init] Attempting to use Google API Key (GOOGLE_API_KEY or GEMINI_API_KEY): '${apiKeyPreview}'`);

if (!apiKey) {
  // This error will appear in the server logs if the key isn't found when this module loads.
  console.error(
    'CRITICAL ERROR [Genkit Init]: GOOGLE_API_KEY or GEMINI_API_KEY not found in environment variables. ' +
    'The Genkit Google AI plugin WILL NOT authenticate correctly. ' +
    'Ensure the key is set in your .env file at the project root and accessible to the server process.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey, // Explicitly pass the API key. If apiKey is undefined, plugin might still try env vars.
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
