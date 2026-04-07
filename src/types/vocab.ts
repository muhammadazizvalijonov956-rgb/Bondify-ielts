export type QuestionType =
  | 'context_fill'
  | 'synonym_match'
  | 'meaning_selection'
  | 'error_correction'
  | 'collocation';

export type WordStatus = 'new' | 'learning' | 'weak' | 'strong' | 'mastered' | 'forgotten';

export interface VocabQuestion {
  id: string;
  word: string;
  questionType: QuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
  explanation: string;
  exampleSentence: string;
  difficulty: number;
  tags: string[];
}

export interface UserVocabProgress {
  userId: string;
  word: string;
  correctCount: number;
  wrongCount: number;
  masteryLevel: number; // 0-100
  status: WordStatus;
  lastSeenAt: string;
  nextReviewAt: string;
}

export interface DailySession {
  id: string;
  userId: string;
  date: string; // ISO string representing YYYY-MM-DD
  questions: VocabQuestion[];
  currentIndex: number;
  score: number;
  completed: boolean;
  level: number;
  weakWordsGenerated?: string[];
  stats?: {
    correct: number;
    total: number;
    accuracy: number;
    bandScore: number;
  };
  editedByAdmin?: boolean;
  updatedAt?: any;
}

export interface ReviewQueueItem {
  id: string;
  userId: string;
  word: string;
  dueAt: string;
}

export interface VocabStats {
  todayScore: number;
  streak: number;
  weakWordsCount: number;
  masteredWordsCount: number;
  currentLevel: number;
  reviewDueCount: number;
  xp: number;
}
