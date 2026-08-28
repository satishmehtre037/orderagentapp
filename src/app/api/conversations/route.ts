import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

const adminSupabase = supabase;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId || businessId === 'demo-business-id') {
      return NextResponse.json({ conversations: [] });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      return NextResponse.json({ conversations: [] });
    }

    const { data, error } = await adminSupabase
      .from('conversations')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[API Conversations] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalize message_text -> message and message_direction -> sender for frontend
    const normalized = (data || []).map((row) => ({
      ...row,
      message: row.message_text || row.message || '',
      sender: row.message_direction === 'inbound' || row.sender === 'customer' || row.sender === 'inbound' ? 'customer' : 'agent',
    }));

    return NextResponse.json({ conversations: normalized });
  } catch (err: any) {
    console.error('[API Conversations Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessId, customerNumber, messageText } = body;

    if (!businessId || !customerNumber || !messageText) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Deliver message to customer via WhatsApp Cloud API
    const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (token && phoneNumberId) {
      const cleanToNumber = customerNumber.replace(/\D/g, '');
      try {
        await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanToNumber,
            type: 'text',
            text: { preview_url: false, body: messageText },
          }),
        });
      } catch (waErr) {
        console.error('[Manual WhatsApp Send Error]:', waErr);
      }
    }

    // 2. Save outbound message in Supabase
    const { data: savedMsg, error: saveErr } = await adminSupabase
      .from('conversations')
      .insert([
        {
          business_id: businessId,
          customer_number: customerNumber,
          message_direction: 'outbound',
          message_text: messageText,
        },
      ])
      .select()
      .single();

    if (saveErr) {
      return NextResponse.json({ error: saveErr.message }, { status: 500 });
    }

    const normalized = {
      ...savedMsg,
      message: savedMsg.message_text,
      sender: 'agent' as const,
    };

    return NextResponse.json({ success: true, message: normalized });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
