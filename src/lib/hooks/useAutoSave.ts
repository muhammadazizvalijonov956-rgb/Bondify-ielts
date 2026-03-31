import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export type SaveStatus = 'Saving...' | 'Saved' | 'Offline - saved locally' | '';

interface AutoSaveData {
  answers: Record<string, string>;
  section: string;
  last_question: number; // Used for activePartIndex
  updated_at: number;
}

export function useAutoSave({
  testId,
  userId,
  section,
  initialAnswers = {},
}: {
  testId: string | undefined;
  userId: string | undefined;
  section: string;
  initialAnswers?: Record<string, string>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('');
  const [showRecoverPrompt, setShowRecoverPrompt] = useState(false);
  const [recoveredData, setRecoveredData] = useState<AutoSaveData | null>(null);

  const localKey = testId ? `test_${testId}` : '';
  const isOnlineRef = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load: Check localStorage
  useEffect(() => {
    if (!localKey) return;
    const localDataStr = localStorage.getItem(localKey);
    if (localDataStr) {
      try {
        const data: AutoSaveData = JSON.parse(localDataStr);
        // Only recover if there is data and it's from the same section
        if (data && data.section === section && (Object.keys(data.answers || {}).length > 0)) {
          setRecoveredData(data);
          setShowRecoverPrompt(true);
        }
      } catch (err) {
        console.error("Failed to parse local test data", err);
      }
    }
    
    const handleOnline = () => { isOnlineRef.current = true; syncWithBackend(); };
    const handleOffline = () => { isOnlineRef.current = false; setSaveStatus('Offline - saved locally'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [localKey, section]);

  const handleRecover = (continueTest: boolean) => {
    if (continueTest && recoveredData) {
      if (recoveredData.answers) setAnswers(recoveredData.answers);
      if (recoveredData.last_question !== undefined) setActivePartIndex(recoveredData.last_question);
      setSaveStatus('Saved');
    } else {
      clearAutoSave();
    }
    setShowRecoverPrompt(false);
    setRecoveredData(null);
  };

  const clearAutoSave = useCallback(() => {
    if (!localKey) return;
    localStorage.removeItem(localKey);
  }, [localKey]);

  const saveLocally = useCallback((newAnswers: Record<string, string>, partIndex: number) => {
    if (!localKey) return;
    const data: AutoSaveData = {
      answers: newAnswers,
      section,
      last_question: partIndex,
      updated_at: Date.now()
    };
    localStorage.setItem(localKey, JSON.stringify(data));
  }, [localKey, section]);

  const saveToBackend = useCallback(async (newAnswers: Record<string, string>, partIndex: number) => {
    if (!userId || !testId || !isOnlineRef.current) {
      if (!isOnlineRef.current) setSaveStatus('Offline - saved locally');
      return;
    }
    try {
      const sessionId = `${userId}_${testId}`;
      const sessionRef = doc(db, 'test_sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      const payload = {
        user_id: userId,
        test_id: testId,
        answers: newAnswers,
        section,
        last_question: partIndex,
        completed: false,
        updated_at: serverTimestamp(),
      };

      if (sessionSnap.exists()) {
        await updateDoc(sessionRef, payload);
      } else {
        await setDoc(sessionRef, payload);
      }
      setSaveStatus('Saved');
    } catch (err) {
      console.error("Backend save failed:", err);
      // Fallback gracefully
      setSaveStatus('Offline - saved locally');
    }
  }, [userId, testId, section]);

  const syncWithBackend = useCallback(() => {
    if (!localKey) return;
    const localDataStr = localStorage.getItem(localKey);
    if (localDataStr) {
      try {
        const data = JSON.parse(localDataStr);
        saveToBackend(data.answers, data.last_question);
      } catch (err) {}
    }
  }, [localKey, saveToBackend]);

  const triggerAutoSave = useCallback((newAnswers: Record<string, string>, partIndex: number) => {
    saveLocally(newAnswers, partIndex);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    if (!isOnlineRef.current) {
      setSaveStatus('Offline - saved locally');
      return;
    }
    
    setSaveStatus('Saving...');
    debounceTimer.current = setTimeout(() => {
      saveToBackend(newAnswers, partIndex);
    }, 1000);
  }, [saveLocally, saveToBackend]);

  const updateAnswer = useCallback((qId: string, value: string) => {
    setAnswers(prev => {
      const updated = { ...prev, [qId]: value };
      triggerAutoSave(updated, activePartIndex);
      return updated;
    });
  }, [triggerAutoSave, activePartIndex]);

  const updateActivePart = useCallback((idx: number) => {
    setActivePartIndex(idx);
    triggerAutoSave(answers, idx);
  }, [triggerAutoSave, answers]);

  const markCompleted = useCallback(async () => {
    clearAutoSave();
    if (userId && testId && isOnlineRef.current) {
      try {
        const sessionId = `${userId}_${testId}`;
        await updateDoc(doc(db, 'test_sessions', sessionId), {
          completed: true,
          updated_at: serverTimestamp(),
        });
      } catch (e) {}
    }
  }, [userId, testId, clearAutoSave]);

  return {
    answers,
    updateAnswer,
    activePartIndex,
    updateActivePart,
    saveStatus,
    showRecoverPrompt,
    handleRecover,
    markCompleted,
    setAnswers,
  };
}
