export interface UserProfile {
  uid: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  username: string;
  profilePhotoUrl: string | null;
  role: 'user' | 'admin';
  accountTier: 'free' | 'go' | 'plus' | 'pro';
  tokenBalance: number;
  referralCode: string;
  referredBy: string | null;
  successfulReferralCount: number;
  leaderboardStats?: {
    totalScore: number;
    testsCompleted: number;
    averageBand: number;
  };
  emailVerified: boolean;
  phoneVerified: boolean;
  lastChallengeDate: string | null; // ISO Date of last completed daily challenge
  currentStreak: number;
  lastActiveDate: string | null; // ISO Date of last activity to calculate streaks
  targetBand?: number;
  badges: string[]; // List of earned badge IDs
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  benefits: string[];
  active: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  bannerImageUrl: string | null;
  eligibility: 'public' | 'premium-only';
  prizePool: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  winners: string[]; // array of userIds
  participants: string[]; // array of userIds
  createdAt: string;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  relatedId?: string;
  createdAt: string;
}

export * from './vocab';
