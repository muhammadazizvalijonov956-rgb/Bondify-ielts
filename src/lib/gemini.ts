import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateUpdateContent(title: string, type: string, shortNote: string) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
  });

  const prompt = `You are a professional product manager writing a system update for an IELTS preparation platform called Bondify.
  
  Title: ${title}
  Type: ${type}
  User Notes: ${shortNote}
  
  Task: Generate a professional, engaging, and clear update description (3-5 sentences).
  - Use an encouraging tone.
  - Highlight the benefit to the student.
  - If it's a "fix", be transparent but positive.
  - If it's a "new" feature, make it sound exciting.
  - Do not use placeholders.
  - Return only the generated text.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}
