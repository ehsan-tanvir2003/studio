
// src/services/unwiredlabs.ts
'use server';

const UNWIREDLABS_API_URL = 'https://us1.unwiredlabs.com/v2/process.php';

interface UnwiredLabsCell {
  lac: number;
  cid: number;
  psc?: number; // Primary Scrambling Code, optional
}

interface UnwiredLabsRequestParams {
  token: string;
  radio: 'gsm' | 'umts' | 'lte' | 'cdma';
  mcc: number;
  mnc: number;
  cells: UnwiredLabsCell[];
  address: 0 | 1; // 0 for no address, 1 for address
}

interface UnwiredLabsSuccessResponse {
  status: 'ok';
  balance: number; // Can also be balance_lac, balance_cell etc.
  lat: number;
  lon: number;
  accuracy: number; // in meters
  address?: string; // Added optional address field
  // There might be other fields depending on the request
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
  address?: string; // Added optional address field
  googleMapsUrl: string;
}

export async function fetchCellTowerLocation(
  apiKey: string,
  mcc: number,
  mnc: number,
  lac: number,
  cellId: number,
  radioType: 'gsm' | 'umts' | 'lte' | 'cdma' = 'lte' // Default to 'lte'
): Promise<CellTowerLocation | { error: string }> {
  if (!apiKey || apiKey === 'your_unwired_labs_api_key_here' || apiKey === 'pk.4da7f32fbfa2798c6fda0ce376a1e050') {
    return { error: 'Unwired Labs API key is not configured or is invalid. Please set a valid UNWIREDLABS_API_KEY in your .env file.' };
  }

  const cellsPayload = JSON.stringify([{ lac, cid: cellId }]);
  const queryParams = new URLSearchParams({
    token: apiKey,
    radio: radioType,
    mcc: mcc.toString(),
    mnc: mnc.toString(),
    cells: cellsPayload,
    address: '1', // Request address information
  });

  try {
    const response = await fetch(`${UNWIREDLABS_API_URL}?${queryParams.toString()}`);
    if (!response.ok) {
      // Try to parse error from Unwired Labs if possible
      try {
        const errorData: UnwiredLabsErrorResponse = await response.json();
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
        address: successData.address, // Include address in the result
        googleMapsUrl: `https://www.google.com/maps?q=${successData.lat},${successData.lon}`,
      };
    } else {
      const errorData = data as UnwiredLabsErrorResponse;
      // User-friendly message for common "no matches" error
      if (errorData.message && errorData.message.toLowerCase().includes('no matches found')) {
        return { error: 'No location data found for the provided Cell ID and LAC with the selected operator.' };
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

