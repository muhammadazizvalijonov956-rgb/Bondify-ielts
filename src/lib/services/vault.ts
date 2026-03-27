import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';

export interface VaultWord {
  word: string;
  userId: string;
  count: number;
  addedAt: string;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  level: number; // Leitner level (0-7)
  status: 'active' | 'mastered';
}

export async function addToVault(userId: string, word: string) {
  const cleanWord = word.trim().toLowerCase().replace(/[^a-z-]/g, '');
  if (!cleanWord || cleanWord.length < 2) return;

  const wordId = `${userId}_${cleanWord}`;
  const wordRef = doc(db, 'vault', wordId);
  const snap = await getDoc(wordRef);

  if (snap.exists()) {
    await updateDoc(wordRef, {
      count: increment(1),
      lastSeenAt: new Date().toISOString()
    });
  } else {
    const newWord: VaultWord = {
      word: cleanWord,
      userId,
      count: 1,
      addedAt: new Date().toISOString(),
      lastReviewedAt: null,
      nextReviewAt: new Date().toISOString(),
      level: 0,
      status: 'active'
    };
    await setDoc(wordRef, newWord);
  }
}

export async function getDueWords(userId: string) {
  const vaultRef = collection(db, 'vault');
  const q = query(
    vaultRef, 
    where('userId', '==', userId), 
    where('nextReviewAt', '<=', new Date().toISOString()),
    where('status', '==', 'active')
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as VaultWord);
}

const LEITNER_INTERVALS = [0, 1, 2, 4, 7, 14, 30, 60]; // Days

export async function reviewWord(userId: string, word: string, correct: boolean) {
  const wordId = `${userId}_${word.toLowerCase()}`;
  const wordRef = doc(db, 'vault', wordId);
  const snap = await getDoc(wordRef);

  if (!snap.exists()) return;
  const data = snap.data() as VaultWord;

  let newLevel = correct ? data.level + 1 : 0;
  if (newLevel >= LEITNER_INTERVALS.length) {
    await updateDoc(wordRef, {
      status: 'mastered',
      lastReviewedAt: new Date().toISOString(),
      level: LEITNER_INTERVALS.length - 1
    });
    return;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + LEITNER_INTERVALS[newLevel]);

  await updateDoc(wordRef, {
    level: newLevel,
    lastReviewedAt: new Date().toISOString(),
    nextReviewAt: nextReviewDate.toISOString()
  });
}
