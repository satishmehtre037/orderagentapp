'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabase/client';
import { Bot, ArrowRight, Lock, Mail } from 'lucide-react';
import { loginSchema } from '../../lib/validations/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const parseResult = loginSchema.safeParse({ email, password });
      if (!parseResult.success) {
        throw new Error(parseResult.error.errors[0]?.message || 'Please enter valid login credentials.');
      }

      const cleanEmail = parseResult.data.email;
      const cleanPassword = parseResult.data.password;

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        throw error;
      }

      const res = await fetch(`/api/business?email=${encodeURIComponent(cleanEmail)}`);
      const bizData = await res.json();

      if (bizData?.business?.id) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid email or password.');
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
          Welcome back to Agento AI
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
          Sign in to manage your WhatsApp AI agent and live orders
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="backdrop-blur-2xl bg-white/85 py-7 px-5 sm:px-8 border border-white/60 rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-300/50 text-rose-700 text-xs rounded-2xl font-medium">
                {errorMsg}
              </div>
            )}

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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-100/70 border border-slate-200/80 rounded-2xl focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm shadow-[0_10px_25px_rgba(0,0,0,0.15)] transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200/60 text-center text-xs text-slate-500 font-medium">
            Don't have an account yet?{' '}
            <Link href="/signup" className="font-bold text-slate-950 hover:underline">
              Start 1-day free trial
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
