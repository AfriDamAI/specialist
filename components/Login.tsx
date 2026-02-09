'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Rule #3: Connecting to Tobi's Backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/specialist/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Storing the credentials for the Workstation
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
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
          Professional Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="specialist@afridamai.com"
          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59] outline-none transition-all font-medium"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
          Workstation Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59] outline-none transition-all font-medium"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
      >
        {loading ? 'Authenticating...' : 'Enter Workstation'}
      </button>
    </form>
  );
}