import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp';
import { resolveOperatorBusinessId } from '@/services/businessService';
import { hasOptedOut, normalizeIndianPhone } from '@/services/optOutService';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * Outreach inbox for the operator's own WhatsApp number.
 *
 * The GET used to read `conversations` with no business_id filter at all, so
 * this admin screen listed every tenant's customer chats — every phone number
 * and message body in the database. It is now scoped to the operator's own
 * business, resolved from WHATSAPP_BUSINESS_NUMBER.
 */

const noStore = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filterPhone = searchParams.get('phone');

    const businessId = await resolveOperatorBusinessId();
    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          threads: [],
          error:
            'WHATSAPP_BUSINESS_NUMBER is not set, or no business is registered against it. Refusing to list conversations unscoped.',
        },
        { status: 409, headers: noStore }
      );
    }

    let query = supabase
      .from('conversations')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true });

    if (filterPhone) {
      const clean = filterPhone.replace(/\D/g, '');
      query = query.or(`customer_number.ilike.%${clean}%,customer_number.ilike.%${filterPhone}%`);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('[Admin Conversations Error]:', error.message);
      return NextResponse.json({ success: false, threads: [], error: error.message }, { status: 500, headers: noStore });
    }

    // Real lead names, where we have them, instead of guessing from pitch text.
    const { data: leadRows } = await supabase
      .from('lead_hunter_leads')
      .select('phone_number, business_name, category, city, status, consent_status');

    const leadByLast10: Record<string, any> = {};
    (leadRows || []).forEach((lead: any) => {
      const key = String(lead.phone_number || '').replace(/\D/g, '').slice(-10);
      if (key.length === 10) leadByLast10[key] = lead;
    });

    const threadMap: Record<string, any> = {};

    (messages || []).forEach((msg) => {
      const rawPhone = msg.customer_number || '';
      const cleanKey = rawPhone.replace(/\D/g, '');
      if (!cleanKey) return;

      const formattedPhone = rawPhone.startsWith('+') ? rawPhone : `+${cleanKey}`;
      const isClient =
        msg.message_direction === 'inbound' || msg.sender === 'customer' || msg.sender === 'inbound';
      const text = msg.message_text || msg.message || '';
      const lead = leadByLast10[cleanKey.slice(-10)];

      // Prefer the stored lead name; fall back to parsing the pitch we sent.
      let resolvedName = lead?.business_name || msg.business_name;
      if (!resolvedName || String(resolvedName).startsWith('Lead (')) {
        const pitchMatch = text.match(/(?:Namaste|Hello)\s+(?:Dr\.\s*\/\s*Team|Dr\.|Team)?\s*\*([^*]+)\*/i);
        if (pitchMatch && pitchMatch[1]) resolvedName = pitchMatch[1].trim();
      }

      if (!threadMap[cleanKey]) {
        threadMap[cleanKey] = {
          phone: formattedPhone,
          business_name: resolvedName || `Lead (+${cleanKey})`,
          category: lead?.category || msg.category || 'lead',
          city: lead?.city || null,
          lead_status: lead?.status || null,
          consent_status: lead?.consent_status || null,
          last_message: text,
          last_sender: isClient ? 'client' : 'bot',
          last_timestamp: msg.created_at || new Date().toISOString(),
          unread: isClient,
          messages: [],
        };
      } else if (
        resolvedName &&
        (!threadMap[cleanKey].business_name || threadMap[cleanKey].business_name.startsWith('Lead ('))
      ) {
        threadMap[cleanKey].business_name = resolvedName;
      }

      // Collapse an identical message re-sent within 10s (a delivery retry).
      const existingMsgs = threadMap[cleanKey].messages;
      const lastSaved = existingMsgs[existingMsgs.length - 1];
      const isDuplicateRetry =
        lastSaved &&
        lastSaved.sender === (isClient ? 'client' : 'bot') &&
        lastSaved.text.trim() === text.trim() &&
        Math.abs(new Date(msg.created_at || 0).getTime() - new Date(lastSaved.timestamp || 0).getTime()) < 10000;

      if (!isDuplicateRetry) {
        threadMap[cleanKey].messages.push({
          id: msg.id || `msg_${cleanKey}_${existingMsgs.length}`,
          text,
          sender: isClient ? 'client' : 'bot',
          timestamp: msg.created_at || new Date().toISOString(),
        });
      }

      threadMap[cleanKey].last_message = text;
      threadMap[cleanKey].last_sender = isClient ? 'client' : 'bot';
      threadMap[cleanKey].last_timestamp = msg.created_at || new Date().toISOString();
      if (isClient) threadMap[cleanKey].unread = true;
    });

    const threads = Object.values(threadMap).sort(
      (a: any, b: any) => new Date(b.last_timestamp).getTime() - new Date(a.last_timestamp).getTime()
    );

    return NextResponse.json({ success: true, count: threads.length, threads }, { headers: noStore });
  } catch (error: any) {
    console.error('[Admin Conversations GET Exception]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: noStore });
  }
}

/** POST — manual reply from the dashboard to a prospect. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, message } = body;

    if (!phone || !message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Phone and message required' }, { status: 400 });
    }

    const cleanPhone = normalizeIndianPhone(phone);
    if (!cleanPhone) {
      return NextResponse.json(
        { success: false, error: `"${phone}" is not a valid 10-digit Indian mobile number.` },
        { status: 400 }
      );
    }

    // An operator typing into the dashboard can still not message someone who
    // has asked to be left alone.
    if (await hasOptedOut(cleanPhone)) {
      return NextResponse.json(
        {
          success: false,
          blocked: true,
          error: 'This number has opted out of messages. Nothing was sent.',
        },
        { status: 403 }
      );
    }

    const businessId = await resolveOperatorBusinessId();

    console.log(`[Admin Chat Dispatch] 📤 Manual reply to ${cleanPhone} (${message.length} chars)...`);
    const sendResult = await sendWhatsAppTextMessage(cleanPhone, message);

    if (!sendResult.success) {
      return NextResponse.json(
        { success: false, error: sendResult.error || 'WhatsApp send failed.', notConfigured: sendResult.notConfigured },
        { status: 502 }
      );
    }

    if (businessId) {
      const { error: dbErr } = await supabase.from('conversations').insert({
        business_id: businessId,
        customer_number: cleanPhone,
        message_text: message,
        message_direction: 'outbound',
      });
      if (dbErr) console.warn('[Admin Chat DB Save Notice]:', dbErr.message);
    } else {
      console.warn('[Admin Chat] No operator business resolved — reply sent but not logged.');
    }

    return NextResponse.json({
      success: true,
      phone: cleanPhone,
      message,
      messageId: sendResult.messageId,
      sentAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Admin Chat POST Exception]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
