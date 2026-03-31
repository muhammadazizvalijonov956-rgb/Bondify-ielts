import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { attemptId } = await req.json();
    if (!attemptId) return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 });

    const attemptRef = doc(db, 'attempts', attemptId);
    const snap = await getDoc(attemptRef);
    if (!snap.exists()) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    const attempt = snap.data();

    if (attempt.progressStored) {
      return NextResponse.json({ success: true, message: 'Already processed', attempt });
    }

    // 1. Generate AI Evaluation
    let aiEvaluation = null;
    let newBand = attempt.estimatedBand || 0;

    if (attempt.section === 'writing' || attempt.section === 'speaking') {
      const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (apiKey) {
        let textInput = attempt.section === 'writing'
          ? attempt.writingResults?.map((r: any) => `Task: ${r.partTitle}\nResponse: ${r.response}`).join('\n\n')
          : attempt.audioTranscript || attempt.answers || 'No input';

        const promptTemplate = `Evaluate this IELTS response.
Task: ${attempt.section}
User Answer: ${textInput}

Give:
1. Estimated band score (0-9)
2. Strengths (2-3 points)
3. Weaknesses (2-3 points)
4. Specific improvements
5. Corrected example (short)

Return JSON format exactly matching:
{
  "band_score": "...",
  "scores": {
    "task_achievement": "...",
    "coherence_cohesion": "...",
    "lexical_resource": "...",
    "grammatical_range": "...",
    "fluency": "...",
    "lexical": "...",
    "grammar": "...",
    "pronunciation": "..."
  },
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvements": ["..."],
  "corrected_sample": "...",
  "feedback": "..."
}`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptTemplate }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          if (geminiData.candidates && geminiData.candidates.length > 0) {
            const jsonText = geminiData.candidates[0].content.parts[0].text;
            try {
              const parsed = JSON.parse(jsonText);
              aiEvaluation = {
                scores: parsed.scores || {
                  task_achievement: parsed.band_score, coherence_cohesion: parsed.band_score,
                  lexical_resource: parsed.band_score, grammatical_range: parsed.band_score
                },
                feedback: parsed.feedback || parsed.improvements?.join(' ') || '',
                band9Version: parsed.corrected_sample || '',
                strengths: parsed.strengths || [],
                weaknesses: parsed.weaknesses || [],
                improvements: parsed.improvements || [],
                bandScore: parsed.band_score
              };
              newBand = parsed.band_score;

              // Save to ai_feedback table
              const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
              await setDoc(doc(db, 'ai_feedback', feedbackId), {
                id: feedbackId,
                user_id: attempt.userId,
                test_id: attempt.testId,
                section: attempt.section,
                input_text: textInput,
                feedback_json: parsed,
                created_at: new Date().toISOString()
              });
            } catch (err) {
              console.error("Failed to parse AI output", err);
            }
          }
        }
      }
    }

    const updates: any = {};
    if (aiEvaluation) {
      updates.aiEvaluation = aiEvaluation;
      updates.estimatedBand = newBand;
      updates.status = 'evaluated';
      attempt.aiEvaluation = aiEvaluation;
      attempt.estimatedBand = newBand;
      attempt.status = 'evaluated';
    }

    // Update user_progress
    const userId = attempt.userId;
    if (userId) {
      const q = query(collection(db, 'attempts'), where('userId', '==', userId), orderBy('submittedAt', 'desc'), limit(50));
      const recentSnaps = await getDocs(q);
      const attemptsList = recentSnaps.docs.map(d => d.id === attemptId ? attempt : d.data());
      // We manually override the current attempt in attemptsList in case it just got evaluated 

      const calcAvg = (sect: string) => {
        const sectAtt = attemptsList.filter((a: any) => a.section === sect && a.estimatedBand !== undefined && a.estimatedBand > 0);
        if (sectAtt.length === 0) return 0;
        const sum = sectAtt.reduce((acc: number, a: any) => acc + (a.estimatedBand || 0), 0);
        return parseFloat((sum / sectAtt.length).toFixed(1));
      };

      const reading_score = calcAvg('reading');
      const listening_score = calcAvg('listening');
      const writing_score = calcAvg('writing');
      const speaking_score = calcAvg('speaking');

      let overall_score = 0;
      let nonZeroCount = 0;
      if (reading_score > 0) { overall_score += reading_score; nonZeroCount++; }
      if (listening_score > 0) { overall_score += listening_score; nonZeroCount++; }
      if (writing_score > 0) { overall_score += writing_score; nonZeroCount++; }
      if (speaking_score > 0) { overall_score += speaking_score; nonZeroCount++; }

      if (nonZeroCount > 0) overall_score = parseFloat((overall_score / nonZeroCount).toFixed(1));

      updates.progressStored = true;
      await updateDoc(attemptRef, updates);

      await setDoc(doc(db, 'user_progress', userId), {
        id: userId,
        user_id: userId,
        exam_type: 'IELTS',
        overall_score,
        reading_score,
        listening_score,
        writing_score,
        speaking_score,
        last_updated: new Date().toISOString()
      }, { merge: true });
    }

    return NextResponse.json({ success: true, attempt: { ...attempt, ...updates } });
  } catch (error) {
    console.error('Evaluate Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
