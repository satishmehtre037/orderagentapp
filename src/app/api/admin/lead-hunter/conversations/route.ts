import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp';

/**
 * GET /api/admin/lead-hunter/conversations
 * Fetch all outreach threads and message histories
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filterPhone = searchParams.get('phone');

    let query = supabaseAdmin
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: true });

    if (filterPhone) {
      const clean = filterPhone.replace(/\D/g, '');
      query = query.or(`customer_number.ilike.%${clean}%,customer_number.ilike.%${filterPhone}%`);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.warn('[Admin Conversations Error]:', error.message);
      return NextResponse.json({ success: true, threads: [] });
    }

    // Group messages by customer_number into chat threads
    const threadMap: Record<string, any> = {};

    (messages || []).forEach((msg) => {
      const phone = msg.customer_number || 'Unknown';
      if (!threadMap[phone]) {
        threadMap[phone] = {
          phone,
          business_name: msg.business_name || `Prospect (${phone.slice(-4)})`,
          category: msg.category || 'lead',
          last_message: msg.message_text || msg.message || '',
          last_sender: msg.message_direction === 'inbound' || msg.sender === 'customer' ? 'client' : 'bot',
          last_timestamp: msg.created_at || new Date().toISOString(),
          unread: msg.message_direction === 'inbound' || msg.sender === 'customer',
          messages: [],
        };
      }

      threadMap[phone].messages.push({
        id: msg.id || `msg_${Date.now()}_${Math.random()}`,
        text: msg.message_text || msg.message || '',
        sender: msg.message_direction === 'inbound' || msg.sender === 'customer' ? 'client' : 'bot',
        timestamp: msg.created_at || new Date().toISOString(),
      });

      threadMap[phone].last_message = msg.message_text || msg.message || '';
      threadMap[phone].last_sender = msg.message_direction === 'inbound' || msg.sender === 'customer' ? 'client' : 'bot';
      threadMap[phone].last_timestamp = msg.created_at || new Date().toISOString();
    });

    const threads = Object.values(threadMap).sort((a: any, b: any) =>
      new Date(b.last_timestamp).getTime() - new Date(a.last_timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      count: threads.length,
      threads,
    });
  } catch (error: any) {
    console.error('[Admin Conversations GET Exception]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/lead-hunter/conversations
 * Send a manual reply directly from the dashboard to a prospect
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, message, businessName } = body;

    if (!phone || !message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Phone and message required' }, { status: 400 });
    }

    let cleanPhone = phone.replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      const digits = cleanPhone.replace(/\D/g, '');
      cleanPhone = digits.length === 10 ? `+91${digits}` : `+${digits}`;
    }

    console.log(`[Admin Chat Dispatch] Sending manual reply to ${cleanPhone}: "${message}"...`);

    // 1. Send via WhatsApp Cloud API
    await sendWhatsAppTextMessage(cleanPhone, message);

    // 2. Record in conversations table
    try {
      await supabaseAdmin.from('conversations').insert({
        customer_number: cleanPhone,
        message_text: message,
        message_direction: 'outbound',
        sender: 'agent',
        business_name: businessName || 'Prospect',
        created_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn('[Admin Chat DB Save Notice]:', dbErr);
    }

    return NextResponse.json({
      success: true,
      phone: cleanPhone,
      message,
      sentAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Admin Chat POST Exception]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
