import { NextRequest, NextResponse } from 'next/server';
import { generateUpdateContent } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { title, type, short_note } = await req.json();

    if (!title || !short_note) {
      return NextResponse.json({ error: 'Title and short_note are required' }, { status: 400 });
    }

    const aiContent = await generateUpdateContent(title, type, short_note);

    return NextResponse.json({ ai_content: aiContent });
  } catch (error: any) {
    console.error('Error in updates generation API:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
