import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; // Ensure this path is correct for your project
import { doc, setDoc } from 'firebase/firestore';

// Placeholder for your Gemini AI logic
// You need to make sure this function is imported or defined
async function callGeminiAI(prompt: string) {
  // This should contain your actual Gemini API fetch logic
  // For now, I'm assuming it returns { questions: [...] }
  return null; 
}

export async function POST(req: Request) {
  try {
    const { title, type, short_note, sessionId } = await req.json();

    const prompt = `Generate an IELTS Vocabulary game based on: ${title}. ${short_note}`;

    // 1. Call the AI inside the async function
    const aiResponse = await callGeminiAI(prompt);

    // 2. The Safety Check (Prevents the "undefined" Firebase error)
    if (!aiResponse || !aiResponse.questions) {
       // Instead of throwing a raw error, we return a clean JSON error to the frontend
       return NextResponse.json(
         { error: "AI failed to generate questions. Check Gemini API Key." }, 
         { status: 500 }
       );
    }

    // 3. Save to Firebase now that we KNOW questions exist
    if (sessionId) {
      await setDoc(doc(db, "daily_sessions", sessionId), {
        questions: aiResponse.questions,
        createdAt: new Date().toISOString(),
        type: type,
        title: title
      });
    }

    return NextResponse.json({ 
      ai_content: "Success", 
      questions: aiResponse.questions 
    });

  } catch (error) {
    console.error("Failed to generate AI content", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
