'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabase/client';
import { ArrowRight, Lock, Mail, AlertCircle, Eye, EyeOff, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
        const userEmail = email.trim();
        if (typeof window !== 'undefined') {
          localStorage.setItem('biz_email', userEmail);
        }

        // Pre-fetch business to determine where to navigate
        let hasBusiness = false;
        try {
          const bizRes = await fetch(`/api/business?email=${encodeURIComponent(userEmail)}`);
          const bizData = await bizRes.json();
          if (bizData?.business?.id && typeof window !== 'undefined') {
            localStorage.setItem('biz_id', bizData.business.id);
            localStorage.setItem('biz_name', bizData.business.name);
            localStorage.setItem('biz_email', bizData.business.owner_email || userEmail);
            hasBusiness = true;
          }
        } catch (e) {
          console.error('Pre-fetch business on login error:', e);
        }

        // Go directly to the right page — dashboard if business exists, onboarding if not
        router.push(hasBusiness ? '/dashboard' : '/onboarding');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-base flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 pb-safe font-sans antialiased text-fg transition-colors duration-150 relative">
      {/* Top Floating Theme Switch */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center justify-center">
          <div className="w-14 h-14 rounded-xl bg-surface border border-line shadow-sm flex items-center justify-center p-2.5">
            <img
              src="/logo.png"
              alt="Agento AI"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-subtle border border-accent-border text-[11px] font-semibold text-accent mb-1">
            <Sparkles className="w-3 h-3" />
            <span>24/7 Autonomous WhatsApp OS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg tracking-tight">
            Welcome back to Agento AI
          </h1>
          <p className="text-xs sm:text-sm text-fg-muted max-w-xs mx-auto leading-relaxed">
            Sign in to manage your WhatsApp AI assistant, live orders & inquiries
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-md border border-line bg-surface">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-4" onSubmit={handleLogin}>
              {errorMsg && (
                <div className="p-3 rounded-md bg-danger-subtle border border-danger-border text-xs font-medium text-danger flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-fg">Business Email Address</Label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11 text-sm rounded-md"
                    placeholder="owner@mybusiness.com"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-fg">Password</Label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 h-11 text-sm rounded-md"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg p-1 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
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
                  className="h-11 font-semibold"
                >
                  Sign In to Dashboard
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-line text-center">
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

        {/* Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-fg-subtle">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
            <span>Encrypted & Tenant Isolated</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Meta Official Cloud API</span>
          </div>
        </div>
      </div>
    </main>
  );
}
