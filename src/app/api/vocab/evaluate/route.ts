import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { word, sentence } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Evaluate if the following sentence use the English word "${word}" correctly, naturally, and with proper grammar. 
    Sentence: "${sentence}"
    
    Return a JSON object with:
    - rating: "good" | "acceptable" | "incorrect"
    - feedback: "short feedback explaining why"
    - suggestion: "a better way to say it (if rating isn't good)"`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    return NextResponse.json(JSON.parse(result.response.text()));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
