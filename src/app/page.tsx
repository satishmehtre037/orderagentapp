'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../lib/supabase/client';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndRedirect() {
      const { data: { session } } = await supabaseClient.auth.getSession();

      if (session?.user) {
        router.replace('/dashboard');
      } else {
        router.replace('/signup');
      }
    }

    checkAuthAndRedirect();
  }, [router]);

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-serif text-sm font-bold text-teal">Loading BizBot OS Portal...</p>
      </div>
    </main>
  );
}
