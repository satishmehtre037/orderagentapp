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

    // Group messages by clean normalized customer_number into chat threads
    const threadMap: Record<string, any> = {};

    (messages || []).forEach((msg) => {
      const rawPhone = msg.customer_number || '';
      const cleanKey = rawPhone.replace(/\D/g, '');
      if (!cleanKey) return;

      const formattedPhone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
      const isClient = msg.message_direction === 'inbound' || msg.sender === 'customer' || msg.sender === 'inbound';
      const text = msg.message_text || msg.message || '';

      // Try to extract real business name from pitch text or known lead
      let extractedName = msg.business_name;
      if (!extractedName || extractedName.startsWith('Lead (')) {
        if (cleanKey === '918779841346' || cleanKey === '8779841346') {
          extractedName = 'Satish Mehtre (WebCore Demo Lead)';
        } else {
          const pitchMatch = text.match(/Namaste (?:Dr\.\s*\/\s*Team|Dr\.|Team)?\s*\*([^*]+)\*/i);
          if (pitchMatch && pitchMatch[1]) {
            extractedName = pitchMatch[1].trim();
          }
        }
      }

      if (!threadMap[cleanKey]) {
        threadMap[cleanKey] = {
          phone: formattedPhone,
          business_name: extractedName || `Lead (+${cleanKey})`,
          category: msg.category || 'lead',
          last_message: text,
          last_sender: isClient ? 'client' : 'bot',
          last_timestamp: msg.created_at || new Date().toISOString(),
          unread: isClient,
          messages: [],
        };
      } else if (extractedName && (!threadMap[cleanKey].business_name || threadMap[cleanKey].business_name.startsWith('Lead ('))) {
        threadMap[cleanKey].business_name = extractedName;
      }

      // Avoid pushing immediate duplicate retries
      const existingMsgs = threadMap[cleanKey].messages;
      const lastSaved = existingMsgs[existingMsgs.length - 1];
      const isDuplicateRetry =
        lastSaved &&
        lastSaved.sender === (isClient ? 'client' : 'bot') &&
        lastSaved.text.trim() === text.trim() &&
        Math.abs(new Date(msg.created_at || 0).getTime() - new Date(lastSaved.timestamp || 0).getTime()) < 10000;

      if (!isDuplicateRetry) {
        threadMap[cleanKey].messages.push({
          id: msg.id || `msg_${Date.now()}_${Math.random()}`,
          text: text,
          sender: isClient ? 'client' : 'bot',
          timestamp: msg.created_at || new Date().toISOString(),
        });
      }

      threadMap[cleanKey].last_message = text;
      threadMap[cleanKey].last_sender = isClient ? 'client' : 'bot';
      threadMap[cleanKey].last_timestamp = msg.created_at || new Date().toISOString();
      if (isClient) threadMap[cleanKey].unread = true;
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

    console.log(`[Admin Chat Dispatch] 📤 Sending manual WhatsApp reply to ${cleanPhone}: "${message}"...`);

    // 1. Send via live WhatsApp Cloud API
    await sendWhatsAppTextMessage(cleanPhone, message);

    // 2. Record in conversations table in Supabase
    try {
      let bizId: string | null = 'e39dee77-e7b9-45cf-ad64-fd6400f59a29';
      const { data: bizList } = await supabaseAdmin.from('businesses').select('id').limit(1);
      if (bizList && bizList.length > 0) {
        bizId = bizList[0].id;
      }

      if (bizId) {
        await supabaseAdmin.from('conversations').insert({
          business_id: bizId,
          customer_number: cleanPhone,
          message_text: message,
          message_direction: 'outbound',
        });
      }
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
