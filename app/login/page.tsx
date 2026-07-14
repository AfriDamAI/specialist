'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { API_URL } from '@/lib/config';
import { mapSpecializationToLabel } from '@/lib/specialist-utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field-level validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  // General auth / network error (shown below password field)
  const [authError, setAuthError] = useState('');

  const router = useRouter();

  const BASE_URL = API_URL;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
    if (authError) setAuthError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError('');
    if (authError) setAuthError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset previous errors before validating again
    setEmailError('');
    setPasswordError('');
    setAuthError('');

    // Client-side validation before hitting the API
    let hasValidationError = false;
    if (!email.trim()) {
      setEmailError('Clinical email is required.');
      hasValidationError = true;
    }
    if (!password) {
      setPasswordError('Security key is required.');
      hasValidationError = true;
    }
    if (hasValidationError) return;

    setLoading(true);

    try {
      // Rule #5: Humanizing the connection to the workstation
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
        // registered. Non-identity failures (e.g. account under review, server
        // errors) are safe to show verbatim since they're actionable and don't
        // reveal anything about other accounts.
        const isCredentialError = [400, 401, 404].includes(response.status);
        const message = isCredentialError
          ? 'Invalid clinical email or security key. Please check your credentials and try again.'
          : (data?.message || 'Identity verification failed. Please try again.');
        setAuthError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      /**
       * 🛡️ OGA PRECISION FIX:
       * No 'resultData' here. We map directly to the keys returned by the backend.
       */
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      const id = data.id;
      if (id) {
        localStorage.setItem('specialistId', id);
        localStorage.setItem('userId', id);
      }
      localStorage.setItem('specialistName', data.displayName || 'Specialist');
      const mappedRole = mapSpecializationToLabel(
        data.specialization || data.type || data.speciality || data.specialty || data.role || data.profession || data.title || 'Specialist'
      );
      if (id) {
        localStorage.setItem(`specialistRole:${id}`, mappedRole);
        localStorage.setItem('specialistRole', mappedRole);
      } else localStorage.setItem('specialistRole', mappedRole);
      localStorage.setItem('specialistStatus', data.isActive ? 'verified' : 'under_review');

      setAuthError('');
      toast.success(`Access Granted. Welcome, ${data.displayName || 'Doctor'}.`);

      // Rule #5: Hard refresh to ensure layout catches the new session
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login Error:', error);
      const message = 'Unable to connect to the server. Please check your internet connection and try again.';
      setAuthError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col justify-center py-12 px-6 lg:px-8 transition-colors text-left">
      {/* 🏥 Visual Identity Section */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-black/10 dark:bg-white/10 rounded-3xl mb-6 shadow-xl">
          <Image
            src="/logo.png"
            alt="AfriDam AI Logo"
            width={56}
            height={56}
            className="object-contain rounded-xl"
          />
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

          <form className="space-y-8" onSubmit={handleSubmit} noValidate>
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">
                Clinical Email
              </label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                aria-invalid={Boolean(emailError || authError)}
                className={`block w-full px-6 py-4 border-2 rounded-2xl shadow-inner bg-white dark:bg-gray-800 dark:text-white font-bold text-sm outline-none focus:ring-2 transition-colors ${
                  emailError || authError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-transparent focus:ring-[#FF7A59]'
                }`}
                placeholder="doctor@afridam.ai"
              />
              {emailError && (
                <p
                  className="text-[11px] font-bold text-red-500 ml-2 mt-1"
                  aria-live="polite"
                >
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Input with Eye Toggle */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">
                Security Key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  aria-invalid={Boolean(passwordError || authError)}
                  className={`block w-full px-6 py-4 border-2 rounded-2xl shadow-inner bg-white dark:bg-gray-800 dark:text-white font-bold text-sm outline-none focus:ring-2 pr-12 transition-colors ${
                    passwordError || authError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-transparent focus:ring-[#FF7A59]'
                  }`}
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
              {passwordError && (
                <p
                  className="text-[11px] font-bold text-red-500 ml-2 mt-1"
                  aria-live="polite"
                >
                  {passwordError}
                </p>
              )}
              {authError && (
                <p
                  className="text-[11px] font-bold text-red-500 ml-2 mt-1"
                  aria-live="polite"
                >
                  {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-5 px-4 rounded-2xl shadow-xl text-xs font-black uppercase tracking-[0.2em] text-white bg-black hover:bg-[#FF7A59] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Authenticating...' : 'Enter Workspace'}
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