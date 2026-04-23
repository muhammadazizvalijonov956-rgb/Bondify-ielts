import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function callGeminiAI(prompt: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" } 
  });

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (e) {
    console.error("AI Error:", e);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { count, level, weakWords, sessionId } = await req.json();

    const prompt = `Generate ${count} IELTS vocabulary questions. Difficulty: Level ${level}.
    Words to include: ${weakWords?.join(', ')}.
    Return JSON format: { "questions": [{ "word": "string", "text": "question text", "options": ["A", "B", "C", "D"], "correctAnswer": "string", "difficulty": ${level} }] }`;

    const aiData = await callGeminiAI(prompt);

    if (!aiData || !aiData.questions) {
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    // This ensures the session is saved in Firestore exactly where the frontend looks for it
    if (sessionId) {
      const today = new Date().toISOString().split('T')[0];
      await setDoc(doc(db, "daily_sessions", sessionId), {
        questions: aiData.questions,
        userId: sessionId.split('_')[0],
        date: today,
        completed: false,
        score: 0,
        currentIndex: 0
      });
    }

    return NextResponse.json({ questions: aiData.questions });

  } catch (error) {
    console.error("Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
