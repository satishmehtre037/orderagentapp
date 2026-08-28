import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { signupSchema } from '@/lib/validations/auth';

const adminSupabase = supabase;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validate payload with Zod schema
    const parseResult = signupSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Invalid input data';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { email, password, fullName } = parseResult.data;

    console.log(`[Admin Auth API] Creating confirmed user for: ${email}`);

    // 2. Create user via Admin API - automatically confirmed, no email rate limits!
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
