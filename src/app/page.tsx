'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../lib/supabase/client';

export default function Home() {
  const router = useRouter();
  const [targetRoute, setTargetRoute] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

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
    // Transition after the left-to-right typography sweep completes (~1.6s)
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 1700);

    const redirectTimer = setTimeout(() => {
      if (targetRoute) {
        router.replace(targetRoute);
      } else {
        router.replace('/signup');
      }
    }, 2000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(redirectTimer);
    };
  }, [targetRoute, router]);

  const letters = ['A', 'g', 'e', 'n', 't', 'o', '\u00A0', 'A', 'I'];

  return (
    <main
      className={`min-h-screen bg-black text-white flex flex-col items-center justify-center select-none overflow-hidden relative font-sans transition-opacity duration-300 ${
        isExiting ? 'animate-splash-exit' : ''
      }`}
    >
      {/* Center Minimalist Typography Wordmark with Left-to-Right Reveal */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Left-to-Right Letter Reveal Container */}
        <div className="flex items-center justify-center text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-0.03em] text-white">
          {letters.map((char, index) => (
            <span
              key={index}
              className="inline-block opacity-0 animate-sweep-letter"
              style={{
                animationDelay: `${index * 85}ms`,
              }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* Hairline Left-to-Right Sweep Accent */}
        <div className="relative w-full h-[1.5px] mt-2.5 overflow-hidden">
          <div className="absolute inset-0 bg-white/70 animate-sweep-line" />
        </div>
      </div>
    </main>
  );
}
