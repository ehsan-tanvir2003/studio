
import { config } from 'dotenv';
config();

import '@/ai/flows/document-summary.ts';
import '@/ai/flows/pdl-person-search-flow.ts';
import '@/ai/flows/analyze-camera-frame-flow.ts';
import '@/ai/flows/rapidapi-face-search-flow.ts'; // Updated import name
    
