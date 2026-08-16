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
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-medium text-slate-600">Loading BizBot OS...</p>
      </div>
    </main>
  );
}
