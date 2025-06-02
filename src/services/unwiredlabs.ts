
// src/services/unwiredlabs.ts
'use server';

const UNWIREDLABS_API_URL = 'https://us1.unwiredlabs.com/v2/process.php';

// This interface was for the POST request body, not strictly needed for GET but good for reference.
// interface UnwiredLabsRequestBody {
//   token: string;
//   radio: 'gsm' | 'umts' | 'lte' | 'cdma';
//   mcc: number;
//   mnc: number;
//   cells: UnwiredLabsCell[];
//   address: 0 | 1; 
// }

// interface UnwiredLabsCell {
//   lac: number;
//   cid: number;
//   psc?: number;
// }

interface UnwiredLabsSuccessResponse {
  status: 'ok';
  balance: number; 
  lat: number;
  lon: number;
  accuracy: number; 
  address?: string;
}

interface UnwiredLabsErrorResponse {
  status: 'error';
  message: string;
  balance?: number;
}

export type UnwiredLabsResponse = UnwiredLabsSuccessResponse | UnwiredLabsErrorResponse;

export interface CellTowerLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  googleMapsUrl: string;
}

export async function fetchCellTowerLocation(
  apiKey: string,
  mcc: number,
  mnc: number,
  lac: number,
  cellId: number,
  radioType: 'gsm' | 'umts' | 'lte' | 'cdma' = 'lte'
): Promise<CellTowerLocation | { error: string }> {
  if (!apiKey) {
    return { error: 'Unwired Labs API key is not configured. Please set a valid UNWIREDLABS_API_KEY in your .env file.' };
  }

  const params = new URLSearchParams({
    token: apiKey,
    radio: radioType,
    mcc: mcc.toString(),
    mnc: mnc.toString(),
    lac: lac.toString(),
    cid: cellId.toString(),
    address: '1', // Request address details
  });

  const requestUrl = `${UNWIREDLABS_API_URL}?${params.toString()}`;

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      try {
        const errorData: UnwiredLabsErrorResponse = await response.json();
         if (errorData.message && errorData.message.toLowerCase().includes('invalid request')) {
          return { error: `API Error: Invalid request (Status: ${response.status}) with GET. This could be due to incorrect parameters, or the API key requiring a different request format, endpoint, or permissions. URL: ${requestUrl}` };
        }
        return { error: `API Error: ${errorData.message || response.statusText} (Status: ${response.status})` };
      } catch (e) {
        return { error: `API HTTP Error: ${response.statusText} (Status: ${response.status}) and failed to parse error response.` };
      }
    }

    const data: UnwiredLabsResponse = await response.json();

    if (data.status === 'ok') {
      const successData = data as UnwiredLabsSuccessResponse;
      return {
        latitude: successData.lat,
        longitude: successData.lon,
        accuracy: successData.accuracy,
        address: successData.address,
        googleMapsUrl: `https://www.google.com/maps?q=${successData.lat},${successData.lon}`,
      };
    } else {
      const errorData = data as UnwiredLabsErrorResponse;
      if (errorData.message && errorData.message.toLowerCase().includes('no matches found')) {
        return { error: 'No location data found for the provided Cell ID and LAC with the selected operator.' };
      }
       if (errorData.message && errorData.message.toLowerCase().includes('invalid request')) { // Should be caught by !response.ok ideally
          return { error: `API Error: Invalid request. This could be due to incorrect parameters, or the API key requiring a different request format, endpoint, or permissions. Used GET to ${requestUrl}` };
      }
      return { error: `API Error: ${errorData.message || 'Unknown error from Unwired Labs'}` };
    }
  } catch (error) {
    console.error('Error fetching cell tower location:', error);
    if (error instanceof Error) {
      return { error: `Network or unexpected error: ${error.message}` };
    }
    return { error: 'An unexpected network error occurred.' };
  }
}
