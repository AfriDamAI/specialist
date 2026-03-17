"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { API_URL } from "@/lib/config";

/**
 * 🛡️ VerifyEmail Component
 * Handles the input of the verification code sent to the user's email.
 */
export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const BASE_URL = API_URL;

  useEffect(() => {
    if (!email) {
      toast.error("Invalid verification session. Redirecting to registration.");
      router.push("/register");
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 4) {
      toast.error("Please enter a valid verification code.");
      return;
    }

    setLoading(true);
    setVerifying(true);
    const toastId = toast.info("Verifying your code...", { autoClose: false });

    try {
      const response = await fetch(`${BASE_URL}/auth/register/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          code: code,
        }),
      });

      const result = await response.json();

      if (response.ok && result.succeeded) {
        toast.update(toastId, {
          render: result.message || "Account verified successfully!",
          type: "success",
          autoClose: 3000,
        });
        
        // Progress message for account creation
        toast.success("Account creation complete. You can now log in.");
        
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast.update(toastId, {
          render: result.message || "Verification failed. Please try again.",
          type: "error",
          autoClose: 5000,
        });
      }
    } catch (error) {
      toast.update(toastId, {
        render: "Connection error. Please check your internet.",
        type: "error",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  return (
    <div className="bg-white p-2 italic">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#FF7A59]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📧</span>
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Verify Your Email</h2>
        <p className="text-gray-500 text-sm mt-2 not-italic">
          We've sent a code to <span className="font-bold text-black">{email}</span>. 
          Enter it below to complete your registration.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
            Verification Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter Code"
            className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-[#FF7A59] focus:outline-none transition bg-white text-black font-bold italic shadow-sm text-center text-2xl tracking-[0.5em] placeholder:text-gray-200 placeholder:tracking-normal"
            maxLength={10}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-black text-white hover:bg-[#FF7A59] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Complete Registration"}
        </button>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 mt-6">
          Didn't receive the code? Check your spam or <button type="button" onClick={() => router.back()} className="text-[#FF7A59] hover:underline">Try again</button>
        </p>
      </form>
    </div>
  );
}
