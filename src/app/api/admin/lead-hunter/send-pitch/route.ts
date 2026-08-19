import { NextResponse } from 'next/server';
import { sendWhatsAppTextMessage, sendWhatsAppInteractiveButtons } from '@/lib/whatsapp';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      lead,
      pitchType = 'all_in_one',
      customMessage,
      senderName = 'Satish (WebCore Studios)',
    } = body;

    if (!lead || !lead.phone_number) {
      return NextResponse.json({ success: false, error: 'Target lead with valid phone number is required.' }, { status: 400 });
    }

    const businessName = lead.business_name || 'Business Owner';
    const city = lead.city || 'your city';
    const category = lead.category || 'business';

    // Generate personalized pitch based on selected service package
    let pitchText = '';

    if (customMessage && customMessage.trim().length > 0) {
      pitchText = customMessage
        .replace(/{Business_Name}/gi, businessName)
        .replace(/{City}/gi, city)
        .replace(/{Category}/gi, category);
    } else {
      pitchText = buildPersonalizedPitch(businessName, category, city, pitchType, senderName);
    }

    // Format clean recipient phone
    let cleanPhone = lead.phone_number.replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      const digits = cleanPhone.replace(/\D/g, '');
      cleanPhone = digits.length === 10 ? `+91${digits}` : `+${digits}`;
    }

    console.log(`[Lead Hunter Outreach] 📤 Dispatching pitch to ${businessName} (${cleanPhone})...`);

    // Dispatch via live WhatsApp Cloud API with interactive quick reply buttons
    const waResult = await sendWhatsAppInteractiveButtons(
      cleanPhone,
      pitchText,
      [
        { id: 'btn_show_demo', title: '✅ Yes, Show Demo' },
        { id: 'btn_pricing', title: '💰 Pricing & Cost?' },
        { id: 'btn_not_now', title: '❌ Not Now' },
      ]
    );

    // Record outbound pitch in conversations ledger
    try {
      let bizId: string | null = null;
      const { data: bizList } = await supabaseAdmin.from('businesses').select('id').limit(1);
      if (bizList && bizList.length > 0) {
        bizId = bizList[0].id;
      }

      if (bizId) {
        await supabaseAdmin.from('conversations').insert({
          business_id: bizId,
          customer_number: cleanPhone,
          message_text: pitchText,
          message_direction: 'outbound',
        });
      }
    } catch (convoErr) {
      console.warn('[Lead Hunter Convo Save Notice]:', convoErr);
    }

    // Update status in Supabase if lead has an ID
    if (lead.id) {
      try {
        await supabaseAdmin
          .from('lead_hunter_leads')
          .update({
            status: 'sent',
            pitch_type: pitchType,
            last_contacted_at: new Date().toISOString(),
          })
          .eq('id', lead.id);
      } catch (dbErr) {
        // Table might not exist yet
      }
    }

    return NextResponse.json({
      success: true,
      phone: cleanPhone,
      pitchType,
      messagePreview: pitchText.slice(0, 120) + '...',
      waResponse: waResult,
    });
  } catch (error: any) {
    console.error('[Lead Hunter Pitch Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * Builds high-converting multi-service pitches tailored for WebCore Studios
 */
/**
 * Builds high-converting multi-service pitches tailored for WebCore Studios
 */
function buildPersonalizedPitch(
  businessName: string,
  category: string,
  city: string,
  pitchType: string,
  senderName: string
): string {
  const cat = (category || '').toLowerCase();
  const name = businessName;
  const isCA =
    cat.includes('ca') ||
    cat.includes('tax') ||
    cat.includes('audit') ||
    cat.includes('accountant') ||
    name.toLowerCase().includes('ca ') ||
    name.toLowerCase().includes('accountant') ||
    name.toLowerCase().includes('gst');
  const isHospital = cat.includes('hospital') || name.toLowerCase().includes('hospital');
  const isSalon = cat.includes('salon') || cat.includes('spa') || cat.includes('beauty') || name.toLowerCase().includes('salon');

  switch (pitchType) {
    case 'all_in_one':
      if (isCA) {
        return `Namaste Team *${name}* (Chartered Accountants)! 📊\n\nI am ${senderName}. We build custom client automation & secure tech suites for top CA firms in ${city}:\n\n1️⃣ *Modern CA Firm Portal & Mobile App* (Secure client login & ITR tracker)\n2️⃣ *24/7 WhatsApp AI Tax Assistant* (Instant answers to client compliance queries)\n3️⃣ *Automated Document Collection Vault* (Auto-collects GST bills on WhatsApp)\n4️⃣ *Proactive GST/ITR Deadline Reminders* (Zero manual client follow-ups)\n\n🎁 We are offering a *Free 3-Day Live Pilot* with zero upfront setup cost for *${name}*.\n\nReply *YES* if you'd like to see a custom live demo!`;
      } else if (isHospital) {
        return `Namaste Team *${name}*! 🏥\n\nI am ${senderName}. We deliver full-stack hospital digitization & AI reception suites in ${city}:\n\n1️⃣ *Modern Hospital Web Portal & Android App* (Multi-specialty doctor schedule)\n2️⃣ *24/7 WhatsApp AI OPD Reception* (Auto token issue & bed inquiries)\n3️⃣ *Automated Lab Report Delivery on WhatsApp* (PDF dispatch to patients)\n4️⃣ *Google Maps Top #1 Healthcare Ranking* (5-star reviews engine)\n\n🎁 We offer a *Free 3-Day Live Pilot* for *${name}*.\n\nReply *YES* if you'd like to see a custom live demo!`;
      } else if (isSalon) {
        return `Hello Team *${name}*! ✂️\n\nI am ${senderName}. We provide complete technology and AI booking solutions for luxury salons in ${city}:\n\n1️⃣ *Modern Salon Web App & Android App* (Interactive style gallery & rates)\n2️⃣ *24/7 WhatsApp AI Appointment Booking* (Stylist slot allocation)\n3️⃣ *Automated 3-Week Re-engagement Campaigns* (Boosts repeat client visits)\n4️⃣ *Google Maps Top #1 Ranking & 5-Star Reviews Engine*\n\n🎁 We offer a *Free 3-Day Live Pilot* for *${name}*.\n\nReply *YES* to see a live demo!`;
      } else {
        return `Namaste Dr. / Team *${name}*! 🩺\n\nI am ${senderName}. We provide complete modern technology solutions for healthcare centers in ${city}:\n\n1️⃣ *Modern Responsive Website* (Ultra-fast Next.js)\n2️⃣ *Native Android App* (Play Store ready patient portal)\n3️⃣ *24/7 AI WhatsApp Assistant* (Auto OPD & Booking tokens)\n4️⃣ *Google Maps SEO* (Top Local Rankings & 5-Star Reviews)\n\n🎁 We are offering a *Free 3-Day Live Pilot* with zero upfront setup cost for *${name}*.\n\nReply *YES* if you'd like to see a custom live demo!`;
      }

    case 'web_mobile':
      if (isCA) {
        return `Namaste Team *${name}*! 🌐\n\nLegacy CA websites look outdated. We build high-authority *Client Portals & Mobile Apps* for Chartered Accountants in ${city}:\n\n🔒 *Secure Client Document Vault & ITR Tracker*\n⚡ *Ultra-Fast Next.js Firm Website* (< 1s load speed)\n📱 *Native Android Client App* on Google Play Store\n💳 *Integrated Online Invoicing & UPI Payments*\n\nCan I send you a custom design mockup for *${name}*? Reply *YES* to review!`;
      } else if (isHospital) {
        return `Namaste Team *${name}*! 🌐\n\nWe build lightning-fast *Patient Portals & Android Mobile Apps* for hospitals in ${city}:\n\n🚀 *Ultra-Fast Hospital Website* with instant WhatsApp appointment booking\n📱 *Native Android Patient App* (Doctor profiles, OPD booking & health records)\n💳 *Integrated Online Consultation & UPI Payment Gateway*\n\nCan I share a custom design mockup for *${name}*? Reply *YES* to see it!`;
      } else {
        return `Hello Team *${name}*! 👋\n\nWe build *Lightning-Fast Modern Websites & Android Apps* for businesses in ${city}:\n\n🚀 *Ultra-Fast Next.js High-Performance Website*\n📱 *Play Store Ready Native Android App*\n💳 *Integrated UPI & Online Payment Gateway*\n\nCan I send you a custom mockup for *${name}*? Reply *YES* to review!`;
      }

    case 'whatsapp_ai':
      if (isCA) {
        return `Namaste Team *${name}* (Chartered Accountants)! 💼\n\nStop spending hours manually chasing clients for GST invoices and ITR documents.\n\nWe build *24/7 WhatsApp AI Agents for CA & Tax Firms* in ${city} that:\n\n✅ *Auto-Collect Tax Docs*: Clients upload PAN, Form 16 & GST bills directly on WhatsApp\n✅ *Automated Deadline Reminders*: Smart proactive alerts before 20th GST & Advance Tax dates\n✅ *24/7 Tax Query Bot*: Answers client compliance & filing status queries instantly\n\nWould you like a quick 2-minute live demo on your WhatsApp? Reply *YES* to see it live!\n\nBest regards,\n${senderName}`;
      } else if (isHospital) {
        return `Namaste Team *${name}*! 🏥\n\nEliminate front-desk phone bottlenecks and patient wait times.\n\nWe build *24/7 WhatsApp AI Receptionists for Hospitals* in ${city} that:\n\n✅ *Instant OPD Token & Bed Inquiries*: Automated token issuance 24/7 on WhatsApp\n✅ *Doctor Scheduling*: Real-time OPD slot booking across all specialties\n✅ *Automated Lab Report Delivery*: Dispatches PDF lab reports directly to patient WhatsApp\n\nWould you like a quick 2-minute live demo on WhatsApp? Reply *YES* to test it!\n\nBest regards,\n${senderName}`;
      } else if (isSalon) {
        return `Hello Team *${name}*! ✂️\n\nStop losing appointments during busy styling hours when your staff is occupied.\n\nWe build *24/7 WhatsApp AI Booking Agents for Luxury Salons* in ${city} that:\n\n✅ *Instant Slot Booking*: Shows stylist availability & service menu 24/7\n✅ *Automated Client Re-engagement*: Proactively invites clients back for grooming every 3-4 weeks\n✅ *5-Star Review Engine*: Collects 5-star Google ratings after every visit\n\nWould you like a quick 2-minute live demo on your WhatsApp? Reply *YES* to see it live!\n\nBest regards,\n${senderName}`;
      } else {
        return `Namaste Dr. / Team *${name}*! 🩺\n\nI noticed your practice on Google Maps. We build *24/7 AI WhatsApp Assistants* for top doctors in ${city}.\n\n✅ *Auto-Book Consultations*: Patients book appointments 24/7 on WhatsApp\n✅ *Automated OPD Tokens*: Reduces clinic waiting room crowd by 40%\n✅ *Medicine & Follow-up Reminders*: Proactively reminds patients about checkups\n\nWould you like a quick 2-minute live demo on your WhatsApp? Reply *YES* to see it live!\n\nBest regards,\n${senderName}`;
      }

    case 'local_seo':
      if (isCA) {
        return `Namaste Team *${name}*! 📍\n\nWe help Chartered Accountant & Tax consulting firms in ${city} rank *Top #1 on Google Maps* when corporate companies and HNIs search for "Best CA near me":\n\n⭐ *Automated 5-Star Google Reviews via WhatsApp*\n📍 *Google Business Profile Optimization & Audit*\n🔍 *Dominate Local Corporate Searches in ${city}*\n\nWould you like a free Local SEO Audit Report for *${name}*? Reply *AUDIT* to receive it today!\n\nRegards,\n${senderName}`;
      } else {
        return `Namaste Team *${name}*! 📍\n\nWe help businesses in ${city} rank *Top 3 on Google Maps* to generate 50+ new client inquiries every month:\n\n⭐ *5-Star Review Automation via WhatsApp*\n📍 *Google Business Profile Optimization*\n🔍 *Dominate local neighborhood searches in ${city}*\n\nWould you like a free Local SEO Audit Report for *${name}*? Reply *AUDIT* to receive it today!\n\nRegards,\n${senderName}`;
      }

    default:
      return `Namaste Team *${name}* 🙏\n\nI am ${senderName}. We build high-speed websites, Android apps, and 24/7 WhatsApp AI automation suites for businesses in ${city}.\n\nWould you be open to a quick 2-minute preview?`;
  }
}
