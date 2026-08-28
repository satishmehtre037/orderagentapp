/**
 * Canonical outbound pitch templates.
 *
 * This was previously duplicated verbatim in two places — campaignService.ts and
 * api/admin/lead-hunter/send-pitch/route.ts — which meant every copy edit had to
 * be made twice and they had already drifted. One copy, imported by both.
 *
 * Every cold-outreach message ends with OPT_OUT_FOOTER. That is not decoration:
 * an unsolicited commercial WhatsApp with no stated way to stop is what gets a
 * WABA number quality-rated down and then banned.
 */

export type PitchType = 'all_in_one' | 'web_mobile' | 'whatsapp_ai' | 'local_seo';

/** Appended to every cold pitch. Recognised by isOptOutMessage() on reply. */
export const OPT_OUT_FOOTER = `\n\n_Reply STOP to never hear from us again._`;

interface VerticalFlags {
  isCA: boolean;
  isHospital: boolean;
  isSalon: boolean;
  isRestaurant: boolean;
  isRealEstate: boolean;
  isTuition: boolean;
  isRetail: boolean;
}

function detectVertical(category: string, businessName: string): VerticalFlags {
  const cat = (category || '').toLowerCase();
  const name = (businessName || '').toLowerCase();

  return {
    isCA:
      cat.includes('ca_firm') ||
      cat.includes('tax') ||
      cat.includes('audit') ||
      cat.includes('accountant') ||
      name.includes('ca ') ||
      name.includes('accountant') ||
      name.includes('gst'),
    isHospital: cat.includes('hospital') || name.includes('hospital'),
    isSalon: cat.includes('salon') || cat.includes('spa') || cat.includes('beauty') || name.includes('salon'),
    isRestaurant:
      cat.includes('restaurant') ||
      cat.includes('cafe') ||
      cat.includes('food') ||
      cat.includes('dine') ||
      cat.includes('bar') ||
      name.includes('cafe') ||
      name.includes('dining'),
    isRealEstate:
      cat.includes('real_estate') || cat.includes('realty') || cat.includes('builder') || cat.includes('property'),
    isTuition:
      cat.includes('tuition') ||
      cat.includes('coach') ||
      cat.includes('academy') ||
      cat.includes('class') ||
      cat.includes('institute'),
    isRetail:
      cat.includes('retail') ||
      cat.includes('boutique') ||
      cat.includes('store') ||
      cat.includes('shop') ||
      cat.includes('jewel'),
  };
}

/**
 * Substitutes placeholders in an operator-written custom message.
 * Accepts both {Business_Name} and {{Business_Name}} spellings.
 */
export function renderCustomMessage(
  template: string,
  vars: { businessName: string; city: string; category: string; senderName: string }
): string {
  return template
    .replace(/\{\{?\s*business_name\s*\}?\}/gi, vars.businessName)
    .replace(/\{\{?\s*city\s*\}?\}/gi, vars.city)
    .replace(/\{\{?\s*category\s*\}?\}/gi, vars.category)
    .replace(/\{\{?\s*sender_name\s*\}?\}/gi, vars.senderName);
}

export function buildPersonalizedPitch(
  businessName: string,
  category: string,
  city: string,
  pitchType: string,
  senderName: string
): string {
  const name = businessName || 'there';
  const v = detectVertical(category, name);

  return buildPitchBody(name, city || 'your city', pitchType, senderName, v) + OPT_OUT_FOOTER;
}

function buildPitchBody(
  name: string,
  city: string,
  pitchType: string,
  senderName: string,
  v: VerticalFlags
): string {
  switch (pitchType) {
    case 'all_in_one':
      if (v.isRestaurant) {
        return `Namaste Team *${name}*! 🍽️\n\nI am ${senderName}. We build direct ordering & WhatsApp AI booking suites for restaurants in ${city}:\n\n1️⃣ *Direct QR & WhatsApp Food Ordering* (Zero 30% aggregator commission)\n2️⃣ *24/7 WhatsApp AI Table & Party Booking* (Instant reservation confirmation)\n3️⃣ *Automated Weekend Foodie Re-engagement* (Brings repeat diners back)\n4️⃣ *Google Maps Ranking & 5-Star Reviews Booster*\n\n🎁 We offer a *Free 3-Day Live Pilot* with zero setup cost for *${name}*.\n\nReply *YES* if you'd like to see a custom live demo!`;
      }
      if (v.isCA) {
        return `Namaste Team *${name}* (Chartered Accountants)! 📊\n\nI am ${senderName}. We build client automation & secure tech suites for CA firms in ${city}:\n\n1️⃣ *Modern CA Firm Portal & Mobile App* (Secure client login & ITR tracker)\n2️⃣ *24/7 WhatsApp AI Tax Assistant* (Instant answers to client compliance queries)\n3️⃣ *Automated Document Collection Vault* (Auto-collects GST bills on WhatsApp)\n4️⃣ *Proactive GST/ITR Deadline Reminders* (Zero manual client follow-ups)\n\n🎁 We are offering a *Free 3-Day Live Pilot* with zero upfront setup cost for *${name}*.\n\nReply *YES* if you'd like to see a custom live demo!`;
      }
      if (v.isHospital) {
        return `Namaste Team *${name}*! 🏥\n\nI am ${senderName}. We deliver hospital digitization & AI reception suites in ${city}:\n\n1️⃣ *Modern Hospital Web Portal & Android App* (Multi-specialty doctor schedule)\n2️⃣ *24/7 WhatsApp AI OPD Reception* (Auto token issue & bed inquiries)\n3️⃣ *Automated Lab Report Delivery on WhatsApp* (PDF dispatch to patients)\n4️⃣ *Google Maps Healthcare Ranking* (5-star reviews engine)\n\n🎁 We offer a *Free 3-Day Live Pilot* for *${name}*.\n\nReply *YES* if you'd like to see a custom live demo!`;
      }
      if (v.isSalon) {
        return `Hello Team *${name}*! ✂️\n\nI am ${senderName}. We provide technology and AI booking solutions for salons in ${city}:\n\n1️⃣ *Modern Salon Web App & Android App* (Interactive style gallery & rates)\n2️⃣ *24/7 WhatsApp AI Appointment Booking* (Stylist slot allocation)\n3️⃣ *Automated 3-Week Re-engagement Campaigns* (Boosts repeat client visits)\n4️⃣ *Google Maps Ranking & 5-Star Reviews Engine*\n\n🎁 We offer a *Free 3-Day Live Pilot* for *${name}*.\n\nReply *YES* to see a live demo!`;
      }
      if (v.isRealEstate) {
        return `Namaste Team *${name}*! 🏢\n\nI am ${senderName}. We build automated lead qualification & digital sales suites for real estate firms in ${city}:\n\n1️⃣ *Interactive Project Showcase Website & Buyer App* (3D floor plans & brochures)\n2️⃣ *24/7 WhatsApp AI Property Qualifier* (Auto-answers pricing & books site visits)\n3️⃣ *Automated Investor Re-engagement Broadcasts*\n4️⃣ *Google Maps SEO & Verified Local Presence*\n\n🎁 We offer a *Free 3-Day Live Pilot* for *${name}*.\n\nReply *YES* to see a custom demo!`;
      }
      if (v.isTuition) {
        return `Namaste Team *${name}*! 🎓\n\nI am ${senderName}. We build student admissions & parent automation suites for academies in ${city}:\n\n1️⃣ *Modern Academy Web Portal & Student Mobile App* (Timetables & test series)\n2️⃣ *24/7 WhatsApp AI Admissions & Demo Class Bot*\n3️⃣ *Automated Fee Reminders & Attendance WhatsApp Alerts*\n4️⃣ *Google Maps Education Ranking & 5-Star Reviews*\n\n🎁 We offer a *Free 3-Day Live Pilot* for *${name}*.\n\nReply *YES* for a live preview!`;
      }
      if (v.isRetail) {
        return `Hello Team *${name}*! 🛍️\n\nI am ${senderName}. We build digital catalog & WhatsApp commerce suites for retail stores in ${city}:\n\n1️⃣ *Interactive Mobile Catalog & E-Commerce Web App*\n2️⃣ *24/7 WhatsApp AI Product Inquiries & Order Taking*\n3️⃣ *Automated Festival & VIP Customer Broadcasts*\n4️⃣ *Google Maps Local Shopping Presence*\n\n🎁 We offer a *Free 3-Day Live Pilot* for *${name}*.\n\nReply *YES* to see a live demo!`;
      }
      return `Namaste Team *${name}*! 🩺\n\nI am ${senderName}. We provide modern technology solutions for clinics in ${city}:\n\n1️⃣ *Modern Responsive Website* (Ultra-fast Next.js)\n2️⃣ *Native Android App* (Play Store ready patient portal)\n3️⃣ *24/7 AI WhatsApp Assistant* (Auto OPD & Booking tokens)\n4️⃣ *Google Maps SEO* (Local rankings & 5-star reviews)\n\n🎁 We are offering a *Free 3-Day Live Pilot* with zero upfront setup cost for *${name}*.\n\nReply *YES* if you'd like to see a custom live demo!`;

    case 'web_mobile':
      if (v.isRestaurant) {
        return `Namaste Team *${name}*! 🌐\n\nTake direct orders without giving away 30% commission. We build custom *Online Ordering Web Apps & Android Apps* for restaurants in ${city}:\n\n🍔 *Direct Digital QR Menu & Mobile Ordering*\n⚡ *Ultra-Fast Customer Web App* with UPI payment\n📱 *Play Store Native App* for your brand\n\nCan I send you a custom mockup for *${name}*? Reply *YES* to review!`;
      }
      if (v.isCA) {
        return `Namaste Team *${name}*! 🌐\n\nWe build high-authority *Client Portals & Mobile Apps* for Chartered Accountants in ${city}:\n\n🔒 *Secure Client Document Vault & ITR Tracker*\n⚡ *Ultra-Fast Next.js Firm Website* (< 1s load speed)\n📱 *Native Android Client App* on Google Play Store\n💳 *Integrated Online Invoicing & UPI Payments*\n\nCan I send you a custom design mockup for *${name}*? Reply *YES* to review!`;
      }
      if (v.isHospital) {
        return `Namaste Team *${name}*! 🌐\n\nWe build lightning-fast *Patient Portals & Android Mobile Apps* for hospitals in ${city}:\n\n🚀 *Ultra-Fast Hospital Website* with instant WhatsApp appointment booking\n📱 *Native Android Patient App* (Doctor profiles, OPD booking & health records)\n💳 *Integrated Online Consultation & UPI Payment Gateway*\n\nCan I share a custom design mockup for *${name}*? Reply *YES* to see it!`;
      }
      return `Hello Team *${name}*! 👋\n\nWe build *Lightning-Fast Modern Websites & Android Apps* for businesses in ${city}:\n\n🚀 *Ultra-Fast Next.js High-Performance Website*\n📱 *Play Store Ready Native Android App*\n💳 *Integrated UPI & Online Payment Gateway*\n\nCan I send you a custom mockup for *${name}*? Reply *YES* to review!`;

    case 'whatsapp_ai':
      if (v.isRestaurant) {
        return `Hello Team *${name}*! 🍽️\n\nStop missing table inquiries and party bookings during rush hours.\n\nWe build *24/7 WhatsApp AI Food & Table Booking Agents* in ${city} that:\n\n✅ *Instant Table & Party Reservations*: Confirms bookings automatically 24/7\n✅ *Interactive WhatsApp Food Menu*: Customers browse dishes and order directly\n✅ *Weekend Re-engagement*: Sends special weekend offers to your past diners\n\nWould you like a quick 2-minute live demo on your WhatsApp? Reply *YES* to test it!\n\nBest regards,\n${senderName}`;
      }
      if (v.isCA) {
        return `Namaste Team *${name}* (Chartered Accountants)! 💼\n\nStop spending hours manually chasing clients for GST invoices and ITR documents.\n\nWe build *24/7 WhatsApp AI Agents for CA & Tax Firms* in ${city} that:\n\n✅ *Auto-Collect Tax Docs*: Clients upload PAN, Form 16 & GST bills on WhatsApp\n✅ *Automated Deadline Reminders*: Proactive alerts before GST & Advance Tax dates\n✅ *24/7 Tax Query Bot*: Answers client compliance & filing status queries instantly\n\nWould you like a quick 2-minute live demo on your WhatsApp? Reply *YES* to see it live!\n\nBest regards,\n${senderName}`;
      }
      if (v.isHospital) {
        return `Namaste Team *${name}*! 🏥\n\nEliminate front-desk phone bottlenecks and patient wait times.\n\nWe build *24/7 WhatsApp AI Receptionists for Hospitals* in ${city} that:\n\n✅ *Instant OPD Token & Bed Inquiries*: Automated token issuance 24/7\n✅ *Doctor Scheduling*: Real-time OPD slot booking across all specialties\n✅ *Automated Lab Report Delivery*: Dispatches PDF lab reports to patient WhatsApp\n\nWould you like a quick 2-minute live demo on WhatsApp? Reply *YES* to test it!\n\nBest regards,\n${senderName}`;
      }
      if (v.isSalon) {
        return `Hello Team *${name}*! ✂️\n\nStop losing appointments during busy styling hours when your staff is occupied.\n\nWe build *24/7 WhatsApp AI Booking Agents for Salons* in ${city} that:\n\n✅ *Instant Slot Booking*: Shows stylist availability & service menu 24/7\n✅ *Automated Client Re-engagement*: Invites clients back every 3-4 weeks\n✅ *5-Star Review Engine*: Collects Google ratings after every visit\n\nWould you like a quick 2-minute live demo on your WhatsApp? Reply *YES* to see it live!\n\nBest regards,\n${senderName}`;
      }
      return `Namaste Team *${name}*! 🩺\n\nWe build *24/7 AI WhatsApp Assistants* for professionals in ${city}.\n\n✅ *Auto-Book Consultations*: Clients book appointments 24/7 on WhatsApp\n✅ *Instant Inquiry Answers*: Resolves common questions automatically\n✅ *Follow-up Reminders*: Proactively reminds clients about next steps\n\nWould you like a quick 2-minute live demo on your WhatsApp? Reply *YES* to see it live!\n\nBest regards,\n${senderName}`;

    case 'local_seo':
      if (v.isRestaurant) {
        return `Namaste Team *${name}*! 📍\n\nWe help restaurants and cafes in ${city} rank higher on *Google Maps* when diners search for "best restaurants near me":\n\n⭐ *Automated 5-Star Google Reviews via WhatsApp*\n📍 *Google Maps Menu & Photos Optimization*\n🔍 *Improve visibility in local food searches in ${city}*\n\nWould you like a free Local SEO Audit Report for *${name}*? Reply *AUDIT* to receive it today!\n\nRegards,\n${senderName}`;
      }
      if (v.isCA) {
        return `Namaste Team *${name}*! 📍\n\nWe help CA & tax consulting firms in ${city} rank higher on *Google Maps* when companies search for "best CA near me":\n\n⭐ *Automated 5-Star Google Reviews via WhatsApp*\n📍 *Google Business Profile Optimization & Audit*\n🔍 *Improve visibility in local corporate searches in ${city}*\n\nWould you like a free Local SEO Audit Report for *${name}*? Reply *AUDIT* to receive it today!\n\nRegards,\n${senderName}`;
      }
      return `Namaste Team *${name}*! 📍\n\nWe help businesses in ${city} improve their *Google Maps* ranking to generate more local inquiries:\n\n⭐ *5-Star Review Automation via WhatsApp*\n📍 *Google Business Profile Optimization*\n🔍 *Better visibility in neighbourhood searches in ${city}*\n\nWould you like a free Local SEO Audit Report for *${name}*? Reply *AUDIT* to receive it today!\n\nRegards,\n${senderName}`;

    default:
      return `Namaste Team *${name}* 🙏\n\nI am ${senderName}. We build high-speed websites, Android apps, and 24/7 WhatsApp AI automation suites for businesses in ${city}.\n\nWould you be open to a quick 2-minute preview?`;
  }
}

/** Quick-reply buttons attached to every cold pitch. */
export const PITCH_BUTTONS = [
  { id: 'btn_show_demo', title: '✅ Yes, Show Demo' },
  { id: 'btn_pricing', title: '💰 Pricing & Cost?' },
  { id: 'btn_not_now', title: '❌ Not Now' },
] as const;
