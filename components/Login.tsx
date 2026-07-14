'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { API_URL } from '@/lib/config';
import { mapSpecializationToLabel } from '@/lib/specialist-utils';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const router = useRouter();

  // Rule #3 & #6: Ensuring we hit the correct backend port and path
  const BASE_URL = API_URL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');

    try {
      // Humanizing the connection: Reaching out to your local Mac database
      const response = await fetch(`${BASE_URL}/auth/specialist/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // A Response body can only be consumed once — read it as text, then
      // attempt to parse it as JSON, so this works whether the error body is
      // JSON, plain text, or empty.
      const rawBody = await response.text();
      let data: any = null;
      try {
        data = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        console.error('Login request failed', response.status, rawBody);
        // Credential/identity failures (wrong password, unknown email) always get
        // a generic message — the backend's own text here can say "Specialist
        // with email x@y.com not found", which would leak which emails are
        // registered. Non-identity failures are safe to show verbatim.
        const isCredentialError = [400, 401, 404].includes(response.status);
        const message = isCredentialError
          ? 'Invalid email or password. Please check your credentials and try again.'
          : (data?.message || 'We could not verify these details.');
        setAuthError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      /**
       * 🛡️ OGA PRECISION FIX:
       * Storing the keys to your local workstation
       */
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      // 🛡️ Precision Fix: Storing the ID for chat and session consistency
      const id = data.id || data.specialistId;
      if (id) {
        localStorage.setItem('specialistId', id);
        localStorage.setItem('userId', id);
      }

      if (data.displayName) {
        localStorage.setItem('specialistName', data.displayName);
      }

      const mappedRole = mapSpecializationToLabel(
        data.specialization || data.type || data.speciality || data.specialty || data.role || data.profession || data.title || 'Specialist'
      );
      if (id) {
        localStorage.setItem(`specialistRole:${id}`, mappedRole);
        localStorage.setItem('specialistRole', mappedRole);
      } else {
        localStorage.setItem('specialistRole', mappedRole);
      }

      // Mapping status for the specialist dashboard view
      localStorage.setItem('specialistStatus', data.isActive ? 'verified' : 'under_review');

      toast.success(`Access Granted. Welcome, ${data.displayName || 'Doctor'}`);

      // Rule #5: Forcing a clean entry into the dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error("Login Error:", error);
      const message = 'The workstation is offline. Please ensure your backend is running.';
      setAuthError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6 text-left max-w-md mx-auto">
      {/* Email Input */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-gray-500 ml-1 italic">
          Professional Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (authError) setAuthError(''); }}
          placeholder="specialist@afridam.com"
          aria-invalid={Boolean(authError)}
          className={`w-full px-6 py-4 bg-white dark:bg-gray-800 border-2 rounded-2xl text-gray-900 dark:text-white text-base font-semibold focus:ring-4 outline-none transition-all italic ${
            authError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
              : 'border-gray-100 dark:border-gray-800 focus:border-[#FF7A59] focus:ring-[#FF7A59]/10'
          }`}
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
            onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError(''); }}
            placeholder="••••••••"
            aria-invalid={Boolean(authError)}
            className={`w-full px-6 py-4 bg-white dark:bg-gray-800 border-2 rounded-2xl text-gray-900 dark:text-white text-base font-semibold focus:ring-4 outline-none transition-all pr-14 italic ${
              authError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                : 'border-gray-100 dark:border-gray-800 focus:border-[#FF7A59] focus:ring-[#FF7A59]/10'
            }`}
          />
          {/* Rule #4: Mobile-balanced eye icon toggle */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors p-2"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {authError && (
          <p className="text-[11px] font-bold text-red-500 ml-1 mt-1" aria-live="polite">
            {authError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 mt-4 italic"
      >
        {loading ? 'Authenticating...' : 'Enter Workstation'}
      </button>
    </form>
  );
}