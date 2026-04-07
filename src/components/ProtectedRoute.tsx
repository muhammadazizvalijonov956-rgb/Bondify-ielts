"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

function ProtectedRouteContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  useEffect(() => {
    if (!loading) {
      if (!user && !sessionId) {
        // Not logged in and no active session proxy
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      } else if (user && !user.emailVerified) {
        // Logged in but not verified
        router.push(`/verify-email?next=${encodeURIComponent(pathname)}`);
      }
    }
  }, [user, loading, router, pathname, sessionId]);

  if (loading || (!user && !sessionId) || (user && !user.emailVerified)) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <ProtectedRouteContent>{children}</ProtectedRouteContent>
    </Suspense>
  );
}
