import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminSupabase = createClient(supabaseUrl, serviceKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    console.log(`[Admin Auth API] Creating confirmed user for: ${email}`);

    // Create user via Admin API - automatically confirmed, no email rate limits!
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || '',
      },
    });

    if (createError) {
      // If user already exists, check if we can let them sign in
      if (createError.message.includes('already registered') || createError.status === 422) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in.' },
          { status: 400 }
        );
      }
      console.error('[Admin Auth API Error]:', createError);
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: newUser.user,
      message: 'Account created and confirmed successfully!',
    });
  } catch (err: any) {
    console.error('[Admin Auth API Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
