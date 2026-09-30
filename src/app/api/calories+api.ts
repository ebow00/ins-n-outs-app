import { GoogleGenAI } from '@google/genai';

// Initialize Gemini with the secret server-side environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { foodText } = await request.json();

    if (!foodText || foodText.trim() === '') {
      return Response.json({ invalid: false, calories: 0 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following food description: "${foodText}". 
      Is this realistic food or drink that a human can consume? 
      If it is NOT food or drink (e.g., machinery, non-consumable objects, random text like "Boeing 747 airplane"), respond strictly with the word "INVALID".
      If it IS valid food, calculate the total estimated calories based on standard real-world portions. Respond ONLY with a JSON object in this exact format: {"calories": <number>, "invalid": false}. Do not use markdown blocks.`,
    });

    const rawResult = response.text ? response.text.trim() : '';

    if (rawResult.includes('INVALID') || !rawResult) {
      return Response.json({ invalid: true, calories: 0 });
    }

    const cleanedJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedJson);
    
    return Response.json({ invalid: false, calories: data.calories || 0 });
  } catch (error) {
    console.error("API Route Error:", error);
    return Response.json({ error: 'Failed to process request' }, { status: 500 });
  }
}