'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabase/client';
import { Bot, ArrowRight, ShieldCheck, User, Mail, Lock } from 'lucide-react';
import { signupSchema } from '../../lib/validations/auth';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const parseResult = signupSchema.safeParse({ fullName, email, password });
      if (!parseResult.success) {
        throw new Error(parseResult.error.errors[0]?.message || 'Please provide valid signup details.');
      }

      const cleanFullName = parseResult.data.fullName;
      const cleanEmail = parseResult.data.email;
      const cleanPassword = parseResult.data.password;

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword, fullName: cleanFullName }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to create account');
      }

      const { error: loginErr } = await supabaseClient.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (loginErr) {
        console.warn('Auto-login warning, redirecting to login:', loginErr);
        router.push('/login');
        return;
      }

      router.push('/onboarding');
    } catch (err: any) {
      console.error('Signup error:', err);
      setErrorMsg(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#F8FAFC] flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 pb-safe font-sans antialiased text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-white/20 shadow-xl flex items-center justify-center p-2">
            <img
              src="/logo.png"
              alt="Agento AI"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create your Agento AI account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
          24/7 Autonomous WhatsApp AI Staff & Business Operating System
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="backdrop-blur-2xl bg-white/85 py-7 px-5 sm:px-8 border border-white/60 rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
          <form onSubmit={handleSignup} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-300/50 text-rose-700 text-xs rounded-2xl font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">
                Owner Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-100/70 border border-slate-200/80 rounded-2xl focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">
                Business Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@yourstore.in"
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-100/70 border border-slate-200/80 rounded-2xl focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-100/70 border border-slate-200/80 rounded-2xl focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500 pt-1 ml-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Includes 1-day full free trial. No credit card required.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm shadow-[0_10px_25px_rgba(0,0,0,0.15)] transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account & Setup Agent</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200/60 text-center text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-slate-950 hover:underline">
              Sign in to dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
