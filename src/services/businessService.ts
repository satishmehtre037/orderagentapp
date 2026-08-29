import { supabase } from '../config/supabase';
import { ENV } from '../config/env';
import {
  Business,
  BusinessCategory,
  BusinessConfig,
  CategoryTemplate,
  ConversationMessage,
  OrderBookingLead,
  CaptureType,
  MessageDirection,
} from '../types/index';

/**
 * Every spelling a whatsapp_number may have been stored as.
 * Onboarding has accepted '9876543210', '919876543210' and '+919876543210'
 * at various points, so the lookup normalises rather than assuming one form.
 */
function numberVariants(whatsappNumber: string): string[] {
  const digits = (whatsappNumber || '').replace(/\D/g, '');
  const last10 = digits.slice(-10);

  const variants = new Set<string>([whatsappNumber, digits, `+${digits}`]);
  if (last10.length === 10) {
    variants.add(last10);
    variants.add(`91${last10}`);
    variants.add(`+91${last10}`);
  }
  return [...variants].filter(Boolean);
}

/**
 * Resolves the tenant that owns a WhatsApp number.
 *
 * Returns null when there is no match. It previously fell back to
 * `.order('created_at', {ascending: false}).limit(1)` — the newest business in
 * the table — so an inbound message to an unregistered number was answered
 * with some *other* tenant's prompt, menu, prices and hours, and the resulting
 * order was written under their business_id. That fallback is gone: an
 * unresolvable number is an error, not somebody else's customer.
 */
export async function getBusinessByWhatsappNumber(whatsappNumber: string): Promise<Business | null> {
  if (!whatsappNumber) {
    console.warn('[DB Service] getBusinessByWhatsappNumber called with an empty number.');
    return null;
  }

  const variants = numberVariants(whatsappNumber);

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .in('whatsapp_number', variants)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`[DB Service Error] Error fetching business by number ${whatsappNumber}:`, error.message);
    return null;
  }

  if (!data) {
    console.warn(
      `[DB Service] ❌ No business registered for ${whatsappNumber}. ` +
        `Refusing to serve another tenant's data. Register the number in onboarding.`
    );
    return null;
  }

  console.log(`[DB Service] Found business: "${data.name}" (${data.id}) | Category: ${data.category}`);
  return data as Business;
}

/**
 * The business_id for the operator running this deployment — used by admin-only
 * surfaces (Lead Hunter, campaigns) that need a business_id to attribute rows to.
 *
 * Resolved from WHATSAPP_BUSINESS_NUMBER, the number this deployment actually
 * sends from. Several routes previously used `.from('businesses').select('id')
 * .limit(1)` — an unordered read that returns an arbitrary tenant, so admin
 * activity was filed against whichever business Postgres happened to hand back.
 */
export async function resolveOperatorBusinessId(): Promise<string | null> {
  const configured = ENV.WHATSAPP_BUSINESS_NUMBER;

  if (!configured) {
    console.warn(
      '[DB Service] WHATSAPP_BUSINESS_NUMBER is not set — cannot attribute admin activity to a business. ' +
        'Rows will be written with business_id = null.'
    );
    return null;
  }

  const { data, error } = await supabase
    .from('businesses')
    .select('id')
    .in('whatsapp_number', numberVariants(configured))
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[DB Service Error] Failed to resolve operator business:', error.message);
    return null;
  }

  if (!data) {
    console.warn(`[DB Service] No business row matches WHATSAPP_BUSINESS_NUMBER (${configured}).`);
    return null;
  }

  return data.id as string;
}

/**
 * Fetch all config rows for a specific business_id
 */
export async function getBusinessConfigs(businessId: string): Promise<BusinessConfig[]> {
  console.log(`[DB Service] Fetching configs for business_id: ${businessId}`);
  const { data, error } = await supabase
    .from('business_config')
    .select('*')
    .eq('business_id', businessId);

  if (error) {
    console.error(`[DB Service Error] Error fetching configs for business ${businessId}:`, error);
    return [];
  }

  console.log(`[DB Service] Loaded ${data.length} config items for business ${businessId}`);
  return data as BusinessConfig[];
}

/**
 * Fetch category prompt template
 */
export async function getCategoryTemplate(category: BusinessCategory | string): Promise<CategoryTemplate | null> {
  console.log(`[DB Service] Fetching category template for: ${category}`);
  const { data, error } = await supabase
    .from('category_templates')
    .select('*')
    .eq('category', category)
    .single();

  if (error) {
    console.error(`[DB Service Error] Error fetching template for category ${category}:`, error);
    return null;
  }

  return data as CategoryTemplate;
}

/**
 * Fetch recent chat history between a business and a specific customer
 */
export async function getRecentConversations(
  businessId: string,
  customerNumber: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  console.log(`[DB Service] Fetching last ${limit} messages for customer ${customerNumber}`);
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('business_id', businessId)
    .eq('customer_number', customerNumber)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`[DB Service Error] Error fetching chat history:`, error);
    return [];
  }

  // Reverse so history is in chronological order (oldest to newest)
  return (data as ConversationMessage[]).reverse();
}

/**
 * Save an inbound or outbound message to conversations table
 */
export async function saveConversationMessage(
  businessId: string,
  customerNumber: string,
  direction: MessageDirection,
  text: string
): Promise<ConversationMessage | null> {
  console.log(`[DB Service] Saving ${direction} message for business ${businessId} to customer ${customerNumber}`);

  const { data, error } = await supabase
    .from('conversations')
    .insert([
      {
        business_id: businessId,
        customer_number: customerNumber,
        message_direction: direction,
        message_text: text,
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error(`[DB Service Error] Error saving conversation message:`, error);
    return null;
  }

  console.log(`[DB Service] Message saved successfully (ID: ${data.id})`);
  return data as ConversationMessage;
}

/**
 * Save a captured order, booking, or lead record
 */
export async function saveCapturedRecord(
  businessId: string,
  type: CaptureType,
  customerNumber: string,
  details: Record<string, any>
): Promise<OrderBookingLead | null> {
  console.log(`[DB Service] 🎯 Storing/Updating captured ${type.toUpperCase()} record for customer ${customerNumber}`);

  // Check if there is an active recent record created in the last 20 minutes to prevent duplicates
  const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();

  const { data: existingRecord } = await supabase
    .from('orders_bookings_leads')
    .select('*')
    .eq('business_id', businessId)
    .eq('customer_number', customerNumber)
    .in('status', ['new', 'confirmed'])
    .gte('created_at', twentyMinutesAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRecord) {
    console.log(`[DB Service] 🔄 Updating existing active ${type} (${existingRecord.id}) with fresh details to prevent duplicate entries.`);
    const mergedDetails = {
      ...(typeof existingRecord.details === 'object' ? existingRecord.details : {}),
      ...details,
    };

    const { data: updatedRecord, error: updateErr } = await supabase
      .from('orders_bookings_leads')
      .update({
        details: mergedDetails,
        type: type || existingRecord.type,
      })
      .eq('id', existingRecord.id)
      .select('*')
      .single();

    if (updateErr) {
      console.error(`[DB Service Error] Error updating existing record:`, updateErr);
      return existingRecord as OrderBookingLead;
    }

    // Auto-sync hospital/clinic appointment and patient records
    await syncHospitalAppointmentIfApplicable(businessId, customerNumber, mergedDetails);

    return updatedRecord as OrderBookingLead;
  }

  const { data, error } = await supabase
    .from('orders_bookings_leads')
    .insert([
      {
        business_id: businessId,
        type,
        customer_number: customerNumber,
        details,
        status: 'new',
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error(`[DB Service Error] Error saving captured record:`, error);
    return null;
  }

  console.log(`[DB Service] 📌 Record captured successfully (ID: ${data.id})`);

  // Auto-sync hospital/clinic appointment and patient records
  await syncHospitalAppointmentIfApplicable(businessId, customerNumber, details);

  return data as OrderBookingLead;
}

/**
 * Automatically syncs WhatsApp captured bookings into hospital_appointments and hospital_patients
 */
async function syncHospitalAppointmentIfApplicable(
  businessId: string,
  customerNumber: string,
  details: Record<string, any>
): Promise<void> {
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();
    if (!business) return;
    const cat = business.category;
    if (cat !== 'hospital' && cat !== 'clinic') return;

    // Parse patient name
    let patientName = details.patient_name || details.name;
    if (!patientName && typeof details.notes === 'string') {
      const match = details.notes.match(/Patient:\s*([^\n,]+)/i);
      if (match) patientName = match[1].trim();
    }
    if (!patientName) patientName = `Patient (${customerNumber.slice(-4)})`;

    // Parse doctor and department from items or details
    let doctorName = details.doctor_name || details.doctor;
    let department = details.department;
    if (Array.isArray(details.items)) {
      for (const it of details.items) {
        const itemName = typeof it === 'string' ? it : it?.name || '';
        if (it?.doctor) doctorName = it.doctor;
        if (it?.department) department = it.department;
        if (!doctorName && itemName.includes('Dr.')) {
          const docMatch = itemName.match(/Dr\.\s*([a-zA-Z\s]+)/i);
          if (docMatch) doctorName = `Dr. ${docMatch[1].trim()}`;
        }
        if (!department) {
          if (/cardio/i.test(itemName)) department = 'Cardiology OPD';
          else if (/neuro/i.test(itemName)) department = 'Neurology OPD';
          else if (/ortho/i.test(itemName)) department = 'Orthopaedics';
          else if (/pediatr/i.test(itemName)) department = 'Pediatrics';
          else if (/dental|dentist/i.test(itemName)) department = 'Dental Clinic';
          else if (/dermat/i.test(itemName)) department = 'Dermatology';
        }
      }
    }
    if (!doctorName) doctorName = 'Specialist Physician';
    if (!department) department = 'General OPD';

    // Parse appointment slot time
    let slotTime = new Date().toISOString();
    if (details.appointment_time || details.slot || details.date) {
      const timeStr = details.appointment_time || details.slot || details.date;
      const parsed = Date.parse(timeStr);
      if (!isNaN(parsed)) {
        slotTime = new Date(parsed).toISOString();
      } else {
        const cleanStr = `${timeStr} 2026`.replace(/(\d{4})\s+\d{4}/, '$1');
        const fallbackParsed = Date.parse(cleanStr);
        if (!isNaN(fallbackParsed)) {
          slotTime = new Date(fallbackParsed).toISOString();
        }
      }
    }

    // Upsert Patient record in hospital_patients
    let patientId: string | null = null;
    const { data: existingPatient } = await supabase
      .from('hospital_patients')
      .select('id')
      .eq('business_id', businessId)
      .eq('phone', customerNumber)
      .maybeSingle();

    if (existingPatient) {
      patientId = existingPatient.id;
      await supabase
        .from('hospital_patients')
        .update({
          name: patientName,
          last_message_at: new Date().toISOString(),
          status: 'Active',
        })
        .eq('id', existingPatient.id);
    } else {
      const { data: newPatient } = await supabase
        .from('hospital_patients')
        .insert([{
          business_id: businessId,
          name: patientName,
          phone: customerNumber,
          last_message_at: new Date().toISOString(),
          status: 'Active',
        }])
        .select('id')
        .single();
      if (newPatient) patientId = newPatient.id;
    }

    // Insert or update appointment in hospital_appointments
    const tokenNumber = Math.floor(Math.random() * 40) + 1;
    const feeStr = details.total ? `Consultation Fee: ₹${details.total}` : details.notes || '';

    const { data: existingAppt } = await supabase
      .from('hospital_appointments')
      .select('id')
      .eq('business_id', businessId)
      .eq('patient_phone', customerNumber)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingAppt) {
      await supabase
        .from('hospital_appointments')
        .update({
          patient_id: patientId,
          patient_name: patientName,
          doctor_name: doctorName,
          department: department,
          slot_time: slotTime,
          notes: feeStr,
        })
        .eq('id', existingAppt.id);
      console.log(`[DB Service] 🏥 Updated hospital appointment (${existingAppt.id}) for ${patientName}`);
    } else {
      const { data: newAppt } = await supabase
        .from('hospital_appointments')
        .insert([{
          business_id: businessId,
          patient_id: patientId,
          patient_name: patientName,
          patient_phone: customerNumber,
          doctor_name: doctorName,
          department: department,
          slot_time: slotTime,
          token_number: tokenNumber,
          status: 'confirmed',
          type: 'OPD',
          source: 'whatsapp',
          notes: feeStr,
        }])
        .select('id')
        .single();
      console.log(`[DB Service] 🏥 Created hospital appointment (${newAppt?.id}) for ${patientName}`);
    }
  } catch (syncErr) {
    console.error(`[DB Service] ⚠️ Error syncing hospital appointment:`, syncErr);
  }
}

/**
 * Cancels active orders/bookings/leads for a customer (single or all)
 */
export async function cancelOrdersForCustomer(
  businessId: string,
  customerNumber: string,
  cancelAll: boolean = false
): Promise<number> {
  console.log(`[DB Service] ❌ Cancelling ${cancelAll ? 'ALL' : 'latest'} active order(s) for customer ${customerNumber}`);

  if (cancelAll) {
    const { data: updatedOrders, error } = await supabase
      .from('orders_bookings_leads')
      .update({ status: 'cancelled' })
      .eq('business_id', businessId)
      .eq('customer_number', customerNumber)
      .in('status', ['new', 'confirmed'])
      .select('id');

    if (error) {
      console.error(`[DB Service Error] Failed to cancel all orders:`, error);
      return 0;
    }

    const count = updatedOrders?.length || 0;
    console.log(`[DB Service] ✅ Successfully cancelled ${count} order(s) for customer ${customerNumber}!`);
    return count;
  } else {
    // Find latest active/confirmed/new order
    const { data: latestOrder } = await supabase
      .from('orders_bookings_leads')
      .select('id')
      .eq('business_id', businessId)
      .eq('customer_number', customerNumber)
      .in('status', ['new', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestOrder) {
      console.warn(`[DB Service] No active order found to cancel for customer ${customerNumber}`);
      return 0;
    }

    const { error: updateErr } = await supabase
      .from('orders_bookings_leads')
      .update({ status: 'cancelled' })
      .eq('id', latestOrder.id);

    if (updateErr) {
      console.error(`[DB Service Error] Failed to update order to cancelled:`, updateErr);
      return 0;
    }

    console.log(`[DB Service] ✅ Order ${latestOrder.id} successfully updated to 'cancelled'!`);
    return 1;
  }
}

// Backward compatibility alias
export const cancelLatestOrderForCustomer = (businessId: string, customerNumber: string) =>
  cancelOrdersForCustomer(businessId, customerNumber, false);

