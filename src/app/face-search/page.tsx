import { config } from 'dotenv';
config();

import '@/ai/flows/document-summary.ts';
import '@/ai/flows/pdl-person-search-flow.ts'; // Retained, but not used by /info-sleuth anymore
import '@/ai/flows/face-check-flow.ts'; // Used by /info-sleuth
import '@/ai/flows/analyze-camera-frame-flow.ts';