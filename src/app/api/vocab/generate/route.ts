import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firestore'; 
import { doc, setDoc } from 'firebase/firestore';

// 1. Helper function (Define this OUTSIDE the POST function)
async function callGeminiAI(prompt: string) {
  // Replace this with your actual Gemini fetch logic later
  // For now, we return null so the safety check catches it instead of crashing
  return null; 
}

export async function POST(req: Request) {
  try {
    const { title, type, short_note, sessionId } = await req.json();

    const prompt = `Write a professional product update for an IELTS preparation platform.
    Title: ${title}
    Type: ${type}
    Details: ${short_note}`;

    // 2. ALL logic using 'await' must be INSIDE these curly braces
    const aiResponse = await callGeminiAI(prompt);

    // 3. The Safety Check
    if (!aiResponse || !aiResponse.questions) {
      return NextResponse.json(
        { error: "AI failed to generate questions. Check Gemini API Key." }, 
        { status: 500 }
      );
    }

    // 4. Firebase Logic
    if (sessionId) {
      await setDoc(doc(db, "daily_sessions", sessionId), {
        questions: aiResponse.questions,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ai_content: "Success", questions: aiResponse.questions });

  } catch (error) {
    console.error("Failed to generate AI content", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} // <--- Everything must be ABOVE this closing bracket
