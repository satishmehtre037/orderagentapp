'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabase/client';
import { Bot, ArrowRight, ShieldCheck } from 'lucide-react';

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
      // 1. Create user via Server Admin API (bypasses Supabase email rate limits & auto-confirms)
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to create account');
      }

      // 2. Sign in to establish client session
      const { error: loginErr } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (loginErr) {
        console.warn('Auto-login warning, redirecting to login:', loginErr);
        router.push('/login');
        return;
      }

      console.log('Signup and auto-login successful!');
      router.push('/onboarding');
    } catch (err: any) {
      console.error('Signup error:', err);
      setErrorMsg(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center space-x-2 bg-teal text-paper p-3 rounded-xl mb-4 shadow-passbook">
          <Bot className="w-8 h-8 text-marigold" />
          <span className="font-serif text-2xl font-bold tracking-tight">BizBot OS</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-ink tracking-tight">
          Start Your 30-Day Free Trial
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-ink-muted">
          WhatsApp AI Assistant for Bakeries, Salons & Tuition Centers
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-paper py-8 px-6 border-2 border-warm-border rounded-lg shadow-ledger sm:px-10">
          <form onSubmit={handleSignup} className="space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-ink-light uppercase mb-1.5">
                Owner Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full text-sm px-3.5 py-2.5 bg-paper border border-warm-border rounded-md focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-ink-light uppercase mb-1.5">
                Business Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@mybakery.in"
                className="w-full text-sm px-3.5 py-2.5 bg-paper border border-warm-border rounded-md focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-ink-light uppercase mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm px-3.5 py-2.5 bg-paper border border-warm-border rounded-md focus:border-teal"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs text-ink-light pt-1">
              <ShieldCheck className="w-4 h-4 text-sage flex-shrink-0" />
              <span>No credit card required. Setup takes under 5 minutes.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-md bg-teal text-paper font-serif font-bold text-base hover:bg-teal-hover transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account & Continue</span>
                  <ArrowRight className="w-4 h-4 text-marigold" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-warm-border text-center text-xs text-ink-muted">
            Already registered?{' '}
            <Link href="/login" className="font-semibold text-teal hover:underline">
              Log in to your dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
