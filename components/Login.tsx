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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/specialist/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('specialistName', data.specialist?.name || 'Specialist');
        toast.success('Access Granted');
        router.push('/dashboard');
      } else {
        toast.error(data.message || 'Verification Failed');
      }
    } catch (error) {
      toast.error('Connection Error: Is the backend live?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {/* Email Input */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 ml-1">
          Professional Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="specialist@afridamai.com"
          className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 text-base font-semibold placeholder:text-gray-300 focus:border-[#FF7A59] focus:ring-4 focus:ring-[#FF7A59]/10 outline-none transition-all"
        />
      </div>

      {/* Password Input with Toggle and Forgot Link */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-500">
            Workstation Password
          </label>
          <button 
            type="button"
            onClick={() => router.push('/forgot-password')}
            className="text-[11px] font-black text-[#FF7A59] hover:text-orange-600 transition-colors uppercase tracking-widest"
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
            className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 text-base font-semibold placeholder:text-gray-300 focus:border-[#FF7A59] focus:ring-4 focus:ring-[#FF7A59]/10 outline-none transition-all pr-14"
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
        className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-gray-800 active:scale-[0.98] transition-all shadow-xl shadow-gray-200 disabled:opacity-50 mt-4"
      >
        {loading ? 'Authenticating...' : 'Enter Workstation'}
      </button>
    </form>
  );
}