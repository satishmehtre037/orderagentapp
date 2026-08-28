import { NextResponse } from 'next/server';
import { sendWhatsAppInteractiveButtons } from '@/lib/whatsapp';
import { supabase } from '@/config/supabase';
import { resolveOperatorBusinessId } from '@/services/businessService';
import { checkOutreachAllowed, normalizeIndianPhone } from '@/services/optOutService';
import {
  buildPersonalizedPitch,
  renderCustomMessage,
  PITCH_BUTTONS,
  OPT_OUT_FOOTER,
} from '@/services/pitchTemplates';

export const dynamic = 'force-dynamic';

/**
 * Dispatches a single cold pitch.
 *
 * Two things changed here. The pitch templates now live in one place
 * (services/pitchTemplates) instead of being duplicated verbatim from
 * campaignService, and nothing is dispatched until checkOutreachAllowed()
 * passes — previously any phone number in the request body was messaged
 * immediately, with no opt-out check and no recorded basis for contact.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lead, pitchType = 'all_in_one', customMessage, senderName = 'Satish (WebCore Studios)' } = body;

    if (!lead || !lead.phone_number) {
      return NextResponse.json(
        { success: false, error: 'Target lead with a valid phone number is required.' },
        { status: 400 }
      );
    }

    const cleanPhone = normalizeIndianPhone(lead.phone_number);
    if (!cleanPhone) {
      return NextResponse.json(
        { success: false, error: `"${lead.phone_number}" is not a valid Indian mobile number.` },
        { status: 400 }
      );
    }

    // Read consent from the stored record, not from the request body — the
    // client cannot assert its own permission to send.
    let consentStatus: string | null = null;
    let leadRow: any = null;

    if (lead.id) {
      const { data } = await supabase
        .from('lead_hunter_leads')
        .select('id, consent_status, business_name, category, city, contact_attempts, first_contacted_at')
        .eq('id', lead.id)
        .maybeSingle();
      leadRow = data;
      consentStatus = data?.consent_status ?? null;
    } else {
      const digits = cleanPhone.replace(/\D/g, '').slice(-10);
      const { data } = await supabase
        .from('lead_hunter_leads')
        .select('id, consent_status, business_name, category, city, contact_attempts, first_contacted_at')
        .like('phone_number', `%${digits}`)
        .limit(1)
        .maybeSingle();
      leadRow = data;
      consentStatus = data?.consent_status ?? null;
    }

    const gate = await checkOutreachAllowed({ phone: cleanPhone, consentStatus });
    if (!gate.allowed) {
      console.warn(`[Lead Hunter] 🚫 Blocked dispatch to ${cleanPhone}: ${gate.reason} — ${gate.detail}`);
      return NextResponse.json(
        { success: false, blocked: true, reason: gate.reason, error: gate.detail },
        { status: 403 }
      );
    }

    const businessName = leadRow?.business_name || lead.business_name || 'Business Owner';
    const city = leadRow?.city || lead.city || 'your city';
    const category = leadRow?.category || lead.category || 'business';

    const pitchText =
      customMessage && customMessage.trim().length > 0
        ? renderCustomMessage(customMessage, { businessName, city, category, senderName }) + OPT_OUT_FOOTER
        : buildPersonalizedPitch(businessName, category, city, pitchType, senderName);

    console.log(`[Lead Hunter Outreach] 📤 Dispatching pitch to ${businessName} (${cleanPhone})...`);

    const waResult = await sendWhatsAppInteractiveButtons(cleanPhone, pitchText, [...PITCH_BUTTONS]);

    if (!waResult?.success) {
      // Record the failure rather than reporting a send that did not happen.
      if (leadRow?.id) {
        await supabase
          .from('lead_hunter_leads')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', leadRow.id);
      }
      return NextResponse.json(
        { success: false, error: waResult?.error || 'WhatsApp dispatch failed.', waResponse: waResult },
        { status: 502 }
      );
    }

    const businessId = await resolveOperatorBusinessId();

    if (businessId) {
      await supabase.from('conversations').insert({
        business_id: businessId,
        customer_number: cleanPhone,
        message_text: pitchText,
        message_direction: 'outbound',
      });
    }

    if (leadRow?.id) {
      const now = new Date().toISOString();
      await supabase
        .from('lead_hunter_leads')
        .update({
          status: 'sent',
          pitch_type: pitchType,
          first_contacted_at: leadRow.first_contacted_at || now,
          last_contacted_at: now,
          contact_attempts: (leadRow.contact_attempts || 0) + 1,
          updated_at: now,
        })
        .eq('id', leadRow.id);
    }

    return NextResponse.json({
      success: true,
      phone: cleanPhone,
      pitchType,
      messagePreview: pitchText.slice(0, 120) + '...',
      waResponse: waResult,
    });
  } catch (error: any) {
    console.error('[Lead Hunter Pitch Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
