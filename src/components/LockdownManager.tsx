"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function LockdownManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).electronAPI) return;

    const isFullTestIntro = pathname?.startsWith('/full-test/');
    const isFullTestSubtest = searchParams?.get('fullTestId');
    
    // Check if we are currently in an active full test session
    if (isFullTestIntro || isFullTestSubtest) {
      console.log("[Electron] Entering Exam Lockdown Mode");
      (window as any).electronAPI.setExamMode(true);
    } else {
      console.log("[Electron] Exiting Exam Lockdown Mode");
      (window as any).electronAPI.setExamMode(false);
    }

    // Cleanup when component unmounts
    return () => {
      if ((window as any).electronAPI) {
        (window as any).electronAPI.setExamMode(false);
      }
    };
  }, [pathname, searchParams]);

  return null;
}
