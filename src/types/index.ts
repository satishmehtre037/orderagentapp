export type BusinessCategory =
  | 'bakery'
  | 'cafe'
  | 'salon'
  | 'gym'
  | 'tuition'
  | 'clinic'
  | 'retail'
  | 'real_estate'
  | 'ca_firm'
  | 'custom';
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired';
export type PlanType = 'trial' | 'monthly_999';
export type CaptureType = 'order' | 'booking' | 'lead';
export type OrderStatus = 'new' | 'confirmed' | 'completed' | 'cancelled';
export type MessageDirection = 'inbound' | 'outbound' | 'customer' | 'agent';

export interface Business {
  id: string;
  name: string;
  category: BusinessCategory;
  whatsapp_number: string;
  owner_email: string;
  trial_end_date: string;
  subscription_status: SubscriptionStatus;
  plan?: PlanType;
  razorpay_customer_id?: string;
  razorpay_subscription_id?: string;
  created_at: string;
}

export interface PaymentEvent {
  id: string;
  business_id: string;
  razorpay_payment_id: string;
  amount: number; // in paise
  status: 'success' | 'failed';
  created_at: string;
}

export interface CategoryTemplate {
  id: string;
  category: BusinessCategory;
  prompt_template: string;
}

export interface BusinessConfig {
  id: string;
  business_id: string;
  config_key: string;
  config_value: any;
}

export interface CapturedPayload {
  type: CaptureType;
  details: Record<string, any>;
}

export interface OrderBookingLead {
  id: string;
  business_id: string;
  customer_number: string;
  type: CaptureType;
  details: {
    items?: Array<{ name: string; quantity?: number; price?: number }>;
    total_amount?: number;
    service_name?: string;
    date?: string;
    time?: string;
    course_name?: string;
    student_name?: string;
    notes?: string;
    [key: string]: any;
  };
  status: OrderStatus;
  created_at: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  customer_number: string;
  message: string;
  sender: MessageDirection;
  created_at: string;
}

export type ConversationMessage = Conversation;

export interface ConversationThread {
  customer_number: string;
  customer_name?: string;
  last_message: string;
  last_timestamp: string;
  messages: Conversation[];
}

export type DashboardTab =
  | 'orders'
  | 'conversations'
  | 'edit_info'
  | 'billing'
  | 'ca_compliance'
  | 'ca_documents'
  | 'ca_leads'
  | 'ca_automation';

// ==========================================
// CA Firm Automation Suite Models
// ==========================================

export type CAEntityType = 'Individual' | 'Proprietorship' | 'Partnership' | 'Company' | 'LLP';

export interface CAClient {
  id: string;
  business_id?: string;
  client_name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  pan_gstin?: string;
  entity_type?: CAEntityType;
  partner_assigned?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type CAComplianceType =
  | 'GST-GSTR1'
  | 'GST-3B'
  | 'ITR-Individual'
  | 'ITR-Corporate'
  | 'TDS-Return'
  | 'ROC-Annual'
  | 'Advance-Tax'
  | 'General';

export type CAComplianceStatus = 'Pending' | 'Filed' | 'Overdue';

export interface CAComplianceRecord {
  id: string;
  business_id?: string;
  client_id: string;
  client_name: string;
  phone: string;
  email?: string;
  compliance_type: CAComplianceType;
  due_date: string;
  status: CAComplianceStatus;
  reminder_count: number;
  last_reminder_date?: string;
  filed_date?: string;
  acknowledgement_number?: string;
  created_at?: string;
  updated_at?: string;
}

export type CADocStatus = 'Pending' | 'Received' | 'Verified' | 'Rejected';

export interface CADocumentTracker {
  id: string;
  business_id?: string;
  client_id: string;
  client_name: string;
  phone: string;
  email?: string;
  compliance_type: string;
  document_name: string;
  status: CADocStatus;
  storage_url?: string;
  requested_date: string;
  received_date?: string;
  verified_date?: string;
  followup_count: number;
  last_followup_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type CALeadUrgency = 'High' | 'Medium' | 'Low' | 'Unclear';
export type CALeadScore = 'Hot' | 'Warm' | 'Cold';
export type CALeadStatus = 'New' | 'Qualifying' | 'Hot' | 'In-Progress' | 'Converted' | 'Lost' | 'Cold-Closed';

export interface CALead {
  id: string;
  business_id?: string;
  name: string;
  phone?: string;
  email?: string;
  source: 'WhatsApp' | 'Website' | 'Email' | 'Referral';
  requirement?: string;
  business_type?: string;
  urgency: CALeadUrgency;
  qualification_score: CALeadScore;
  status: CALeadStatus;
  followup_date?: string;
  followup_attempts: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CAQueryLog {
  id: string;
  business_id?: string;
  client_id?: string;
  phone?: string;
  email?: string;
  channel: 'whatsapp' | 'email' | 'web';
  query_text: string;
  ai_response: string;
  created_at?: string;
}

