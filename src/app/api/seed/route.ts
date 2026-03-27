import { NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Force this route to never be pre-rendered at build time
export const dynamic = 'force-dynamic';

export async function GET() {
  // 1. Listening Test Data
  const listeningTest = {
    id: "listen_test_01",
    type: "listening",
    title: "Cambridge IELTS Listening 1",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    parts: [ /* ... questions ... */]
  };

  // 2. Add Reading Test Data
  const readingTest = {
    id: "read_test_01",
    type: "reading",
    title: "Cambridge IELTS Reading 1",
    passages: [
      {
        title: "The History of Tea",
        text: "Tea is an aromatic beverage historically prepared by pouring hot or boiling water over cured or fresh leaves of Camellia sinensis...",
        questions: [
          { id: "r_q1", number: 1, type: "multiple_choice", text: "What is tea made from?", options: ["Leaves", "Roots", "Bark"], correctAnswer: "Leaves" }
        ]
      }
    ]
  };

  // 3. Add Writing Test Data
  const writingTest = {
    id: "write_test_01",
    type: "writing",
    title: "Cambridge IELTS Writing 1",
    tasks: [
      { id: "w_task1", title: "Task 1", prompt: "The chart below shows the number of men and women in further education in Britain...", type: "academic" },
      { id: "w_task2", title: "Task 2", prompt: "Some people believe that university education should be free for everyone. To what extent do you agree?", type: "essay" }
    ]
  };

  try {
    // Save them to Firebase
    await setDoc(doc(db, 'tests', listeningTest.id), listeningTest);
    await setDoc(doc(db, 'tests', readingTest.id), readingTest);
    await setDoc(doc(db, 'tests', writingTest.id), writingTest);

    return NextResponse.json({ message: "Seed successful!" });
  } catch (err: any) {
    return NextResponse.json({ message: "Seed failed", error: err.message }, { status: 500 });
  }
}
