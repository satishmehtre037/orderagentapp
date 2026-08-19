import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import {
  handleCALeadInquiry,
  requestClientDocuments,
  recordInvoicePayment,
} from '../services/caService.js';
import {
  runComplianceEngine,
  runDocumentChasingEngine,
  runLeadFollowupEngine,
  runInvoiceRecoveryEngine,
} from '../services/caCronService.js';

export const caRouter = Router();

// ==============================================================================
// 1. Webhook Entry Points (Branches 2, 4, 5 from n8n)
// ==============================================================================

/**
 * Branch 2: Website Lead Form Webhook (/api/ca/website-lead)
 * Accepts: { name, phone, email, message, source }
 */
caRouter.post('/website-lead', async (req, res) => {
  const b = req.body || {};
  const name = (b.name || '').toString().trim();
  const phone = (b.phone || '').toString().trim();
  const email = (b.email || '').toString().trim();
  const message = (b.message || b.requirement || '').toString().trim();
  const source = b.source || 'Website';

  if (!name || (!phone && !email)) {
    return res.status(400).json({
      error: 'bad_request',
      message: 'name and (phone or email) required',
    });
  }

  try {
    const result = await handleCALeadInquiry(
      phone || email,
      message || 'Inquiry from website lead form',
      name,
      'Website',
      b.business_id
    );

    return res.status(200).json({
      status: 'received',
      lead_id: result.lead?.id,
      score: result.lead?.qualification_score,
      isHot: result.isHot,
      opening_message: result.replyText,
    });
  } catch (err: any) {
    console.error('[CARoutes] website-lead error:', err.message);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

/**
 * Branch 4: Request Documents Webhook (/api/ca/request-documents)
 * Accepts: { client_id, compliance_type, documents: string[] }
 */
caRouter.post('/request-documents', async (req, res) => {
  const b = req.body || {};
  const clientId = (b.client_id || '').toString().trim();
  const complianceType = (b.compliance_type || 'General').toString().trim();
  const documents = Array.isArray(b.documents)
    ? b.documents.filter((d) => d && String(d).trim())
    : [];

  if (!clientId || documents.length === 0) {
    return res.status(400).json({
      error: 'bad_request',
      message: 'client_id and non-empty documents[] required',
    });
  }

  try {
    const result = await requestClientDocuments({
      businessId: b.business_id,
      clientId,
      complianceType,
      documents,
      firmName: b.firm_name,
    });

    return res.status(200).json({
      status: 'received',
      count: result.createdCount,
      message: result.message,
    });
  } catch (err: any) {
    console.error('[CARoutes] request-documents error:', err.message);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

/**
 * Branch 5: Payment Confirmation Webhook (/api/ca/payment-confirmation)
 * Accepts: { invoice_id, amount_paid, payment_date }
 */
caRouter.post('/payment-confirmation', async (req, res) => {
  const b = req.body || {};
  const invoiceId = (b.invoice_id || '').toString().trim();
  const amountPaid = b.amount_paid || b.amount;

  if (!invoiceId) {
    return res.status(400).json({
      error: 'bad_request',
      message: 'invoice_id required',
    });
  }

  try {
    const result = await recordInvoicePayment({
      invoiceId,
      amountPaid: amountPaid ? Number(amountPaid) : undefined,
      paymentDate: b.payment_date || new Date().toISOString(),
      firmName: b.firm_name,
    });

    return res.status(200).json({
      status: 'received',
      message: result.message,
    });
  } catch (err: any) {
    console.error('[CARoutes] payment-confirmation error:', err.message);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// ==============================================================================
// 2. Data Management Endpoints for Dashboard UI
// ==============================================================================

/**
 * Clients CRUD
 */
caRouter.get('/clients', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ca_clients')
      .select('*')
      .order('client_name', { ascending: true });

    if (error) throw error;
    return res.json({ clients: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

caRouter.post('/clients', async (req, res) => {
  const b = req.body || {};
  try {
    if (!b.client_name || !b.phone) {
      return res.status(400).json({ error: 'client_name and phone are required' });
    }

    const { data, error } = await supabase
      .from('ca_clients')
      .upsert({
        id: b.id || undefined,
        business_id: b.business_id,
        client_name: b.client_name,
        contact_person: b.contact_person,
        phone: b.phone,
        email: b.email,
        pan_gstin: b.pan_gstin,
        entity_type: b.entity_type || 'Proprietorship',
        partner_assigned: b.partner_assigned,
        status: b.status || 'Active',
        notes: b.notes,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;
    return res.json({ client: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Compliance Calendar Endpoints
 */
caRouter.get('/compliance', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ca_compliance_calendar')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return res.json({ compliances: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

caRouter.post('/compliance', async (req, res) => {
  const b = req.body || {};
  try {
    const { data, error } = await supabase
      .from('ca_compliance_calendar')
      .upsert({
        id: b.id || undefined,
        business_id: b.business_id,
        client_id: b.client_id,
        client_name: b.client_name,
        phone: b.phone,
        email: b.email,
        compliance_type: b.compliance_type,
        due_date: b.due_date,
        status: b.status || 'Pending',
        acknowledgement_number: b.acknowledgement_number,
        filed_date: b.status === 'Filed' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;
    return res.json({ compliance: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Documents Tracker Endpoints
 */
caRouter.get('/documents', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ca_documents_tracker')
      .select('*')
      .order('requested_date', { ascending: false });

    if (error) throw error;
    return res.json({ documents: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

caRouter.post('/documents/verify', async (req, res) => {
  const { doc_id, status } = req.body || {};
  try {
    const { data, error } = await supabase
      .from('ca_documents_tracker')
      .update({
        status: status || 'Verified',
        verified_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', doc_id)
      .select('*')
      .single();

    if (error) throw error;
    return res.json({ document: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Leads Pipeline Endpoints
 */
caRouter.get('/leads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ca_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ leads: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

caRouter.post('/leads/update', async (req, res) => {
  const b = req.body || {};
  try {
    const { data, error } = await supabase
      .from('ca_leads')
      .update({
        status: b.status,
        qualification_score: b.qualification_score,
        urgency: b.urgency,
        requirement: b.requirement,
        notes: b.notes,
        followup_date: b.followup_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', b.id)
      .select('*')
      .single();

    if (error) throw error;
    return res.json({ lead: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 3. Automated Cron Engine Manual Test Runners
// ==============================================================================

caRouter.post('/cron/trigger/:jobName', async (req, res) => {
  const { jobName } = req.params;

  try {
    let result: any = {};
    if (jobName === 'compliance') {
      result = await runComplianceEngine();
    } else if (jobName === 'documents') {
      result = await runDocumentChasingEngine();
    } else if (jobName === 'leads') {
      result = await runLeadFollowupEngine();
    } else if (jobName === 'invoices') {
      result = await runInvoiceRecoveryEngine();
    } else {
      return res.status(400).json({ error: 'Invalid jobName. Options: compliance, documents, leads, invoices' });
    }

    return res.json({ success: true, jobName, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
