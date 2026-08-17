import { BusinessCategory } from '../../types';

export interface CategoryPresetData {
  hours: string;
  menu_items?: Array<{ name: string; price: number; unit: string }>;
  cafe_menu?: Array<{ name: string; price: number; category?: string }>;
  services?: Array<{ name: string; price: number; duration: string }>;
  staff?: Array<{ name: string; specialty?: string }>;
  gym_plans?: Array<{ name: string; price: number; duration: string }>;
  courses?: Array<{ name: string; fee: string; batch_timing: string }>;
  admission_process?: string;
  faqs: Array<{ question: string; answer: string }>;
}

export const CATEGORY_PRESETS: Record<BusinessCategory, CategoryPresetData> = {
  bakery: {
    hours: 'Mon - Sun, 9:00 AM - 10:00 PM',
    menu_items: [
      { name: 'Fresh Chocolate Truffle Cake (1kg)', price: 650, unit: 'kg' },
      { name: 'Dutch Chocolate Pastry', price: 120, unit: 'pcs' },
      { name: 'Butter Croissant (Pack of 2)', price: 140, unit: 'pack' },
      { name: 'Red Velvet Designer Cake (0.5kg)', price: 420, unit: 'pcs' },
    ],
    faqs: [
      {
        question: 'Do you offer 100% eggless options?',
        answer: 'Yes! All our cakes and bakes can be prepared 100% pure vegetarian/eggless on request.',
      },
      {
        question: 'How much advance notice is required for custom cakes?',
        answer: 'Custom theme and designer photo cakes require 24 hours advance confirmation.',
      },
    ],
  },
  cafe: {
    hours: 'Mon - Sun, 8:30 AM - 11:00 PM',
    cafe_menu: [
      { name: 'Artisan Cold Brew Coffee', price: 180, category: 'Beverages' },
      { name: 'Hazelnut Cappuccino', price: 190, category: 'Beverages' },
      { name: 'Paneer Tikka Grilled Sandwich', price: 170, category: 'Food' },
      { name: 'Classic Avocado Toast', price: 240, category: 'Food' },
    ],
    faqs: [
      {
        question: 'Do you have dairy-free milk alternatives?',
        answer: 'Yes, we offer Oat Milk and Almond Milk upgrades for ₹40 extra.',
      },
      {
        question: 'Can I reserve a table in advance?',
        answer: 'Yes, just message us your party size and preferred time slot to reserve a table.',
      },
    ],
  },
  salon: {
    hours: 'Mon - Sun, 9:30 AM - 9:00 PM',
    services: [
      { name: 'Deluxe Haircut & Blowdry', price: 450, duration: '45 mins' },
      { name: 'Hydrating Facial Treatment', price: 1200, duration: '60 mins' },
      { name: 'Beard Grooming & Shape', price: 250, duration: '20 mins' },
      { name: 'Keratin Hair Spa & Treatment', price: 1800, duration: '90 mins' },
    ],
    staff: [
      { name: 'Ankita', specialty: 'Senior Stylist' },
      { name: 'Rahul', specialty: 'Hair & Beard Specialist' },
      { name: 'Pooja', specialty: 'Skin & Facial Therapist' },
    ],
    faqs: [
      {
        question: 'Do I need a prior appointment?',
        answer: 'Walk-ins are welcome, but booking an appointment guarantees zero wait time.',
      },
      {
        question: 'What hair and skin brands do you use?',
        answer: 'We exclusively use professional, dermatologist-tested products from L’Oréal Professional and Cheryl’s.',
      },
    ],
  },
  clinic: {
    hours: 'Mon - Sat, 9:00 AM - 8:00 PM (Sunday Closed)',
    services: [
      { name: 'General Physician OPD Consultation', price: 500, duration: '20 mins' },
      { name: 'Dental Scaling & Polishing', price: 1200, duration: '45 mins' },
      { name: 'Dermatology & Skin Consultation', price: 800, duration: '30 mins' },
      { name: 'Full Preventive Health Checkup', price: 2499, duration: '60 mins' },
    ],
    staff: [
      { name: 'Dr. Amit Sharma', specialty: 'MD - General Medicine' },
      { name: 'Dr. Priya Desai', specialty: 'BDS - Dental Surgeon' },
      { name: 'Dr. Rajesh Mehta', specialty: 'MD - Dermatologist' },
    ],
    faqs: [
      {
        question: 'How do I book a doctor appointment?',
        answer: 'Simply message us your preferred doctor and time slot. We will confirm your OPD appointment instantly.',
      },
      {
        question: 'Are emergency consultations available?',
        answer: 'For emergency cases, please call our clinic directly or visit during OPD hours.',
      },
    ],
  },
  gym: {
    hours: 'Mon - Sat, 6:00 AM - 10:30 PM (Sun 7:00 AM - 1:00 PM)',
    gym_plans: [
      { name: '1-Month Unlimited Fitness Pass', price: 1500, duration: '1 Month' },
      { name: '3-Month Muscle Transformation', price: 3800, duration: '3 Months' },
      { name: 'Annual VIP Membership Pass', price: 11000, duration: '1 Year' },
      { name: '1-Day Free Trial Pass', price: 0, duration: '1 Day' },
    ],
    staff: [
      { name: 'Coach Vikram', specialty: 'Strength & Conditioning' },
      { name: 'Coach Neha', specialty: 'Functional Fitness & Yoga' },
    ],
    faqs: [
      {
        question: 'Are showers and lockers included?',
        answer: 'Yes, members get free locker access and clean hot showers.',
      },
      {
        question: 'Do you offer a free trial workout?',
        answer: 'Yes! We offer a 1-day complimentary trial pass for first-time visitors.',
      },
    ],
  },
  tuition: {
    hours: 'Mon - Sat, 3:00 PM - 9:00 PM',
    courses: [
      { name: 'Class 10th CBSE Mathematics Mastery', fee: '₹2,500/month', batch_timing: 'Mon-Fri 5:00 PM' },
      { name: 'NEET Foundation Chemistry & Biology', fee: '₹3,500/month', batch_timing: 'Mon-Sat 6:30 PM' },
      { name: 'Class 12th Board Physics Excellence', fee: '₹3,000/month', batch_timing: 'Mon-Fri 7:30 PM' },
    ],
    admission_process: '2-Day free trial demo class available. Registration requires parent contact and student grade details.',
    faqs: [
      {
        question: 'Can my child attend a demo session before joining?',
        answer: 'Yes, we provide 2 days of free demo lectures before fee payment.',
      },
      {
        question: 'Are study materials and mock tests included in the fees?',
        answer: 'Yes, all chapter revision booklets and weekly test series are included.',
      },
    ],
  },
  retail: {
    hours: 'Mon - Sun, 10:30 AM - 9:30 PM',
    menu_items: [
      { name: 'Designer Pure Silk Banarasi Saree', price: 3500, unit: 'pcs' },
      { name: 'Premium Linen Casual Shirt (M/L/XL)', price: 1299, unit: 'pcs' },
      { name: 'Handcrafted Festive Kurti Set', price: 1650, unit: 'pcs' },
      { name: 'Genuine Leather Everyday Tote Bag', price: 1890, unit: 'pcs' },
    ],
    staff: [
      { name: 'Meera', specialty: 'Fashion & Style Consultant' },
      { name: 'Rohan', specialty: 'Store Operations Manager' },
    ],
    faqs: [
      {
        question: 'What is your size exchange and return policy?',
        answer: 'We offer 7-day hassle-free size exchanges on all unwashed, tagged items.',
      },
      {
        question: 'Do you offer local home delivery?',
        answer: 'Yes! We offer same-day delivery across the city and 2-3 day express shipping pan-India.',
      },
    ],
  },
  real_estate: {
    hours: 'Mon - Sun, 9:30 AM - 7:30 PM',
    services: [
      { name: '2 BHK Premium Luxury Flat (950 sq.ft)', price: 6500000, duration: 'Site Visit' },
      { name: '3 BHK Garden View Villa (1450 sq.ft)', price: 9500000, duration: 'Site Visit' },
      { name: '1 BHK Smart Ready-to-Move Apartment', price: 3500000, duration: 'Site Visit' },
      { name: 'Commercial High-Street Retail Space (600 sq.ft)', price: 4500000, duration: 'Site Visit' },
    ],
    staff: [
      { name: 'Rajesh Kulkarni', specialty: 'Senior Property Advisor' },
      { name: 'Sneha Patil', specialty: 'Real Estate Investment Consultant' },
    ],
    faqs: [
      {
        question: 'Are all listed properties RERA registered and approved?',
        answer: 'Yes, 100% of our projects are RERA registered with pre-approved home loans from leading banks.',
      },
      {
        question: 'How do I schedule a property site visit?',
        answer: 'Just message us your preferred date and time. We provide free pick-and-drop guided site tours.',
      },
    ],
  },
  custom: {
    hours: 'Mon - Sun, 9:00 AM - 8:00 PM',
    services: [
      { name: 'Standard Professional Consultation', price: 999, duration: '45 mins' },
      { name: 'Premium Full-Service Package', price: 2999, duration: 'Custom' },
    ],
    staff: [{ name: 'Team Lead', specialty: 'Client Success' }],
    faqs: [
      {
        question: 'How does your service work?',
        answer: 'Reach out to our AI concierge on WhatsApp with your requirements for instant quotes and bookings.',
      },
    ],
  },
};

/**
 * Intelligently resolves category from explicit type or business name hints
 */
export const resolveCategoryFromNameOrType = (
  category?: string,
  businessName?: string
): BusinessCategory => {
  const name = (businessName || '').toLowerCase();
  
  if (category && category !== 'bakery' && category !== 'custom') {
    return category as BusinessCategory;
  }

  // If category is default/fallback, detect accurately from business name
  if (/boutique|retail|fashion|apparel|clothing|saree|garment|kurti|dress|wear|collection|store/i.test(name)) {
    return 'retail';
  }
  if (/real\s*estate|property|properties|builder|realty|housing|developer|realtor|estates/i.test(name)) {
    return 'real_estate';
  }
  if (/clinic|hospital|doctor|dr\.|dentist|dental|care|health|pharma|physician|ayurved/i.test(name)) {
    return 'clinic';
  }
  if (/gym|fitness|workout|crossfit|iron|physique|muscle|training/i.test(name)) {
    return 'gym';
  }
  if (/tuition|coaching|classes|academy|institute|learning|education|school|tutorial/i.test(name)) {
    return 'tuition';
  }
  if (/salon|parlour|parlor|spa|beauty|barber|hair|makeup|nails|glow/i.test(name)) {
    return 'salon';
  }
  if (/cafe|coffee|bistro|tea|brew|roasters|lounge|espresso|restro/i.test(name)) {
    return 'cafe';
  }
  if (/cake|bake|bakery|pastry|dessert|sweets|patisserie|chocolat/i.test(name)) {
    return 'bakery';
  }

  return (category as BusinessCategory) || 'bakery';
};

/**
 * Generates rich, vertical-specific WhatsApp reminder and re-engagement messages
 */
export const getCategoryReminderMessage = (
  category: string = 'bakery',
  businessName: string = 'Our Business',
  lastItem?: string,
  customTemplate?: string
): string => {
  const resolvedCategory = resolveCategoryFromNameOrType(category, businessName);
  const cleanName = businessName.trim() || 'Our Business';

  if (customTemplate && customTemplate.trim().length > 0) {
    // If the custom template contains stale bakery default but business is not bakery, ignore it
    if (resolvedCategory !== 'bakery' && /craving your favorites|fresh specials/i.test(customTemplate)) {
      // Ignore stale bakery default template
    } else {
      return customTemplate
        .replace(/{business_name}/gi, cleanName)
        .replace(/{item}/gi, lastItem || 'your last order/service');
    }
  }

  switch (resolvedCategory) {
    case 'real_estate':
      return `🏢 *Exclusive Property Updates from ${cleanName}*\n\nHi! Thank you for connecting with *${cleanName}* regarding our premium property developments.\n\nWe have newly opened unit configurations and special site visit opportunities available this week${lastItem ? ` related to ${lastItem}` : ''}.\n\nWould you like to schedule a private site tour or receive our updated price sheet on WhatsApp?`;

    case 'clinic':
      return `🩺 *Health Consultation & Follow-Up Reminder*\n\nHi from *${cleanName}*! It's time for your regular health checkup or doctor consultation${lastItem ? ` (${lastItem})` : ''}.\n\nWe have convenient appointment slots available with our specialist doctors this week. Would you like us to book a consultation slot for you?`;

    case 'tuition':
      return `🎓 *Academic Batch & Admission Update from ${cleanName}*\n\nHi! New study batches and trial demo sessions${lastItem ? ` for ${lastItem}` : ''} are starting this week at *${cleanName}*.\n\nWould you like to check available timings, course syllabus, or book a free trial class?`;

    case 'retail':
      return `🛍️ *New Arrivals & Exclusive Offers at ${cleanName}*\n\nHi! We just restocked fresh trending styles and collections${lastItem ? ` like ${lastItem}` : ''} at *${cleanName}*!\n\nWould you like to browse our latest catalog with priority home delivery and member savings?`;

    case 'cafe':
      return `☕ *Special Treat from ${cleanName}*\n\nHi! Craving your favorite brews and fresh specials${lastItem ? ` like ${lastItem}` : ''}?\n\nWe're serving delicious items today at *${cleanName}*! Reply here to reserve a table or place a quick takeaway order on WhatsApp.`;

    case 'bakery':
      return `🎂 *Fresh Gourmet Treats from ${cleanName}*\n\nHi! Looking to celebrate or craving fresh gourmet cakes and bakery items${lastItem ? ` like ${lastItem}` : ''}?\n\nLet us know what you'd like to order today from *${cleanName}* for fresh doorstep delivery!`;

    case 'gym':
      return `🏋️ *Membership Renewal Reminder from ${cleanName}*\n\nHi! Your fitness pass with *${cleanName}* is up for renewal.\n\nWould you like to renew today and lock in your workout slots and member privileges?`;

    case 'salon':
      return `✂️ *Time for your Grooming Refresh at ${cleanName}!*\n\nHi! Ready for your regular haircut, styling, or spa session${lastItem ? ` (${lastItem})` : ''}?\n\nWe have priority slots available this week at *${cleanName}*. Reply to reserve your preferred timing!`;

    default:
      return `✨ *Special Update from ${cleanName}*\n\nHi from *${cleanName}*! Following up to see if we can help you with any inquiries, orders, or services this week. Reply here to connect directly with us!`;
  }
};
