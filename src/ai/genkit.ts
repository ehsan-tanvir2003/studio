
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {config} from 'dotenv';
import path from 'path';

// Explicitly load .env from the project root.
try {
  const envPath = path.resolve(process.cwd(), '.env');
  console.log(`[Genkit Init] Attempting to load .env file from path: ${envPath}`);
  const result = config({ path: envPath, override: true }); // Added override, useful for explicit loading

  if (result.error) {
    console.error('[Genkit Init] Error loading .env file via dotenv.config():', result.error);
  } else {
    console.log('[Genkit Init] dotenv.config() executed.');
    if (result.parsed) {
      console.log('[Genkit Init] Variables parsed by dotenv:', Object.keys(result.parsed));
      if (result.parsed.PEOPLEDATALABS_API_KEY) {
        console.log('[Genkit Init] PEOPLEDATALABS_API_KEY was found and parsed by dotenv.');
      } else {
        console.warn('[Genkit Init] PEOPLEDATALABS_API_KEY was NOT found or parsed by dotenv from the .env file.');
      }
    } else {
      console.warn('[Genkit Init] dotenv.config() did not parse any variables. This could mean the .env file is empty, not found at the path, or has syntax issues.');
    }
  }
} catch (e) {
  console.error('[Genkit Init] Exception during dotenv.config() execution:', e);
}

console.log('[Genkit Init] Current working directory (process.cwd()):', process.cwd());
console.log(`[Genkit Init] Checking process.env for GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? 'Loaded' : 'NOT LOADED'}`);
console.log(`[Genkit Init] Checking process.env for GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Loaded' : 'NOT LOADED'}`);
console.log(`[Genkit Init] Checking process.env for PEOPLEDATALABS_API_KEY: ${process.env.PEOPLEDATALABS_API_KEY ? 'Loaded (' + process.env.PEOPLEDATALABS_API_KEY.substring(0,5) + '...)' : 'NOT LOADED'}`);

// Attempt to retrieve the API key from environment variables
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

// Log the key (or lack thereof) for debugging
const apiKeyPreview = apiKey ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}` : "NOT FOUND";
console.log(`[Genkit Init] Attempting to use Google API Key (GOOGLE_API_KEY or GEMINI_API_KEY): '${apiKeyPreview}'`);

if (!apiKey) {
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
