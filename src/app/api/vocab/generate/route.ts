
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, type, short_note } = await req.json();

    const prompt = `Write a professional product update for an IELTS preparation platform.

Title: ${title}
Type: ${type}
Details: ${short_note}

Rules:
* Keep it clear and professional
* Maximum 5 sentences
* No emojis
* Focus on user benefit
* Sound like a real SaaS product update`;

    // Note for Future Implementation: Connect to OpenAI / Gemini here
    // Example: const response = await openai.chat.completions.create({ messages: [{ role: 'user', content: prompt }] })

    // Temporary Fallback Formatter
    const cleanType = type === 'new' ? 'New Feature' : 
                      type === 'improvement' ? 'System Improvement' : 
                      type === 'fix' ? 'Bug Fix' : 'Announcement';

    const mockResponse = `We are excited to announce a ${cleanType?.toLowerCase()} regarding ${title}. ${short_note} This update is designed to directly enhance your preparation experience and streamline your study workflow. We remain committed to providing the most effective tools for your IELTS success.`;

    // Add a slight delay to simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    return NextResponse.json({ ai_content: mockResponse });
  } catch (error) {
    console.error("Failed to generate AI content", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
// Inside your generate function
const aiResponse = await callGeminiAI(prompt); 

// ADD THIS CHECK:
if (!aiResponse || !aiResponse.questions) {
  throw new Error("AI failed to generate questions. Check API Key configuration.");
}

// Then proceed to Firebase
await setDoc(doc(db, "daily_sessions", sessionId), {
  questions: aiResponse.questions, // This won't be undefined anymore
  // ...
});
