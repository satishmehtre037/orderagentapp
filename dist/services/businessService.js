"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBusinessByWhatsappNumber = getBusinessByWhatsappNumber;
exports.getBusinessConfigs = getBusinessConfigs;
exports.getCategoryTemplate = getCategoryTemplate;
exports.getRecentConversations = getRecentConversations;
exports.saveConversationMessage = saveConversationMessage;
exports.saveCapturedRecord = saveCapturedRecord;
const supabase_js_1 = require("../config/supabase.js");
/**
 * Fetch business tenant by registered WhatsApp number
 */
async function getBusinessByWhatsappNumber(whatsappNumber) {
    console.log(`[DB Service] Looking up business with whatsapp_number: ${whatsappNumber}`);
    const cleanNumber = whatsappNumber.replace(/\D/g, ''); // strip non-digits if needed
    const { data, error } = await supabase_js_1.supabase
        .from('businesses')
        .select('*')
        .or(`whatsapp_number.eq.${whatsappNumber},whatsapp_number.eq.${cleanNumber}`)
        .single();
    if (error) {
        if (error.code === 'PGRST116') {
            console.log(`[DB Service] No business found for WhatsApp number: ${whatsappNumber}`);
            return null;
        }
        console.error(`[DB Service Error] Error fetching business by number:`, error);
        return null;
    }
    console.log(`[DB Service] Found business: "${data.name}" (${data.id}) | Category: ${data.category}`);
    return data;
}
/**
 * Fetch all config rows for a specific business_id
 */
async function getBusinessConfigs(businessId) {
    console.log(`[DB Service] Fetching configs for business_id: ${businessId}`);
    const { data, error } = await supabase_js_1.supabase
        .from('business_config')
        .select('*')
        .eq('business_id', businessId);
    if (error) {
        console.error(`[DB Service Error] Error fetching configs for business ${businessId}:`, error);
        return [];
    }
    console.log(`[DB Service] Loaded ${data.length} config items for business ${businessId}`);
    return data;
}
/**
 * Fetch category prompt template
 */
async function getCategoryTemplate(category) {
    console.log(`[DB Service] Fetching category template for: ${category}`);
    const { data, error } = await supabase_js_1.supabase
        .from('category_templates')
        .select('*')
        .eq('category', category)
        .single();
    if (error) {
        console.error(`[DB Service Error] Error fetching template for category ${category}:`, error);
        return null;
    }
    return data;
}
/**
 * Fetch recent chat history between a business and a specific customer
 */
async function getRecentConversations(businessId, customerNumber, limit = 10) {
    console.log(`[DB Service] Fetching last ${limit} messages for customer ${customerNumber}`);
    const { data, error } = await supabase_js_1.supabase
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
    return data.reverse();
}
/**
 * Save an inbound or outbound message to conversations table
 */
async function saveConversationMessage(businessId, customerNumber, direction, text) {
    console.log(`[DB Service] Saving ${direction} message for business ${businessId} to customer ${customerNumber}`);
    const { data, error } = await supabase_js_1.supabase
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
    return data;
}
/**
 * Save a captured order, booking, or lead record
 */
async function saveCapturedRecord(businessId, type, customerNumber, details) {
    console.log(`[DB Service] 🎯 Storing captured ${type.toUpperCase()} record for customer ${customerNumber}`);
    const { data, error } = await supabase_js_1.supabase
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
    return data;
}
