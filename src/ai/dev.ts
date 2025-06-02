
import { config } from 'dotenv';
config();

import '@/ai/flows/document-summary.ts';
// import '@/ai/flows/number-scan.ts'; // Old flow
// import '@/ai/flows/person-intel-flow.ts'; // Old Google search simulation flow
import '@/ai/flows/pdl-person-search-flow.ts'; // New PDL flow

    
