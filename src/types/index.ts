export type BusinessCategory =
  | 'bakery'
  | 'cafe'
  | 'salon'
  | 'gym'
  | 'tuition'
  | 'clinic'
  | 'retail'
  | 'real_estate'
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

export type DashboardTab = 'orders' | 'conversations' | 'edit_info' | 'billing';
