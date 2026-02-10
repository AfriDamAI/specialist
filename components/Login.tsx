'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Rule #3: Environment-aware BASE_URL
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://afridamai-backend.onrender.com/api';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Rule #5: Direct hit to the NestJS AuthController specialist/login endpoint
      const response = await fetch(`${BASE_URL}/auth/specialist/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        /**
         * 🛡️ OGA PRECISION FIX: 
         * Your backend returns SpecialistAccessTokenDto: { accessToken, refreshToken, isActive, displayName, role }
         */
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        // Use 'displayName' directly as defined in AuthController specialistLogin
        if (data.displayName) {
          localStorage.setItem('specialistName', data.displayName);
        }
        
        localStorage.setItem('specialistRole', data.role || 'Specialist');
        
        // Map 'isActive' to clinical verification status
        localStorage.setItem('specialistStatus', data.isActive ? 'verified' : 'under_review');
        
        toast.success(`Access Granted. Welcome, ${data.displayName || 'Doctor'}`);
        
        // Rule #5: Hard refresh to ensure DashboardLayout re-reads the fresh LocalStorage
        window.location.href = '/dashboard';
      } else {
        toast.error(data.message || 'Verification Failed');
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error('Connection Error: The workstation cannot reach the neural link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6 text-left">
      {/* Email Input */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 ml-1 italic">
          Professional Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="specialist@afridamai.com"
          className="w-full px-6 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-base font-semibold placeholder:text-gray-300 focus:border-[#FF7A59] focus:ring-4 focus:ring-[#FF7A59]/10 outline-none transition-all italic"
        />
      </div>

      {/* Password Input with Toggle */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 italic">
            Workstation Password
          </label>
          <button 
            type="button"
            className="text-[11px] font-black text-[#FF7A59] hover:text-orange-600 transition-colors uppercase tracking-widest italic"
          >
            Forgot Password?
          </button>
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-6 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-base font-semibold placeholder:text-gray-300 focus:border-[#FF7A59] focus:ring-4 focus:ring-[#FF7A59]/10 outline-none transition-all pr-14 italic"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-gray-200 dark:shadow-none disabled:opacity-50 mt-4 italic"
      >
        {loading ? 'Authenticating...' : 'Enter Workstation'}
      </button>
    </form>
  );
}