import { db } from './config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
  increment,
  arrayUnion,
  deleteDoc
} from 'firebase/firestore';
import {
  DailySession,
  UserVocabProgress,
  VocabQuestion,
  ReviewQueueItem
} from '@/types/vocab';

export async function getUserVocabProgress(userId: string): Promise<UserVocabProgress[]> {
  const q = query(collection(db, 'vocab_progress'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as UserVocabProgress);
}

export async function getWeakWords(userId: string, limit_count: number = 10): Promise<string[]> {
  const q = query(
    collection(db, 'vocab_progress'),
    where('userId', '==', userId),
    where('status', '==', 'weak'),
    limit(limit_count)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => (doc.data() as UserVocabProgress).word);
}

export async function getReviewQueue(userId: string, limit_count: number = 10): Promise<string[]> {
  const now = new Date().toISOString();
  const q = query(
    collection(db, 'vocab_progress'),
    where('userId', '==', userId),
    where('nextReviewAt', '<=', now),
    limit(limit_count)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => (doc.data() as UserVocabProgress).word);
}

export async function saveDailySession(session: DailySession) {
  const sessionRef = doc(db, 'daily_sessions', session.id);
  await setDoc(sessionRef, {
    ...session,
    updatedAt: Timestamp.now()
  });
}

export async function getDailySession(userId: string, date: string): Promise<DailySession | null> {
  const q = query(
    collection(db, 'daily_sessions'),
    where('userId', '==', userId),
    where('date', '==', date)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as DailySession;
}

export async function updateWordProgress(userId: string, word: string, correct: boolean, difficulty: number) {
  const progressId = `${userId}_${word}`;
  const progressRef = doc(db, 'vocab_progress', progressId);
  const progressDoc = await getDoc(progressRef);

  const now = new Date();
  let nextReviewAt = new Date();

  if (progressDoc.exists()) {
    const data = progressDoc.data() as UserVocabProgress;
    const newMastery = correct ? Math.min(100, data.masteryLevel + 10) : Math.max(0, data.masteryLevel - 15);

    // Spaced repetition interval (very simple version for MVP)
    const intervalDays = correct ? Math.pow(2, Math.floor(newMastery / 20)) : 1;
    nextReviewAt.setDate(now.getDate() + intervalDays);

    let status = data.status;
    if (newMastery >= 90) status = 'mastered';
    else if (newMastery >= 70) status = 'strong';
    else if (newMastery >= 40) status = 'learning';
    else status = 'weak';

    if (!correct && data.status === 'mastered') status = 'forgotten';
    else if (!correct) status = 'weak';

    await updateDoc(progressRef, {
      correctCount: increment(correct ? 1 : 0),
      wrongCount: increment(correct ? 0 : 1),
      masteryLevel: newMastery,
      status: status,
      lastSeenAt: now.toISOString(),
      nextReviewAt: nextReviewAt.toISOString()
    });
  } else {
    // New word
    const mastery = correct ? 20 : 0;
    const intervalDays = correct ? 1 : 0;
    nextReviewAt.setDate(now.getDate() + intervalDays);

    const newProgress: UserVocabProgress = {
      userId,
      word,
      correctCount: correct ? 1 : 0,
      wrongCount: correct ? 0 : 1,
      masteryLevel: mastery,
      status: correct ? 'learning' : 'weak',
      lastSeenAt: now.toISOString(),
      nextReviewAt: nextReviewAt.toISOString()
    };
    await setDoc(progressRef, newProgress);
  }
}

export async function getUserVocabLevel(userId: string): Promise<number> {
  const levelRef = doc(db, 'vocab_levels', userId);
  const snap = await getDoc(levelRef);
  if (snap.exists()) {
    return snap.data().level;
  }
  return 2; // Default level
}

export async function completeDailySession(session: DailySession) {
  const sessionRef = doc(db, 'daily_sessions', session.id);
  
  const total = session.questions.length;
  const correct = session.score;
  const accuracy = Math.round((correct / total) * 100);
  const bandScore = Math.round(((correct / total) * 9) * 2) / 2;

  await updateDoc(sessionRef, {
    completed: true,
    score: session.score,
    stats: {
      correct,
      total,
      accuracy,
      bandScore
    },
    updatedAt: Timestamp.now()
  });

  // Calculate difficulty adjustment
  const levelRef = doc(db, 'vocab_levels', session.userId);
  let currentLevel = session.level;
  if (accuracy >= 80) {
    currentLevel = Math.min(4, currentLevel + 1);
  } else if (accuracy < 50) {
    currentLevel = Math.max(1, currentLevel - 1);
  }

  await setDoc(levelRef, {
    level: currentLevel,
    lastUpdate: new Date().toISOString()
  }, { merge: true });
}

export async function getSessionById(sessionId: string): Promise<DailySession | null> {
  const docRef = doc(db, 'daily_sessions', sessionId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as DailySession;
}

export async function updateSession(sessionId: string, data: Partial<DailySession>) {
  const docRef = doc(db, 'daily_sessions', sessionId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now()
  });
}

export async function sendEmailResult(sessionId: string) {
  const response = await fetch('/api/vocab/send-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });
  return await response.json();
}
