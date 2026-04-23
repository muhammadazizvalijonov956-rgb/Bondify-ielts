import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Updated Helper Function with real logic
async function callGeminiAI(prompt: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    return null;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" } // Ensures JSON output
  });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text); 
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // 2. Extract the actual data sent by the Vocab Game
    const { count, level, weakWords, sessionId } = await req.json();

    // 3. Construct a prompt that asks for JSON specifically
    const prompt = `Generate ${count || 10} IELTS vocabulary questions. 
    Difficulty Level: ${level || 2}. 
    Focus words: ${weakWords ? weakWords.join(', ') : 'common IELTS academic words'}.
    Return ONLY a JSON object with this structure: 
    { "questions": [{ "id": "string", "text": "string", "options": ["string"], "correctAnswer": "string" }] }`;

    const aiResponse = await callGeminiAI(prompt);

    // 4. The Safety Check (triggers the 500 if AI fails)
    if (!aiResponse || !aiResponse.questions) {
      return NextResponse.json(
        { error: "AI failed to generate questions. Check API Key and Logs." }, 
        { status: 500 }
      );
    }

    // 5. Firebase Logic
    if (sessionId) {
      await setDoc(doc(db, "daily_sessions", sessionId), {
        questions: aiResponse.questions,
        level: level,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ 
      success: true, 
      questions: aiResponse.questions 
    });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
