import { supabase } from '../config/supabase';
import { getGroqChatCompletion } from './groqService';
import { sendWhatsAppMessage } from './whatsappService';
import { sendPartnerAlert } from './partnerAlertService';
import {
  buildCASupportPrompt,
  buildCALeadQualificationPrompt,
  buildCALeadClassifierPrompt,
  buildCADocumentRequestPrompt,
  buildCAPaymentThanksPrompt,
} from './promptBuilder';
import type {
  CAClient,
  CAComplianceRecord,
  CADocumentTracker,
  CALead,
  CAQueryLog,
} from '../types';

/**
 * Normalizes phone numbers for reliable DB matching (e.g. strips + and 91 prefixes if needed)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Finds a registered CA client by phone or email (with fallback to compliance/document records)
 */
export async function findCAClient(identifier: { phone?: string; email?: string; businessId?: string }): Promise<CAClient | null> {
  const cleanPhone = identifier.phone ? normalizePhoneNumber(identifier.phone) : '';
  const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
  const cleanEmail = identifier.email?.trim().toLowerCase() || '';

  try {
    // 1. Search ca_clients table
    let query = supabase.from('ca_clients').select('*');

    if (cleanPhone && cleanEmail) {
      query = query.or(`phone.ilike.%${last10}%,email.ilike.%${cleanEmail}%`);
    } else if (cleanPhone) {
      query = query.or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${last10}%`);
    } else if (cleanEmail) {
      query = query.ilike('email', cleanEmail);
    } else {
      return null;
    }

    const { data: clientData } = await query.limit(1).maybeSingle();
    if (clientData) {
      return clientData as CAClient;
    }

    // 2. Fallback: check if client has compliance calendar or document tracker records
    if (last10) {
      const { data: compData } = await supabase
        .from('ca_compliance_calendar')
        .select('*')
        .or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${last10}%`)
        .limit(1)
        .maybeSingle();

      if (compData) {
        return {
          id: compData.client_id || `temp-${last10}`,
          business_id: compData.business_id || identifier.businessId,
          client_name: compData.client_name || 'Valued Client',
          phone: compData.phone || cleanPhone,
          email: compData.email,
          entity_type: 'Proprietorship',
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as CAClient;
      }

      const { data: docData } = await supabase
        .from('ca_documents_tracker')
        .select('*')
        .or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${last10}%`)
        .limit(1)
        .maybeSingle();

      if (docData) {
        return {
          id: docData.client_id || `temp-${last10}`,
          business_id: docData.business_id || identifier.businessId,
          client_name: docData.client_name || 'Valued Client',
          phone: docData.phone || cleanPhone,
          entity_type: 'Proprietorship',
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as CAClient;
      }
    }

    return null;
  } catch (err: any) {
    console.error('[CAService] findCAClient exception:', err.message);
    return null;
  }
}

/**
 * Fetches live compliance records for a client by ID and/or phone
 */
export async function getClientCompliances(clientId?: string, phone?: string): Promise<CAComplianceRecord[]> {
  try {
    const cleanPhone = phone ? normalizePhoneNumber(phone) : '';
    const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

    let query = supabase.from('ca_compliance_calendar').select('*');

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUuid = clientId && uuidRegex.test(clientId);

    if (isValidUuid && last10) {
      query = query.or(`client_id.eq.${clientId},phone.ilike.%${last10}%`);
    } else if (isValidUuid) {
      query = query.eq('client_id', clientId);
    } else if (last10) {
      query = query.or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${last10}%`);
    } else {
      return [];
    }

    const { data, error } = await query.order('due_date', { ascending: true });

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
 * Fetches pending & requested documents for a client by ID and/or phone
 */
export async function getClientDocuments(clientId?: string, phone?: string): Promise<CADocumentTracker[]> {
  try {
    const cleanPhone = phone ? normalizePhoneNumber(phone) : '';
    const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

    let query = supabase.from('ca_documents_tracker').select('*');

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUuid = clientId && uuidRegex.test(clientId);

    if (isValidUuid && last10) {
      query = query.or(`client_id.eq.${clientId},phone.ilike.%${last10}%`);
    } else if (isValidUuid) {
      query = query.eq('client_id', clientId);
    } else if (last10) {
      query = query.or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${last10}%`);
    } else {
      return [];
    }

    const { data, error } = await query.order('requested_date', { ascending: false });

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
  const lowerMsg = userMessage.trim().toLowerCase();
  if (
    lowerMsg === 'confirm' ||
    lowerMsg === 'proceed' ||
    lowerMsg === 'yes' ||
    lowerMsg === 'accepted' ||
    lowerMsg.startsWith('confirm') ||
    lowerMsg.startsWith('proceed')
  ) {
    const welcomeConfirm =
      `🎉 *Welcome to ${firmName}!* 🏛️\n\n` +
      `Dear ${client.client_name},\n` +
      `Thank you for confirming! Your engagement has been officially confirmed and activated.\n\n` +
      `📋 *Next Steps:*\n` +
      `1️⃣ Our team is setting up your compliance ledger.\n` +
      `2️⃣ We will send you your tailored document checklist shortly.\n` +
      `3️⃣ You can ask questions in this chat 24/7 regarding your tax deadlines or filing status!\n\n` +
      `We look forward to serving you!`;

    await logCAQuery({
      business_id: client.business_id,
      client_id: client.id,
      phone: client.phone,
      email: client.email,
      channel,
      query_text: userMessage,
      ai_response: welcomeConfirm,
    });

    return welcomeConfirm;
  }

  const [compliances, documents] = await Promise.all([
    getClientCompliances(client.id, client.phone),
    getClientDocuments(client.id, client.phone),
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
  client: Partial<CAClient> & { phone: string; client_name: string },
  media: { url?: string; mediaId?: string; mimeType?: string; filename?: string },
  firmName = 'Webcore CA & Advisory'
): Promise<{ text: string; matchedDoc?: CADocumentTracker }> {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validBusinessId = client.business_id && uuidRegex.test(client.business_id) ? client.business_id : null;
    const validClientId = client.id && uuidRegex.test(client.id) ? client.id : null;
    const cleanPhone = normalizePhoneNumber(client.phone);
    const last10 = cleanPhone.slice(-10);

    // 1. Fetch all pending documents for this client
    const { data: pendingDocs } = await supabase
      .from('ca_documents_tracker')
      .select('*')
      .eq('status', 'Pending')
      .order('requested_date', { ascending: true });

    // Filter in JS for 100% reliable matching by client_id or phone
    const clientPending = (pendingDocs || []).filter((doc: any) => {
      if (validClientId && doc.client_id === validClientId) return true;
      if (!doc.phone) return false;
      const docClean = normalizePhoneNumber(doc.phone);
      return docClean === cleanPhone || (last10 && docClean.endsWith(last10));
    });

    const filename = (media.filename || '').toLowerCase();

    // Find best match by filename keywords or fallback to oldest
    let matchedDoc: CADocumentTracker | undefined = undefined;
    if (clientPending.length > 0) {
      matchedDoc = clientPending.find((doc: any) => {
        const nameLower = (doc.document_name || '').toLowerCase();
        const keywords = nameLower.split(/[\s/,\-_()]+/).filter((k: string) => k.length > 2);
        return keywords.some((k: string) => filename.includes(k));
      }) || clientPending[0];
    }

    const storageUrl = media.url || (media.mediaId ? `/api/ca/media/${media.mediaId}` : '#');

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

      const replyText = `✅ Thank you ${client.client_name}! We have received your *${matchedDoc.document_name}* (${matchedDoc.compliance_type}). Our team will review and verify it shortly.`;
      return { text: replyText, matchedDoc };
    } else {
      // Create a generic received document entry
      await supabase.from('ca_documents_tracker').insert([
        {
          business_id: validBusinessId,
          client_id: validClientId,
          client_name: client.client_name,
          phone: client.phone,
          email: client.email || null,
          compliance_type: 'General',
          document_name: media.filename || 'Submitted Document / Statement',
          status: 'Received',
          storage_url: storageUrl,
          received_date: new Date().toISOString(),
          requested_date: new Date().toISOString(),
          followup_count: 0,
        },
      ]);

      const replyText = `✅ Thank you ${client.client_name}, we have received your document (*${media.filename || 'Attachment'}*)! Our team will review it and get back to you if anything else is needed.`;
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

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const validBusinessId = businessId && uuidRegex.test(businessId) && businessId !== 'demo-business-id'
    ? businessId
    : null;

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
    try {
      const { data: newLead } = await supabase
        .from('ca_leads')
        .insert([
          {
            business_id: validBusinessId,
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
    } catch (dbErr: any) {
      console.warn('[CAService] Lead insert fallback:', dbErr.message);
    }
  }

  if (!existingLead) {
    existingLead = {
      id: 'lead-' + Date.now(),
      name: contactName || 'Prospective Client',
      phone: cleanPhone,
      source,
      status: 'New',
      created_at: new Date().toISOString(),
    } as any;
  }

  // 1.5 Check if user is confirming / accepting the proposal quotation
  const lowerMsg = userMessage.trim().toLowerCase();
  const isConfirmKeyword =
    lowerMsg === 'confirm' ||
    lowerMsg === 'proceed' ||
    lowerMsg === 'yes' ||
    lowerMsg === 'accepted' ||
    lowerMsg === 'i confirm' ||
    lowerMsg.startsWith('confirm') ||
    lowerMsg.startsWith('proceed') ||
    lowerMsg.includes('confirm engagement') ||
    lowerMsg.includes('please proceed');

  if (isConfirmKeyword) {
    const clientName = existingLead.name || contactName || 'Valued Client';
    
    // 1. Auto Onboard into ca_clients
    const { data: existingClient } = await supabase
      .from('ca_clients')
      .select('*')
      .ilike('phone', `%${cleanPhone.slice(-10)}%`)
      .maybeSingle();

    if (!existingClient) {
      await supabase.from('ca_clients').insert({
        business_id: validBusinessId,
        client_name: clientName,
        phone: cleanPhone,
        entity_type: existingLead.business_type || 'Private Limited',
        status: 'Active',
      });
    }

    // 2. Mark ca_leads as Converted
    await supabase
      .from('ca_leads')
      .update({
        status: 'Converted',
        qualification_score: 'Hot',
        notes: `${existingLead.notes ? existingLead.notes + '\n' : ''}[${new Date().toISOString().slice(0, 10)}] Engagement confirmed via WhatsApp ('${userMessage}').`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingLead.id);

    existingLead.status = 'Converted';

    // 3. Dispatch Partner Alert
    await sendPartnerAlert({
      type: 'hot_lead',
      title: '🎉 New Client Engagement Confirmed (WhatsApp)',
      details: {
        name: clientName,
        phone: cleanPhone,
        status: 'Converted to Active Client',
        service: existingLead.requirement || 'CA & Tax Advisory',
        confirmation: userMessage,
      },
    });

    const welcomeLetter =
      `🎉 *Welcome to ${firmName}!* 🏛️\n\n` +
      `Dear ${clientName},\n` +
      `Thank you for confirming! We are delighted to officially onboard you as a valued client of our firm. Your engagement for *Corporate Compliance & Tax Advisory* is now active.\n\n` +
      `📋 *Your Onboarding Roadmap:*\n` +
      `1️⃣ *Client Profile:* Initialized in our Compliance & Filing Directory.\n` +
      `2️⃣ *Tax Calendar:* Active statutory deadline tracking (GST, ITR & Audit).\n` +
      `3️⃣ *Document Checklist:* Our team will dispatch your specific filing checklist shortly.\n` +
      `4️⃣ *24/7 AI Desk:* You can message this WhatsApp chat anytime to check upcoming due dates or pending documents.\n\n` +
      `👨‍💼 *Assigned Partner:* Senior CA Engagement Desk\n` +
      `📞 *Priority Support:* Direct WhatsApp Desk Active\n\n` +
      `We look forward to a successful and seamless financial partnership!`;

    await logCAQuery({
      business_id: businessId,
      client_id: existingLead.id,
      phone: cleanPhone,
      channel: source.toLowerCase() as any,
      query_text: userMessage,
      ai_response: welcomeLetter,
    });

    return { replyText: welcomeLetter, lead: existingLead, isHot: true };
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
  clientId?: string;
  clientName?: string;
  phone?: string;
  email?: string;
  complianceType: string;
  documents: string[];
  firmName?: string;
}): Promise<{ success: boolean; message: string; createdCount: number }> {
  const firmName = params.firmName || 'Webcore CA & Advisory';

  // Sanitize businessId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const validBusinessId = params.businessId && uuidRegex.test(params.businessId) && params.businessId !== 'demo-business-id'
    ? params.businessId
    : null;

  let client: any = null;

  // 1. Try to find client by ID if valid UUID
  if (params.clientId && uuidRegex.test(params.clientId)) {
    const { data: foundClient } = await supabase
      .from('ca_clients')
      .select('*')
      .eq('id', params.clientId)
      .maybeSingle();

    if (foundClient) {
      client = foundClient;
    }
  }

  // 2. If not found by ID, search by phone or client name
  if (!client && params.phone) {
    const cleanPhone = normalizePhoneNumber(params.phone);
    const { data: foundByPhone } = await supabase
      .from('ca_clients')
      .select('*')
      .or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${cleanPhone.slice(-10)}%`)
      .limit(1)
      .maybeSingle();

    if (foundByPhone) {
      client = foundByPhone;
    }
  }

  // 3. If still no client record, auto-create client in directory
  if (!client) {
    const clientName = params.clientName || (params.clientId && !uuidRegex.test(params.clientId) ? params.clientId : 'Valued Client');
    const clientPhone = params.phone || (params.clientId && /^\d+$/.test(params.clientId) ? params.clientId : '919876543210');

    try {
      const { data: newClient, error: createErr } = await supabase
        .from('ca_clients')
        .insert({
          business_id: validBusinessId,
          client_name: clientName,
          phone: clientPhone,
          email: params.email || null,
          entity_type: 'Proprietorship',
        })
        .select()
        .single();

      if (!createErr && newClient) {
        client = newClient;
      }
    } catch (err: any) {
      console.warn('[CAService] Auto-create client note:', err.message);
    }
  }

  const finalClientName = client?.client_name || params.clientName || 'Valued Client';
  const finalPhone = client?.phone || params.phone || '';
  const finalEmail = client?.email || params.email || null;
  const finalClientId = client?.id && uuidRegex.test(client.id) ? client.id : null;

  // 4. Insert Pending Rows into Documents Tracker
  const docRows = params.documents.map((docName) => ({
    business_id: validBusinessId,
    client_id: finalClientId,
    client_name: finalClientName,
    phone: finalPhone,
    email: finalEmail,
    compliance_type: params.complianceType,
    document_name: docName.trim(),
    status: 'Pending',
    requested_date: new Date().toISOString(),
    followup_count: 0,
  }));

  try {
    const { error: insertErr } = await supabase.from('ca_documents_tracker').insert(docRows);
    if (insertErr) {
      console.error('[CAService] Document rows insert error:', insertErr.message);
    }
  } catch (err: any) {
    console.error('[CAService] Document tracker insert exception:', err.message);
  }

  // 5. Draft AI checklist message
  const docListFormatted = params.documents.map((d, i) => `${i + 1}. ${d}`).join('\n');
  const prompt = buildCADocumentRequestPrompt(firmName, finalClientName, params.complianceType, docListFormatted);

  let requestMessage = '';
  try {
    requestMessage = await getGroqChatCompletion(
      [{ role: 'user', content: prompt }],
      { temperature: 0.2 }
    );
  } catch (aiErr: any) {
    console.warn('[CAService] Groq drafting fallback:', aiErr.message);
    requestMessage = `Hello ${finalClientName},\n\nThis is a request from *${firmName}* for your upcoming *${params.complianceType}* filing.\n\nPlease share the following documents at your earliest convenience:\n${docListFormatted}\n\nThank you!`;
  }

  // 6. Send via WhatsApp
  if (finalPhone) {
    try {
      await sendWhatsAppMessage(finalPhone, requestMessage);
    } catch (waErr: any) {
      console.warn('[CAService] WhatsApp dispatch note:', waErr.message);
    }
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
