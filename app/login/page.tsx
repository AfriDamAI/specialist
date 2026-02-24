'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { API_URL } from '@/lib/config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const BASE_URL = API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Rule #5: Humanizing the connection to the workstation
      const response = await fetch(`${BASE_URL}/auth/specialist/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        /**
         * 🛡️ OGA PRECISION FIX: 
         * No 'resultData' here. We map directly to the keys returned by the backend.
         */
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('specialistName', data.displayName || 'Specialist');
        localStorage.setItem('specialistRole', data.role || 'Specialist');
        localStorage.setItem('specialistStatus', data.isActive ? 'verified' : 'under_review');

        toast.success(`Access Granted. Welcome, ${data.displayName || 'Doctor'}.`);

        // Rule #5: Hard refresh to ensure layout catches the new session
        window.location.href = '/dashboard';
      } else {
        toast.error(data.message || 'Identity verification failed.');
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error('The workstation is offline. Ensure the backend is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col justify-center py-12 px-6 lg:px-8 transition-colors text-left">
      {/* 🏥 Visual Identity Section */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-black dark:bg-white rounded-3xl mb-6 shadow-xl">
          <span className="text-white dark:text-black text-3xl font-black italic">A</span>
        </div>
        <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
          Afridam<span className="text-[#FF7A59]">AI</span>
        </h2>
        <p className="mt-3 text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">
          Authorized Specialist Portal
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-gray-50 dark:bg-gray-900 py-10 px-8 shadow-2xl rounded-[3.5rem] border border-gray-100 dark:border-gray-800 sm:px-12">

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">
                Clinical Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-6 py-4 border-none rounded-2xl shadow-inner bg-white dark:bg-gray-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#FF7A59]"
                placeholder="doctor@afridam.ai"
              />
            </div>

            {/* Password Input with Eye Toggle */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">
                Security Key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-6 py-4 border-none rounded-2xl shadow-inner bg-white dark:bg-gray-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#FF7A59] pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF7A59] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-5 px-4 rounded-2xl shadow-xl text-xs font-black uppercase tracking-[0.2em] text-white bg-black hover:bg-[#FF7A59] transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Verifying Identity...' : 'Enter Workspace'}
            </button>
          </form>

          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-400 font-black uppercase tracking-tighter">
                  Vetting Required
                </span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/register"
                className="w-full flex justify-center py-4 px-4 border border-gray-200 dark:border-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-white dark:hover:bg-gray-800 transition-all italic"
              >
                Apply for Specialist Status
              </Link>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
        Protected by AfriDam Neural-Vault Encryption
      </p>
    </div>
  );
}