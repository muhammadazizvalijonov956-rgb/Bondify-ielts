import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import LockdownManager from '@/components/LockdownManager';
import UpdatePopup from '@/components/UpdatePopup';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bondify | Master the IELTS',
  description: 'Premium IELTS practice platform with scoring and progress tracking',
  icons: {
    icon: '/logo.png', // Fallback if logo not added
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Suspense fallback={null}>
            <LockdownManager />
            <UpdatePopup />
          </Suspense>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="bg-white border-t border-slate-200 mt-12 py-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
                &copy; {new Date().getFullYear()} Bondify. Built for success.
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
