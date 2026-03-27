import { UserProfile } from "@/types";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase/config";

export function calculateStreak(profile: UserProfile): { newStreak: number, shouldUpdate: boolean } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  if (!profile.lastActiveDate) {
    return { newStreak: 1, shouldUpdate: true };
  }

  const lastActive = new Date(profile.lastActiveDate);
  const lastActiveDay = profile.lastActiveDate.split('T')[0];

  if (lastActiveDay === today) {
    return { newStreak: profile.currentStreak || 0, shouldUpdate: false };
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDay = yesterday.toISOString().split('T')[0];

  if (lastActiveDay === yesterdayDay) {
    return { newStreak: (profile.currentStreak || 0) + 1, shouldUpdate: true };
  }

  // Streak broken
  return { newStreak: 1, shouldUpdate: true };
}

export async function updateActivity(profile: UserProfile) {
  const { newStreak, shouldUpdate } = calculateStreak(profile);
  if (shouldUpdate) {
    await updateDoc(doc(db, 'users', profile.uid), {
      currentStreak: newStreak,
      lastActiveDate: new Date().toISOString()
    });
  }
}
