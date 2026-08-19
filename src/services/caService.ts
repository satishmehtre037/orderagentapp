import { supabase } from '../config/supabase.js';
import { getGroqChatCompletion } from './groqService.js';
import { sendWhatsAppMessage } from './whatsappService.js';
import { sendPartnerAlert } from './partnerAlertService.js';
import {
  buildCASupportPrompt,
  buildCALeadQualificationPrompt,
  buildCALeadClassifierPrompt,
  buildCADocumentRequestPrompt,
  buildCAPaymentThanksPrompt,
} from './promptBuilder.js';
import type {
  CAClient,
  CAComplianceRecord,
  CADocumentTracker,
  CALead,
  CAQueryLog,
} from '../types/index.js';

/**
 * Normalizes phone numbers for reliable DB matching (e.g. strips + and 91 prefixes if needed)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Finds a registered CA client by phone or email
 */
export async function findCAClient(identifier: { phone?: string; email?: string; businessId?: string }): Promise<CAClient | null> {
  const cleanPhone = identifier.phone ? normalizePhoneNumber(identifier.phone) : '';
  const cleanEmail = identifier.email?.trim().toLowerCase() || '';

  try {
    let query = supabase.from('ca_clients').select('*');

    if (identifier.businessId) {
      query = query.eq('business_id', identifier.businessId);
    }

    if (cleanPhone && cleanEmail) {
      query = query.or(`phone.ilike.%${cleanPhone}%,email.ilike.%${cleanEmail}%`);
    } else if (cleanPhone) {
      query = query.or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${cleanPhone.slice(-10)}%`);
    } else if (cleanEmail) {
      query = query.ilike('email', cleanEmail);
    } else {
      return null;
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) {
      console.warn('[CAService] Client lookup error:', error.message);
      return null;
    }
    return data as CAClient | null;
  } catch (err: any) {
    console.error('[CAService] findCAClient exception:', err.message);
    return null;
  }
}

/**
 * Fetches live compliance records for a client
 */
export async function getClientCompliances(clientId: string): Promise<CAComplianceRecord[]> {
  try {
    const { data, error } = await supabase
      .from('ca_compliance_calendar')
      .select('*')
      .eq('client_id', clientId)
      .order('due_date', { ascending: true });

    if (error) {
      console.warn('[CAService] getClientCompliances error:', error.message);
      return [];
    }
    return (data || []) as CAComplianceRecord[];
  } catch (err: any) {
    console.error('[CAService] getClientCompliances exception:', err.message);
    return [];
  }
}

/**
 * Fetches pending & requested documents for a client
 */
export async function getClientDocuments(clientId: string): Promise<CADocumentTracker[]> {
  try {
    const { data, error } = await supabase
      .from('ca_documents_tracker')
      .select('*')
      .eq('client_id', clientId)
      .order('requested_date', { ascending: false });

    if (error) {
      console.warn('[CAService] getClientDocuments error:', error.message);
      return [];
    }
    return (data || []) as CADocumentTracker[];
  } catch (err: any) {
    console.error('[CAService] getClientDocuments exception:', err.message);
    return [];
  }
}

/**
 * Handles incoming query from a known client (injects live compliance calendar & document tracker)
 */
export async function handleCAClientQuery(
  client: CAClient,
  userMessage: string,
  channel: 'whatsapp' | 'email' | 'web' = 'whatsapp',
  firmName = 'Webcore CA & Advisory'
): Promise<string> {
  const [compliances, documents] = await Promise.all([
    getClientCompliances(client.id),
    getClientDocuments(client.id),
  ]);

  const systemPrompt = buildCASupportPrompt(firmName, client.client_name, compliances, documents);

  const aiReply = await getGroqChatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    { temperature: 0.2 }
  );

  // Audit log query
  await logCAQuery({
    business_id: client.business_id,
    client_id: client.id,
    phone: client.phone,
    email: client.email,
    channel,
    query_text: userMessage,
    ai_response: aiReply,
  });

  return aiReply;
}

/**
 * Processes incoming client media (PDFs, images, bank statements) uploaded via WhatsApp or Web
 */
export async function processIncomingDocument(
  client: CAClient,
  media: { url?: string; mediaId?: string; mimeType?: string; filename?: string },
  firmName = 'Webcore CA & Advisory'
): Promise<{ text: string; matchedDoc?: CADocumentTracker }> {
  try {
    // 1. Find the oldest pending document requested for this client
    const { data: pendingDocs } = await supabase
      .from('ca_documents_tracker')
      .select('*')
      .eq('client_id', client.id)
      .eq('status', 'Pending')
      .order('requested_date', { ascending: true })
      .limit(1);

    const matchedDoc = (pendingDocs && pendingDocs.length > 0) ? (pendingDocs[0] as CADocumentTracker) : undefined;

    const storageUrl = media.url || `https://wa-media-placeholder/${media.mediaId || Date.now()}`;

    if (matchedDoc) {
      // Mark pending document as received
      await supabase
        .from('ca_documents_tracker')
        .update({
          status: 'Received',
          received_date: new Date().toISOString(),
          storage_url: storageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchedDoc.id);

      const replyText = `Thank you ${client.client_name}! We have received your *${matchedDoc.document_name}* (${matchedDoc.compliance_type}). Our team will review and verify it shortly.`;
      return { text: replyText, matchedDoc };
    } else {
      // Create a generic received document entry
      await supabase.from('ca_documents_tracker').insert([
        {
          business_id: client.business_id,
          client_id: client.id,
          client_name: client.client_name,
          phone: client.phone,
          email: client.email,
          compliance_type: 'General',
          document_name: media.filename || 'Submitted Document / Statement',
          status: 'Received',
          storage_url: storageUrl,
          received_date: new Date().toISOString(),
        },
      ]);

      const replyText = `Thank you ${client.client_name}, we have received your document! Our team will review it and get back to you if anything else is needed.`;
      return { text: replyText };
    }
  } catch (err: any) {
    console.error('[CAService] processIncomingDocument error:', err.message);
    return {
      text: `Thank you ${client.client_name}, your document has been received and queued for review.`,
    };
  }
}

/**
 * Handles incoming message from an unknown number (Lead Qualification & Hot Scoring)
 */
export async function handleCALeadInquiry(
  phone: string,
  userMessage: string,
  contactName?: string,
  source: 'WhatsApp' | 'Website' | 'Email' = 'WhatsApp',
  businessId?: string,
  firmName = 'Webcore CA & Advisory'
): Promise<{ replyText: string; lead: CALead; isHot: boolean }> {
  const cleanPhone = normalizePhoneNumber(phone);

  // 1. Find or create lead record
  let existingLead: CALead | null = null;
  const { data: leadQuery } = await supabase
    .from('ca_leads')
    .select('*')
    .eq('phone', cleanPhone)
    .maybeSingle();

  if (leadQuery) {
    existingLead = leadQuery as CALead;
  } else {
    const { data: newLead } = await supabase
      .from('ca_leads')
      .insert([
        {
          business_id: businessId,
          name: contactName || 'Prospective Client',
          phone: cleanPhone,
          source,
          status: 'New',
          followup_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          followup_attempts: 0,
        },
      ])
      .select('*')
      .single();
    existingLead = newLead as CALead;
  }

  // 2. Generate Lead Qualification Agent Response
  const qualificationPrompt = buildCALeadQualificationPrompt(firmName);
  const replyText = await getGroqChatCompletion(
    [
      { role: 'system', content: qualificationPrompt },
      { role: 'user', content: userMessage },
    ],
    { temperature: 0.3 }
  );

  // 3. Extract Lead Classification JSON
  let isHot = false;
  try {
    const classifierPrompt = buildCALeadClassifierPrompt(userMessage, replyText);
    const classificationRaw = await getGroqChatCompletion(
      [{ role: 'user', content: classifierPrompt }],
      { temperature: 0.1 }
    );

    const jsonMatch = classificationRaw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      isHot = parsed.score === 'Hot';

      // Update lead record
      await supabase
        .from('ca_leads')
        .update({
          requirement: parsed.requirement || existingLead.requirement,
          business_type: parsed.business_type || existingLead.business_type,
          urgency: parsed.urgency || existingLead.urgency,
          qualification_score: parsed.score || existingLead.qualification_score,
          status: isHot ? 'Hot' : 'Qualifying',
          notes: `${existingLead.notes ? existingLead.notes + '\n' : ''}[${new Date().toISOString().slice(0, 10)}] ${userMessage}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id);

      existingLead.requirement = parsed.requirement;
      existingLead.qualification_score = parsed.score;
    }
  } catch (classErr: any) {
    console.warn('[CAService] Lead classification parsing error:', classErr.message);
  }

  // 4. If Hot Lead, trigger Partner Telegram / WhatsApp Alert immediately
  if (isHot) {
    await sendPartnerAlert({
      type: 'hot_lead',
      title: '🔥 Hot CA Lead Inbound',
      details: {
        name: existingLead.name,
        phone: existingLead.phone,
        requirement: existingLead.requirement || 'Unclear',
        urgency: existingLead.urgency || 'High',
        score: 'Hot',
        channel: source,
        message: userMessage,
      },
    });
  }

  // 5. Log query
  await logCAQuery({
    business_id: businessId,
    client_id: existingLead.id,
    phone: cleanPhone,
    channel: source.toLowerCase() as any,
    query_text: userMessage,
    ai_response: replyText,
  });

  return { replyText, lead: existingLead, isHot };
}

/**
 * Initiates a document checklist request to a client (WhatsApp & Email)
 */
export async function requestClientDocuments(params: {
  businessId?: string;
  clientId: string;
  complianceType: string;
  documents: string[];
  firmName?: string;
}): Promise<{ success: boolean; message: string; createdCount: number }> {
  const firmName = params.firmName || 'Webcore CA & Advisory';

  // 1. Fetch Client
  const { data: client, error: clientErr } = await supabase
    .from('ca_clients')
    .select('*')
    .eq('id', params.clientId)
    .single();

  if (clientErr || !client) {
    throw new Error('Client not found');
  }

  // 2. Insert Pending Rows into Documents Tracker
  const docRows = params.documents.map((docName) => ({
    business_id: params.businessId || client.business_id,
    client_id: client.id,
    client_name: client.client_name,
    phone: client.phone,
    email: client.email,
    compliance_type: params.complianceType,
    document_name: docName.trim(),
    status: 'Pending',
    requested_date: new Date().toISOString(),
    followup_count: 0,
  }));

  const { error: insertErr } = await supabase.from('ca_documents_tracker').insert(docRows);
  if (insertErr) {
    console.error('[CAService] Document rows insert error:', insertErr.message);
  }

  // 3. Draft AI checklist message
  const docListFormatted = params.documents.map((d, i) => `${i + 1}. ${d}`).join('\n');
  const prompt = buildCADocumentRequestPrompt(firmName, client.client_name, params.complianceType, docListFormatted);

  const requestMessage = await getGroqChatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.2 }
  );

  // 4. Send via WhatsApp
  if (client.phone) {
    await sendWhatsAppMessage(client.phone, requestMessage);
  }

  return {
    success: true,
    message: requestMessage,
    createdCount: params.documents.length,
  };
}

/**
 * Records fee payment, marks invoice paid, and dispatches thank you receipt
 */
export async function recordInvoicePayment(params: {
  invoiceId: string;
  amountPaid?: number;
  paymentDate?: string;
  firmName?: string;
}): Promise<{ success: boolean; message: string }> {
  const firmName = params.firmName || 'Webcore CA & Advisory';

  // 1. Look up invoice
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', params.invoiceId)
    .maybeSingle();

  if (invErr || !invoice) {
    // If not found in invoices table, check fallback or return standard response
    console.warn('[CAService] Invoice not found in DB:', params.invoiceId);
    return { success: false, message: 'Invoice ID not found' };
  }

  // 2. Mark Invoice Paid
  await supabase
    .from('invoices')
    .update({
      status: 'Paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoice.id);

  // 3. Draft Thank You Note
  const thanksPrompt = buildCAPaymentThanksPrompt(
    firmName,
    invoice.client_name || 'Client',
    invoice.id,
    params.amountPaid || invoice.amount || 0,
    invoice.currency || 'INR'
  );

  const thanksMessage = await getGroqChatCompletion(
    [{ role: 'user', content: thanksPrompt }],
    { temperature: 0.2 }
  );

  // 4. Send confirmation via WhatsApp if phone exists
  if (invoice.phone) {
    await sendWhatsAppMessage(invoice.phone, thanksMessage);
  }

  return { success: true, message: thanksMessage };
}

/**
 * Logs customer query and AI response for audit trail
 */
export async function logCAQuery(log: Partial<CAQueryLog>): Promise<void> {
  try {
    await supabase.from('ca_query_logs').insert([
      {
        business_id: log.business_id,
        client_id: log.client_id,
        phone: log.phone,
        email: log.email,
        channel: log.channel || 'whatsapp',
        query_text: log.query_text || '',
        ai_response: log.ai_response || '',
      },
    ]);
  } catch (err: any) {
    console.warn('[CAService] logCAQuery warning:', err.message);
  }
}
