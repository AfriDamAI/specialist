'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Rule #3: Fallback logic for local development vs production
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.10.6:5000';

    try {
      const response = await fetch(`${BASE_URL}/api/auth/specialist/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.resultData) {
        const spec = data.resultData.specialist;

        // Rule #5: Defensive Identity Mapping
        // We pull real data instead of hardcoded strings
        const firstName = spec?.firstName || 'Specialist';
        const lastName = spec?.lastName || '';
        const role = spec?.role || 'Medical Personnel';

        localStorage.setItem('token', data.resultData.accessToken);
        localStorage.setItem('specialistId', spec?.id);
        localStorage.setItem('specialistName', `${firstName} ${lastName}`.trim());
        localStorage.setItem('specialistRole', role);
        
        // Rule #3: Syncing verification status from the Database
        if (spec?.isVerified) {
          localStorage.setItem('specialistStatus', 'verified');
        } else {
          localStorage.setItem('specialistStatus', 'under_review');
        }

        toast.success(`Access Granted. Welcome, ${firstName}.`);
        
        // Rule #5: Force window.location to ensure all Layouts re-read LocalStorage
        window.location.href = '/dashboard';
      } else {
        toast.error(data.message || 'Invalid credentials provided.');
      }
    } catch (error) {
      console.error("Login Connection Error:", error);
      toast.error('Connection failed. Please verify the backend service status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col justify-center py-12 px-6 lg:px-8 transition-colors text-left">
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
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">
                Clinical Email
              </label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="block w-full px-6 py-4 border-none rounded-2xl shadow-inner bg-white dark:bg-gray-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#FF7A59]"
                placeholder="doctor@afridam.ai"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">
                Security Key
              </label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="block w-full px-6 py-4 border-none rounded-2xl shadow-inner bg-white dark:bg-gray-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#FF7A59]"
                placeholder="••••••••"
              />
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
                href="/"
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