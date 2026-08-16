import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { ENV } from './env';

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ [Supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
}

export const supabase = createClient(
  ENV.SUPABASE_URL || 'https://placeholder.supabase.co',
  ENV.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: fetch.bind(globalThis),
    },
    realtime: {
      transport: WebSocket as any,
    },
  }
);
