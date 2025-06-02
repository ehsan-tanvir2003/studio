
'use server';

// API endpoint for Unwired Labs
const UNWIREDLABS_API_URL = 'https://us1.unwiredlabs.com/v2/process.php';

interface UnwiredLabsRequestPayload {
  token: string;
  radio: 'gsm' | 'cdma' | 'umts' | 'lte'; // Radio type
  mcc: number;
  mnc: number;
  cells: Array<{
    lac: number;
    cid: number;
    // Other optional params like psc, signal, taco could be added if needed
  }>;
  address: 1 | 0; // 1 to request address, 0 otherwise
  // Optional: 'balance', 'fallbacks', 'response_type'
}

interface UnwiredLabsSuccessResponse {
  status: 'ok';
  balance?: number; // Balance of LAC requests
  balance_lac?: number; // Balance of LAC requests (alternative field)
  lat: number;
  lon: number;
  accuracy: number; // Accuracy of the location in meters
  address?: string; // Address if requested and found
  // Other fields like 'age', 'fallback' might be present
}

interface UnwiredLabsErrorResponse {
  status: 'error';
  message: string;
}

export type UnwiredLabsResponse = UnwiredLabsSuccessResponse | UnwiredLabsErrorResponse;

export interface CellTowerLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string | null; // Address can be null if not found or not requested
  googleMapsUrl: string;
  balance?: number;
}

export async function fetchCellTowerLocationFromUnwiredLabs(
  apiKey: string,
  mcc: number,
  mnc: number,
  lac: number,
  cellId: number,
  radioType: 'gsm' | 'cdma' | 'umts' | 'lte' = 'gsm' // Default to GSM
): Promise<CellTowerLocation | { error: string }> {
  if (!apiKey || apiKey.trim() === "") {
    return { error: 'Unwired Labs API key is not configured. Please set a valid UNWIREDLABS_API_KEY in your .env file.' };
  }

  const payload: UnwiredLabsRequestPayload = {
    token: apiKey,
    radio: radioType,
    mcc: mcc,
    mnc: mnc,
    cells: [{ lac: lac, cid: cellId }],
    address: 1, // Request address
  };

  console.log(`[UnwiredLabs Service] Requesting URL: ${UNWIREDLABS_API_URL} with payload:`, JSON.stringify(payload));

  try {
    const response = await fetch(UNWIREDLABS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData: UnwiredLabsResponse = await response.json();
    console.log('[UnwiredLabs Service] Response Data:', responseData);

    if (responseData.status === 'error') {
      const errorData = responseData as UnwiredLabsErrorResponse;
      let errorMessage = `Unwired Labs API Error: ${errorData.message || 'Unknown error from Unwired Labs'}`;
      if (errorData.message.toLowerCase().includes("no data found")) {
        errorMessage = 'No location data found for the provided Cell ID, LAC, and operator combination in the Unwired Labs database.';
      } else if (errorData.message.toLowerCase().includes("invalid token") || errorData.message.toLowerCase().includes("authentication parameters missing")) {
        errorMessage = 'Unwired Labs API Key is invalid or missing. Please check your configuration.';
      }
      return { error: errorMessage };
    }
    
    if (responseData.status === 'ok') {
        const successData = responseData as UnwiredLabsSuccessResponse;
         if (typeof successData.lat !== 'number' || typeof successData.lon !== 'number') {
            console.warn('[UnwiredLabs Service] Response successful but missing coordinates:', successData);
            return { error: 'Unwired Labs returned a response without coordinates for the given cell.' };
        }
        return {
            latitude: successData.lat,
            longitude: successData.lon,
            accuracy: successData.accuracy,
            address: successData.address || null,
            googleMapsUrl: `https://www.google.com/maps?q=${successData.lat},${successData.lon}`,
            balance: successData.balance || successData.balance_lac,
        };
    }

    return { error: 'Unexpected response status from Unwired Labs API.' };

  } catch (error) {
    console.error('[UnwiredLabs Service] Error fetching cell tower location:', error);
    let errorMessage = 'Network or unexpected error during Unwired Labs API call.';
    if (error instanceof Error) {
      errorMessage = `Unwired Labs Network/Parsing Error: ${error.message}`;
    }
    return { error: errorMessage };
  }
}
