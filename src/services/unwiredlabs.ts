
// src/services/unwiredlabs.ts
'use server';

const UNWIREDLABS_API_URL = 'https://us1.unwiredlabs.com/v2/process.php';

interface UnwiredLabsCell {
  lac: number;
  cid: number;
  psc?: number; // Primary Scrambling Code, optional
}

interface UnwiredLabsRequestBody {
  token: string;
  radio: 'gsm' | 'umts' | 'lte' | 'cdma';
  mcc: number;
  mnc: number; // Ensure this is a number in the JSON
  cells: UnwiredLabsCell[];
  address: 0 | 1; // 0 for false, 1 for true (request address)
}

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
  help?: string; // To capture the API's help message
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
  mcc: number, // Received as number
  mnc: number, // Received as number
  lac: number, // Received as number
  cellId: number, // Received as number
  radioType: 'gsm' | 'umts' | 'lte' | 'cdma' = 'lte'
): Promise<CellTowerLocation | { error: string }> {
  if (!apiKey) {
    return { error: 'Unwired Labs API key is not configured. Please set a valid UNWIREDLABS_API_KEY in your .env file.' };
  }

  const requestBody: UnwiredLabsRequestBody = {
    token: apiKey,
    radio: radioType,
    mcc: mcc,
    mnc: mnc, // mnc is already a number here
    cells: [{
      lac: lac,
      cid: cellId,
      // psc: 0 // psc is not collected from the form yet
    }],
    address: 1, // Request address details
  };

  try {
    const response = await fetch(UNWIREDLABS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseData: UnwiredLabsResponse = await response.json();

    if (responseData.status === 'ok') {
      const successData = responseData as UnwiredLabsSuccessResponse;
      return {
        latitude: successData.lat,
        longitude: successData.lon,
        accuracy: successData.accuracy,
        address: successData.address,
        googleMapsUrl: `https://www.google.com/maps?q=${successData.lat},${successData.lon}`,
      };
    } else {
      // Handle error responses
      const errorData = responseData as UnwiredLabsErrorResponse;
      let errorMessage = `API Error: ${errorData.message || 'Unknown error from Unwired Labs'}`;
      if (errorData.balance !== undefined) {
        errorMessage += ` (Balance: ${errorData.balance})`;
      }
      if (errorData.help) {
        errorMessage += `. API Help: "${errorData.help}"`;
      }
      if (errorData.message && errorData.message.toLowerCase().includes('no matches found')) {
        return { error: 'No location data found for the provided Cell ID and LAC with the selected operator.'  + (errorData.balance !== undefined ? ` (Balance: ${errorData.balance})` : '')};
      }
      return { error: errorMessage };
    }
  } catch (error) {
    console.error('Error fetching cell tower location:', error);
    let errorMessage = 'Network or unexpected error during API call.';
    if (error instanceof Error) {
      errorMessage = `Network or unexpected error: ${error.message}`;
    }
    return { error: errorMessage };
  }
}
