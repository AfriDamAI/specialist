'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SpecialtySelection from '@/components/SpecialtySelection';
import LoginForm from '@/components/Login'; // Rule #3: Now imports from components
import Link from 'next/link';

export default function EntryPage() {
  const router = useRouter();
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Rule #5: Strictly obey the auth state to prevent double-login
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      {/* Navigation Bar */}
      <nav className="h-20 border-b border-gray-100 dark:border-gray-800 flex items-center px-6 md:px-12 justify-between sticky top-0 bg-white dark:bg-gray-950/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-lg shadow-gray-200 dark:shadow-none">
            <span className="text-white dark:text-black text-xl font-bold italic">A</span>
          </div>
          <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
            Afridam<span className="text-[#FF7A59]">AI</span>
          </span>
        </div>
        
        <button 
          onClick={() => setShowRegister(!showRegister)}
          className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-[#FF7A59] transition-colors"
        >
          {showRegister ? '← Back to Login' : 'Specialist Onboarding'}
        </button>
      </nav>

      <main className="max-w-4xl mx-auto pt-12 pb-24 px-6">
        {showRegister ? (
          /* Onboarding View */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-16 space-y-4">
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
                Specialist <span className="text-[#FF7A59]">Onboarding</span>
              </h1>
              <p className="text-xl text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto">
                Select your primary expertise to begin.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-8 md:p-12 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
              <SpecialtySelection />
            </div>
          </div>
        ) : (
          /* Login View */
          <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-12 space-y-4">
              <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                Sign <span className="text-[#FF7A59]">In</span>
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                Access your medical workstation.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-950 p-8 md:p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl shadow-gray-200/60 dark:shadow-none">
              {/* Rule #4: The Full-Code Mandate - Integrating the Login Component */}
              <LoginForm />
              
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  New specialist?{' '}
                  <button 
                    onClick={() => setShowRegister(true)}
                    className="text-[#FF7A59] font-bold hover:underline"
                  >
                    Start Onboarding
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}