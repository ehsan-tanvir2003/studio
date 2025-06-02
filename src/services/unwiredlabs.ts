
// src/services/unwiredlabs.ts
'use server';

const UNWIREDLABS_API_URL = 'https://us1.unwiredlabs.com/v2/process.php';

interface UnwiredLabsCell {
  lac: number;
  cid: number;
  psc?: number; // Primary Scrambling Code, optional
}

// This interface was for GET params; if POST is needed, it might change
interface UnwiredLabsRequestParams {
  token: string;
  radio: 'gsm' | 'umts' | 'lte' | 'cdma';
  mcc: number;
  mnc: number; // For GET, this was converted to string. For POST, it's likely number.
  cells: UnwiredLabsCell[];
  address: 0 | 1; // 0 for no address, 1 for address
}

interface UnwiredLabsSuccessResponse {
  status: 'ok';
  balance: number; // Can also be balance_lac, balance_cell etc.
  lat: number;
  lon: number;
  accuracy: number; // in meters
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
  mnc: number, // Kept as number, as it's converted to string for GET query param later
  lac: number,
  cellId: number,
  radioType: 'gsm' | 'umts' | 'lte' | 'cdma' = 'lte'
): Promise<CellTowerLocation | { error: string }> {
  // Simplified and more robust API key check
  if (!apiKey) {
    return { error: 'Unwired Labs API key is not configured. Please set a valid UNWIREDLABS_API_KEY in your .env file.' };
  }

  const cellsPayload = JSON.stringify([{ lac, cid: cellId }]);
  
  // Current implementation uses GET with URL parameters
  const queryParams = new URLSearchParams({
    token: apiKey,
    radio: radioType,
    mcc: mcc.toString(),
    mnc: mnc.toString(), // mnc (number) is converted to string for query param
    cells: cellsPayload,
    address: '1',
  });

  try {
    // This is a GET request
    const response = await fetch(`${UNWIREDLABS_API_URL}?${queryParams.toString()}`); 

    if (!response.ok) {
      try {
        const errorData: UnwiredLabsErrorResponse = await response.json();
        // Provide more context for "Invalid request"
        if (errorData.message && errorData.message.toLowerCase().includes('invalid request')) {
            return { error: `API Error: Invalid request (Status: ${response.status}). This could be due to incorrect parameters, or the API key requiring a different request format (e.g., POST instead of GET), endpoint, or permissions.` };
        }
        return { error: `API Error: ${errorData.message || response.statusText} (Status: ${response.status})` };
      } catch (e) {
        return { error: `API HTTP Error: ${response.statusText} (Status: ${response.status})` };
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
      // Provide more context for "Invalid request" if it comes through here too
      if (errorData.message && errorData.message.toLowerCase().includes('invalid request')) {
          return { error: `API Error: Invalid request. This could be due to incorrect parameters, or the API key requiring a different request format (e.g., POST instead of GET), endpoint, or permissions.` };
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
