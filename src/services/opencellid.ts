
'use server';

// Base URL for OpenCellID API
const OPENCELLID_API_URL = 'https://opencellid.org/cell/get';
// An alternative often found: const OPENCELLID_API_URL_UNWIRED = 'https://pro.unwiredlabs.com/v2/process.php';
// For this implementation, we stick to the direct OpenCellID endpoint as requested.

interface OpenCellIDRequestParams {
  key: string;
  mcc: number;
  mnc: number;
  lac: number;
  cellid: number;
  format: 'json' | 'jsonp' | 'xml';
}

interface OpenCellIDSuccessResponse {
  lat: number;
  lon: number;
  mcc?: number;
  mnc?: number;
  lac?: number;
  cellid?: number;
  range: number; // "Accuracy in meters"
  samples?: number;
  unit?: string | null;
  updated?: string;
  created?: string;
  block?: string | null;
  avg_signal?: number;
  stat?: 'ok'; // Sometimes present
  error?: undefined; // Ensure error is not present on success
}

interface OpenCellIDErrorResponse {
  error: string;
  stat: 'error'; // Or 'fail' depending on OpenCellID version
  lat?: undefined;
  lon?: undefined;
}

export type OpenCellIDResponse = OpenCellIDSuccessResponse | OpenCellIDErrorResponse;

export interface CellTowerLocationFromOpenCellID {
  latitude: number;
  longitude: number;
  accuracy: number; // Derived from 'range'
  googleMapsUrl: string;
  // Address is not provided by OpenCellID directly
}

export async function fetchCellTowerLocationFromOpenCellID(
  apiKey: string,
  mcc: number,
  mnc: number,
  lac: number,
  cellId: number
): Promise<CellTowerLocationFromOpenCellID | { error: string }> {
  if (!apiKey || apiKey.trim() === "") {
    return { error: 'OpenCellID API key is not configured. Please set a valid OPENCELLID_API_KEY in your .env file.' };
  }

  const params: OpenCellIDRequestParams = {
    key: apiKey,
    mcc,
    mnc,
    lac,
    cellid: cellId,
    format: 'json',
  };

  const queryString = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString();
  
  const requestUrl = `${OPENCELLID_API_URL}?${queryString}`;
  console.log(`[OpenCellID Service] Requesting URL: ${requestUrl}`);

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok && response.status !== 200) { // OpenCellID might return 200 even for errors in JSON
      // This handles network errors or non-200 responses that aren't OpenCellID JSON errors
      const errorText = await response.text();
      console.error(`[OpenCellID Service] API request failed with status ${response.status}: ${errorText}`);
      return { error: `OpenCellID API request failed with status ${response.status}: ${response.statusText}` };
    }
    
    const responseData: OpenCellIDResponse = await response.json();
    console.log('[OpenCellID Service] Response Data:', responseData);


    if (responseData.error || (responseData as any).stat === 'error' || (responseData as any).stat === 'fail') {
      const errorData = responseData as OpenCellIDErrorResponse;
      let errorMessage = `OpenCellID API Error: ${errorData.error || 'Unknown error from OpenCellID'}`;
      if (errorData.error && errorData.error.toLowerCase().includes("no matches found for query")) {
        errorMessage = 'No location data found for the provided Cell ID, LAC, and operator combination in the OpenCellID database.';
      } else if (errorData.error && errorData.error.toLowerCase().includes("specify api key") ) {
        errorMessage = 'OpenCellID API Key is invalid or missing. Please check your configuration.';
      }
      return { error: errorMessage };
    }
    
    // Check if lat and lon are present, as successful responses might still lack coordinates
    if (typeof responseData.lat !== 'number' || typeof responseData.lon !== 'number') {
        // This can happen if OpenCellID technically finds a cell but has no coords, or a malformed success response
        if ((responseData as any).message && (responseData as any).message.toLowerCase().includes("no matches found for query")) {
             return { error: 'No location data found for the provided Cell ID, LAC, and operator combination in the OpenCellID database.' };
        }
        console.warn('[OpenCellID Service] Response successful but missing coordinates:', responseData);
        return { error: 'OpenCellID returned a response without coordinates for the given cell.' };
    }

    const successData = responseData as OpenCellIDSuccessResponse;
    return {
      latitude: successData.lat,
      longitude: successData.lon,
      accuracy: successData.range, // Using 'range' as accuracy
      googleMapsUrl: `https://www.google.com/maps?q=${successData.lat},${successData.lon}`,
    };

  } catch (error) {
    console.error('[OpenCellID Service] Error fetching cell tower location:', error);
    let errorMessage = 'Network or unexpected error during OpenCellID API call.';
    if (error instanceof Error) {
      errorMessage = `OpenCellID Network/Parsing Error: ${error.message}`;
    }
    return { error: errorMessage };
  }
}
