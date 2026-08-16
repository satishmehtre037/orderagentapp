'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabase/client';
import { Bot, ArrowRight } from 'lucide-react';

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

      console.log('Login successful:', data.user);

      // Check if business exists for this user via server API route (bypasses client RLS)
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
    <main className="min-h-screen bg-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center space-x-2 bg-teal text-paper p-3 rounded-xl mb-4 shadow-passbook">
          <Bot className="w-8 h-8 text-marigold" />
          <span className="font-serif text-2xl font-bold tracking-tight">BizBot OS</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-ink tracking-tight">
          Log In to Owner Portal
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-ink-muted">
          Manage your WhatsApp AI Agent, orders, and business settings
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-paper py-8 px-6 border-2 border-warm-border rounded-lg shadow-ledger sm:px-10">
          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-ink-light uppercase mb-1.5">
                Business Email
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm px-3.5 py-2.5 bg-paper border border-warm-border rounded-md focus:border-teal"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-md bg-teal text-paper font-serif font-bold text-base hover:bg-teal-hover transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Logging in...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-marigold" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-warm-border text-center text-xs text-ink-muted">
            New business owner?{' '}
            <Link href="/signup" className="font-semibold text-teal hover:underline">
              Start your free trial
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
