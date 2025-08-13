

import type { PinData } from '../types';

// Custom error class to include status
class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}


// This function now calls OUR backend, not Google's.
export async function generatePinContent(
    imageBase64: string,
    mimeType: string,
    existingBoards: string
): Promise<PinData> {
  
  try {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            imageBase64,
            mimeType,
            existingBoards,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `API request failed with status ${response.status}` }));
        throw new ApiError(errorData.message, response.status);
    }

    const result = await response.json();
    return result as PinData;

  } catch (error) {
    console.error("Error calling generation API route:", error);
    if (error instanceof ApiError) {
        throw error;
    }
    throw new Error("An unknown error occurred while generating content.");
  }
}
