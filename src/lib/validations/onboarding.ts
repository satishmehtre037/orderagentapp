import { z } from 'zod';

export const bakeryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  price: z.coerce.number().min(1, 'Price must be > 0'),
  unit: z.string().min(1, 'Unit required (e.g. kg, pcs)'),
});

export const cafeItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  price: z.coerce.number().min(1, 'Price must be > 0'),
  category: z.string().optional(),
});

export const salonServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  price: z.coerce.number().min(1, 'Price must be > 0'),
  duration: z.string().min(1, 'Duration required (e.g. 45 mins)'),
});

export const gymPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required (e.g. 1 Month Pass, Annual VIP)'),
  price: z.coerce.number().min(1, 'Price must be > 0'),
  duration: z.string().min(1, 'Duration (e.g. 1 Month, 3 Months, 1 Year)'),
});

export const tuitionCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  fee: z.string().min(1, 'Fee details required (e.g. ₹2,000/mo)'),
  batch_timing: z.string().min(1, 'Batch timing required'),
});

export const faqItemSchema = z.object({
  question: z.string().min(1, 'Question required'),
  answer: z.string().min(1, 'Answer required'),
});

export const staffItemSchema = z.object({
  name: z.string().min(1, 'Staff/Trainer name required'),
  specialty: z.string().optional(),
});

export const onboardingWizardSchema = z.object({
  // Step 1
  business_name: z.string().min(2, 'Please enter your business name'),
  category: z.enum(
    ['bakery', 'cafe', 'salon', 'gym', 'tuition', 'clinic', 'retail', 'real_estate', 'ca_firm', 'custom'],
    {
      required_error: 'Please select a business category',
    }
  ),

  // Step 2 Bakery
  menu_items: z.array(bakeryItemSchema).optional(),

  // Step 2 Cafe
  cafe_menu: z.array(cafeItemSchema).optional(),
  
  // Step 2 Salon
  services: z.array(salonServiceSchema).optional(),
  staff: z.array(staffItemSchema).optional(),

  // Step 2 Gym
  gym_plans: z.array(gymPlanSchema).optional(),

  // Step 2 Tuition
  courses: z.array(tuitionCourseSchema).optional(),
  admission_process: z.string().optional(),

  // Shared Config
  hours: z.string().optional(),
  faqs: z.array(faqItemSchema).optional(),

  // UPI & Payment Settings
  upi_id: z.string().optional(),
  auto_send_payment_link: z.boolean().optional(),
  payment_note: z.string().optional(),
  gst_number: z.string().optional(),
  store_address: z.string().optional(),

  // Smart Re-Engagement & Renewal Reminders
  enable_reminders: z.boolean().optional(),
  reminder_days: z.coerce.number().optional(),
  reminder_template: z.string().optional(),

  // Step 3: Fixed +91 Indian Phone Number (Exactly 10 digits)
  whatsapp_number: z
    .string()
    .min(1, 'Please enter your 10-digit WhatsApp number')
    .refine(
      (val) => {
        const digits = val.replace(/\D/g, '');
        if (digits.length === 12 && digits.startsWith('91')) {
          return true;
        }
        return digits.length === 10;
      },
      {
        message: 'Please enter a valid 10-digit mobile number',
      }
    ),
});

export type OnboardingWizardFormData = z.infer<typeof onboardingWizardSchema>;
