import { supabase } from '../config/supabase.js';
import {
  Business,
  BusinessCategory,
  BusinessConfig,
  CategoryTemplate,
  ConversationMessage,
  OrderBookingLead,
  CaptureType,
  MessageDirection,
} from '../types/index.js';

/**
 * Fetch business tenant by registered WhatsApp number
 */
export async function getBusinessByWhatsappNumber(whatsappNumber: string): Promise<Business | null> {
  console.log(`[DB Service] Looking up business with whatsapp_number: ${whatsappNumber}`);
  const cleanNumber = whatsappNumber.replace(/\D/g, ''); // strip non-digits if needed

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .or(`whatsapp_number.eq.${whatsappNumber},whatsapp_number.eq.${cleanNumber}`)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log(`[DB Service] No exact business match for ${whatsappNumber}. Fetching latest active business...`);
      const { data: fallbackBiz } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (fallbackBiz && fallbackBiz.length > 0) {
        console.log(`[DB Service] Found active business: "${fallbackBiz[0].name}" (${fallbackBiz[0].id})`);
        return fallbackBiz[0] as Business;
      }
      
      console.log(`[DB Service] ❌ No business registered in database. Returning null.`);
      return null;
    }
    console.error(`[DB Service Error] Error fetching business by number:`, error);
    return null;
  }

  console.log(`[DB Service] Found business: "${data.name}" (${data.id}) | Category: ${data.category}`);
  return data as Business;
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
export async function getCategoryTemplate(category: BusinessCategory): Promise<CategoryTemplate | null> {
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
  return data as OrderBookingLead;
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

