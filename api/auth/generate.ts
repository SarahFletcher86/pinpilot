

import { GoogleGenAI, Type } from "@google/genai";
import type { PinData } from '../types';

// Vercel Edge functions are fast and efficient
export const config = {
  runtime: 'edge',
};

// The schema for the expected JSON response from the AI
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { 
      type: Type.STRING, 
      description: "A catchy, keyword-rich title for the pin (max 100 characters)." 
    },
    description: { 
      type: Type.STRING, 
      description: "A detailed, engaging, and SEO-friendly description (200-500 characters) that encourages clicks."
    },
    tags: {
      type: Type.ARRAY,
      description: "A list of 5-10 relevant and popular hashtags, without the '#' symbol.",
      items: { type: Type.STRING }
    },
    board: { 
      type: Type.STRING, 
      description: "The name of the best board for this pin. This should be an exact match from the user's existing boards if one is suitable, otherwise, it should be a new, relevant board name."
    }
  },
  required: ["title", "description", "tags", "board"]
};


// This is our new backend function
export default async function handler(req: Request) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { imageBase64, mimeType, existingBoards } = await req.json();

    if (!imageBase64 || !mimeType || !existingBoards) {
        return new Response(JSON.stringify({ message: 'Missing required parameters.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // This is the CRITICAL part. process.env.API_KEY is read securely on the server.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      // Use 401 for Unauthorized access due to missing key
      return new Response(JSON.stringify({ message: 'API key is not configured.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert Pinterest marketing strategist specializing in SEO. Analyze the provided image and the list of existing Pinterest boards: "${existingBoards}". Based on the image content, generate a JSON object for a new, high-performing Pinterest pin.`;

    const imagePart = { inlineData: { data: imageBase64, mimeType: mimeType } };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        }
    });

    // Send the AI's response back to the frontend
    return new Response(response.text, { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("Error in API route:", error);
    // Google's API can return errors with a specific structure
    if (error.message && error.message.includes('API key not valid')) {
       return new Response(JSON.stringify({ message: 'The provided API Key is invalid.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ message: error.message || 'An internal server error occurred.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
