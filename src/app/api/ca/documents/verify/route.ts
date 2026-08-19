import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { sendWhatsAppMessage } from '@/services/whatsappService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { doc_id, status, reason, firm_name } = await req.json();
    if (!doc_id || !status) {
      return NextResponse.json({ error: 'doc_id and status required' }, { status: 400 });
    }

    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'Verified') {
      updates.verified_date = new Date().toISOString();
    } else if (status === 'Rejected') {
      updates.notes = reason || 'Document rejected. Re-upload requested.';
    }

    const { data, error } = await supabase
      .from('ca_documents_tracker')
      .update(updates)
      .eq('id', doc_id)
      .select()
      .single();

    if (error) throw error;

    // Send automated WhatsApp notification to the client
    if (data && data.phone) {
      const firm = firm_name || 'Apex Tax & Financial Advisors';
      let message = '';

      if (status === 'Verified') {
        message = `✅ *Document Verified & Accepted*\n\nDear *${data.client_name || 'Client'}*,\nYour submitted document *${data.document_name}* for *${data.compliance_type}* has been reviewed and successfully verified by our compliance team.\n\nThank you for sharing!\n— Team ${firm}`;
      } else if (status === 'Rejected') {
        const reasonText = reason ? `\n📌 *Reason:* ${reason}\n` : '\n📌 *Reason:* Unclear scan or missing pages.\n';
        message = `⚠️ *Action Required: Document Needs Re-upload*\n\nDear *${data.client_name || 'Client'}*,\nWe reviewed your submitted document *${data.document_name}* for *${data.compliance_type}* and unfortunately it could not be accepted.${reasonText}\n🔄 *Please reply directly to this chat with a clear PDF or photo to re-upload your document.*\n\nThank you!\n— Team ${firm}`;
      }

      if (message) {
        try {
          await sendWhatsAppMessage(data.phone, message);
        } catch (waErr: any) {
          console.warn('[CA Verify Doc] WhatsApp notification notice:', waErr.message);
        }
      }
    }

    return NextResponse.json({ success: true, document: data });
  } catch (err: any) {
    console.error('[CA Verify Doc API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
