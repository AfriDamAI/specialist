'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SpecialtySelection from '@/components/SpecialtySelection';

export default function EntryPage() {
  const router = useRouter();

  useEffect(() => {
    // Rule #5: Temporarily disabled redirect to allow CEO vetting
    console.log("Redirect disabled for testing");
    /*
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
    */
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      <nav className="h-20 border-b border-gray-100 flex items-center px-6 md:px-12 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold italic">A</span>
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tighter">
            Afridam<span className="text-[#FF7A59]">AI</span>
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-16 pb-24 px-6">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-none tracking-tight">
            Specialist <span className="text-[#FF7A59]">Onboarding</span>
          </h1>
          <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">
            Select your primary expertise to begin.
          </p>
        </div>

        <div className="bg-gray-50 p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50">
          <SpecialtySelection />
        </div>
      </main>
    </div>
  );
}