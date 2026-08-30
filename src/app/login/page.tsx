'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabase/client';
import { ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { loginSchema } from '../../lib/validations/auth';
import { ThemeToggle } from '../../components/ui/ThemeContext';
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
} from '../../components/ui';

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

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setErrorMsg(validation.error.errors[0].message);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('biz_email', email);
        }
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-base flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 pb-safe font-sans antialiased text-fg transition-colors duration-150 relative">
      {/* Top Floating Theme Switch */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-line shadow-md flex items-center justify-center p-2">
            <img
              src="/logo.png"
              alt="Agento AI"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
          Welcome back to Agento AI
        </h1>
        <p className="text-xs sm:text-sm text-fg-muted max-w-xs mx-auto leading-relaxed">
          Sign in to manage your WhatsApp AI agent and live orders
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-4" onSubmit={handleLogin}>
              {errorMsg && (
                <div className="p-3 rounded-md bg-danger-subtle border border-danger-border text-xs font-medium text-danger flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <Label className="mb-1.5 block">Business Email Address</Label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="owner@mybusiness.com"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block">Password</Label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={loading}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Sign In to Dashboard
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-line text-center">
              <p className="text-xs text-fg-muted">
                Don&apos;t have an account yet?{' '}
                <Link
                  href="/signup"
                  className="font-semibold text-accent hover:underline inline-flex items-center gap-1"
                >
                  Start 30-Day Free Trial
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
