import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:8081',
    'X-Title': 'Gastro Tracker App',
  }
});

export async function POST(request: Request) {
  try {
    const { foodText } = await request.json();
    console.log(`\n[API] 1. Received input: "${foodText}"`);

    if (!foodText || foodText.trim() === '') {
      return Response.json({ invalid: false, calories: 0 });
    }

    const prompt = `You are a strict data parser. Analyze this input: "${foodText}".
    Step 1: If the text is in Hebrew or another non-English language, translate it to English internally (e.g., "ביצת עין" is a fried egg, "פיתה" is a pita bread).
    Step 2: Determine if the translated text represents realistic consumable food or drink.
    Step 3: If it is NOT food (e.g., machinery, bodily waste, random letters), output exactly the word INVALID and nothing else.
    Step 4: If it IS food, calculate the total estimated calories.
    Step 5: Respond ONLY with a valid JSON object in this exact format: {"calories": <number>, "invalid": false}. Do not include markdown formatting or conversational text.`;

    console.log(`[API] 2. Querying OpenRouter...`);
    const chatCompletion = await openai.chat.completions.create({
      model: 'openrouter/free', 
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0,
    });

    const rawResult = chatCompletion.choices[0]?.message?.content?.trim() || '';
    console.log(`[API] 3. AI Raw Response:`, rawResult);

    if (rawResult.includes('INVALID') || !rawResult.includes('{')) {
      console.log(`[API] 4. Handled as INVALID.`);
      return Response.json({ invalid: true, calories: 0 });
    }

    const cleanedJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let data;
    try {
      data = JSON.parse(cleanedJson);
      console.log(`[API] 5. Successfully parsed JSON:`, data);
    } catch (parseError) {
      console.log(`[API] 5. JSON Parse Failed. AI returned bad format.`);
      return Response.json({ invalid: true, calories: 0 });
    }
    
    return Response.json({ invalid: false, calories: data.calories || 0 });
  } catch (error) {
    console.error("[API] Fatal Route Error:", error);
    return Response.json({ error: 'Failed to process request with OpenRouter' }, { status: 500 });
  }
}