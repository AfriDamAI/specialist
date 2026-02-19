'use client';

import { Suspense } from 'react'; 
import RegistrationForm from "@/components/Register"; // 🏛️ Rule #6: The logic lives here
import Link from 'next/link';

/**
 * 🛡️ Rule #3 & #5: Workspace Initialization UI
 * Simple, jargon-free loader for a better peer-to-peer UX.
 */
function RegistrationLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-[#FF7A59] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Initializing Workspace...</p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row italic">
      
      {/* 🏛️ Left Side: Brand Context (Rule #4: Hidden on small screens) */}
      <div className="hidden md:flex md:w-1/3 bg-black p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#FF7A59] rounded-full blur-[120px] opacity-20"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-black text-xl font-bold italic font-black">A</span>
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">
              Afridam<span className="text-[#FF7A59]">AI</span>
            </span>
          </div>

          <h2 className="text-4xl font-black leading-tight mb-6 uppercase tracking-tighter">
            Empowering <br />
            <span className="text-[#FF7A59]">Dermatological</span> <br />
            Excellence.
          </h2>
          <p className="text-gray-400 font-medium text-lg max-w-xs not-italic">
            Join Africa's premier network of specialists using AI to transform skin health.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
            Specialist Portal v1.0 • 2026
          </p>
        </div>
      </div>

      {/* 🏛️ Right Side: Registration Form (Rule #4: Mobile-First) */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-24 lg:px-32 bg-gray-50">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="text-left">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Create Specialist Account</h1>
            <p className="text-gray-500 font-medium mt-2 not-italic">
              Please provide your professional credentials to begin the verification process.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100">
            {/* 🛡️ SYNERGY: Wrap RegistrationForm to handle local/cloud switching */}
            <Suspense fallback={<RegistrationLoader />}>
              <RegistrationForm />
            </Suspense>
          </div>

          <p className="text-center text-sm text-gray-500 font-medium not-italic">
            Already registered?{' '}
            <Link href="/" className="text-[#FF7A59] font-black hover:underline italic">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}