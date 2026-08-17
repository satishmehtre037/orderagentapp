'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../lib/supabase/client';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [targetRoute, setTargetRoute] = useState<string | null>(null);

  useEffect(() => {
    // Check auth status
    async function checkAuth() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.user) {
          setTargetRoute('/dashboard');
        } else {
          setTargetRoute('/signup');
        }
      } catch {
        setTargetRoute('/signup');
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    // Smooth progress bar sequence
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100 && targetRoute) {
      const timeout = setTimeout(() => {
        router.replace(targetRoute);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [progress, targetRoute, router]);

  return (
    <main className="min-h-screen bg-[#070A11] text-white flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden relative font-sans">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none animate-splash-glow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Top Brand Tag */}
      <div className="w-full max-w-sm flex items-center justify-between pt-4 opacity-70 z-10">
        <span className="text-[10px] tracking-widest uppercase font-mono text-slate-400">
          SYSTEM V1.0
        </span>
        <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>AI AGENT READY</span>
        </div>
      </div>

      {/* Center Cinematic Logo & Typography Reveal */}
      <div className="flex flex-col items-center text-center space-y-6 z-10 animate-logo-pop">
        {/* Glowing Logo Icon Container */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-1000 animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#0F1422] border border-slate-700/80 shadow-2xl flex items-center justify-center p-2 overflow-hidden">
            <img
              src="/logo.png"
              alt="Agento AI"
              className="w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(255,255,255,0.15)]"
            />
          </div>
        </div>

        {/* Brand Typography */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center space-x-1.5">
            <span className="tracking-tight">Agento</span>
            <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide shimmer-text">
            24/7 Autonomous WhatsApp AI Staff
          </p>
        </div>
      </div>

      {/* Bottom Minimalist Progress & Capabilities */}
      <div className="w-full max-w-xs space-y-4 pb-4 z-10">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-1 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/40">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 transition-all duration-150 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>INITIALIZING COMMERCE ENGINE</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center justify-center space-x-3 text-[10px] text-slate-400 font-medium">
          <span>• Auto Orders</span>
          <span>• Invoicing</span>
          <span>• Bookings</span>
          <span>• Renewals</span>
        </div>
      </div>
    </main>
  );
}
