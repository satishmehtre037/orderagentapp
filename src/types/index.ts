export type BusinessCategory =
  | 'bakery'
  | 'cafe'
  | 'salon'
  | 'gym'
  | 'tuition'
  | 'clinic'
  | 'hospital'
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
  | 'ca_dashboard'
  | 'ca_compliance'
  | 'ca_documents'
  | 'ca_leads'
  | 'ca_invoices'
  | 'ca_agent'
  | 'ca_automation'
  | 'hospital_dashboard'
  | 'hospital_appointments'
  | 'hospital_patients'
  | 'hospital_reports'
  | 'hospital_voice'
  | 'hospital_feedback'
  | 'hospital_agent'
  | 'hospital_automation';

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

// ==========================================
// Hospital & Clinic Automation Suite Models
// ==========================================

export interface HospitalPatient {
  id: string;
  business_id?: string;
  name: string;
  phone: string;
  email?: string;
  gender?: 'Male' | 'Female' | 'Other';
  age?: number;
  blood_group?: string;
  emergency_contact?: string;
  address?: string;
  medical_history?: string;
  last_message_at?: string;
  last_visit?: string;
  status?: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}

export interface HospitalDoctor {
  id: string;
  business_id?: string;
  name: string;
  department: string;
  specialization?: string;
  fee?: number;
  available_days?: string;
  start_time?: string;
  end_time?: string;
  slot_duration_minutes?: number;
  status?: 'Active' | 'Inactive';
  created_at?: string;
}

export type HospitalAppointmentStatus = 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'missed';

export interface HospitalAppointment {
  id: string;
  business_id?: string;
  patient_id?: string;
  doctor_id?: string;
  patient_name: string;
  patient_phone: string;
  doctor_name?: string;
  department?: string;
  slot_time: string;
  token_number?: number;
  status: HospitalAppointmentStatus;
  type?: 'OPD' | 'Video Consult' | 'Emergency' | 'Follow-up';
  source?: 'whatsapp' | 'web' | 'call' | 'walk_in';
  reminder_24h_sent?: boolean;
  reminder_2h_sent?: boolean;
  rescheduled?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HospitalReport {
  id: string;
  business_id?: string;
  patient_id?: string;
  patient_name: string;
  patient_phone: string;
  doctor_name?: string;
  report_type: string;
  file_url?: string;
  ai_summary?: string;
  is_critical?: boolean;
  status: 'Pending' | 'Ready' | 'Delivered';
  delivered_via_wa?: boolean;
  delivered_at?: string;
  test_date?: string;
  created_at?: string;
}

export interface HospitalVoiceCall {
  id: string;
  business_id?: string;
  patient_id?: string;
  appointment_id?: string;
  patient_name: string;
  patient_phone: string;
  call_type: 'appointment_reminder' | 'missed_followup' | 'critical_report_alert' | 'patient_requested';
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'no_answer';
  outcome: 'confirmed' | 'reschedule_requested' | 'cancelled' | 'no_answer' | 'failed';
  duration_seconds?: number;
  transcript_summary?: string;
  recording_url?: string;
  created_at?: string;
}

export interface HospitalFeedback {
  id: string;
  business_id?: string;
  patient_id?: string;
  appointment_id?: string;
  patient_name: string;
  patient_phone: string;
  doctor_name?: string;
  rating?: number; // 1 to 5
  comment?: string;
  status: 'pending' | 'responded' | 'escalated';
  google_review_requested?: boolean;
  apology_sent?: boolean;
  requested_at?: string;
  responded_at?: string;
}


