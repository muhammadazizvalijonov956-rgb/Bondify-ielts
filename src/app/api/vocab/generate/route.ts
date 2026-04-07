import { NextRequest, NextResponse } from 'next/server';
import { generateVocabularyQuestions } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { count, level, weakWords } = await req.json();

    if (!count || !level) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const data = await generateVocabularyQuestions(count, level, weakWords || []);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error generating vocabulary questions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
