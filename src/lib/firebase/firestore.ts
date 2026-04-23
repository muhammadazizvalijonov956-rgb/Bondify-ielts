import { collection, doc, setDoc, getDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from './config';

// ADD THIS LINE BELOW THE IMPORTS:
export { db }; 

// ... rest of your interfaces and functions (UserProfile, saveAttempt, etc.)

// User Schema (users collection)
export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

// Test Schema (tests collection)
export interface Test {
  id: string;
  type: 'listening' | 'reading' | 'writing' | 'speaking' | 'full';
  title: string;
  audioUrl?: string; // For listening
  instructions: string;
  parts: TestPart[];
  createdAt: string;
}

export interface TestPart {
  partIndex: number;
  title: string;
  transcript?: string;
  questions: Question[];
}

export interface Question {
  id: string;
  number: number;
  type: 'multiple_choice' | 'short_answer' | 'note_completion';
  text: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
}

// Attempt Schema (attempts collection)
export interface Attempt {
  id: string;
  userId: string;
  testId: string;
  section: string;
  startedAt: string;
  submittedAt: string;
  rawScore: number;
  estimatedBand: number;
}

// Answer Schema (answers collection - optional if we store answers within attempt for convenience)
// For now, let's store answers as map inside Attempt to save writes, or separate sub-collection if large

export async function saveAttempt(attempt: Attempt, answers: Record<string, string>) {
  const attemptRef = doc(collection(db, 'attempts'), attempt.id);
  await setDoc(attemptRef, {
    ...attempt,
    answers,
    timestamp: Timestamp.now()
  });
}

export async function getRandomTest(type: string): Promise<Test | null> {
  const q = query(collection(db, 'tests'), where('type', '==', type));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;

  // Simple random selector from fetched tests
  const tests = snapshot.docs.map(doc => doc.data() as Test);
  const randomIndex = Math.floor(Math.random() * tests.length);
  return tests[randomIndex];
}
