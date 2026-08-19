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
function buildPersonalizedPitch(
  businessName: string,
  category: string,
  city: string,
  pitchType: string,
  senderName: string
): string {
  switch (pitchType) {
    case 'all_in_one':
      // Multi-service: Web App + Android App + WhatsApp AI + SEO
      if (category === 'hospital' || category === 'clinic') {
        return `Namaste Dr. / Team *${businessName}* 🙏

I noticed your clinic in ${city} and saw your patient reviews!

I am ${senderName}. We specialize in complete digital & AI tech solutions for healthcare centers:

🚀 *What We Build for You:*
1. 🩺 *24/7 WhatsApp AI Receptionist* — Issues automated OPD queue tokens & confirms appointments.
2. 📱 *Custom Android & Web App* — Fast patient portal, doctor schedules & online booking.
3. ⭐ *Google Maps Local SEO* — Automates 5-star Google review collection to rank your clinic #1 in ${city}.
4. ⚡ *Ultra-Fast Modern Website* — Mobile-responsive with direct WhatsApp consultation CTAs.

Would you be open to a quick 2-minute live demo on WhatsApp? I can set up a free 3-day pilot on your clinic number!`;
      } else if (category === 'ca_firm') {
        return `Namaste Team *${businessName}* (Chartered Accountants) 🙏

I am ${senderName}. We build custom full-stack software and automation suites for top CA & Tax firms in ${city}.

💼 *What We Deliver for Your Firm:*
1. 📊 *WhatsApp Client Vault* — Automatically pings clients before GST/ITR deadlines and collects tax invoices on WhatsApp.
2. 🌐 *Custom Web Portal & Android App* — Secure client login, document tracker, and billing ledger.
3. ⭐ *Google Business SEO* — Boosts your firm's visibility for corporate and NRI clients in ${city}.

Can I share a 45-second interactive preview video showing how it automates tax document collection?`;
      } else {
        return `Namaste Team *${businessName}* 🙏

I am ${senderName}. We build custom high-speed tech suites for growing businesses in ${city}:

🚀 *Our Core Services:*
• 🌐 *Custom Websites & Full-Stack Web Apps* (Ultra-fast, Next.js / React)
• 📱 *Native Android Mobile Apps* (Play Store ready)
• 🤖 *24/7 WhatsApp AI Automation* (Auto-orders, bookings & customer replies)
• 📈 *Local SEO & Google Maps Ranking* (Generate more 5-star reviews & leads)

Would you like to see a quick 2-minute interactive demo tailored for *${businessName}*?`;
      }

    case 'web_mobile':
      return `Namaste Team *${businessName}* 🙏

I am ${senderName}. We build high-performance, modern websites and native Android apps for businesses in ${city}.

🌟 *Why Upgrade with Us:*
• ⚡ 100% Mobile-optimized, blazing fast loading (< 1 sec)
• 📱 Native Android app published on Google Play Store
• 💬 Built-in direct WhatsApp chat & lead capture
• 💳 Integrated online UPI / Razorpay payment gateway

Can we share a modern design mockup tailored for *${businessName}* this week?`;

    case 'whatsapp_ai':
      return `Namaste Team *${businessName}* 🙏

Did you know 35% of customer inquiries on WhatsApp are missed when your front desk is busy?

We built a *24/7 WhatsApp AI Assistant* tailored for *${businessName}* that:
✅ Instantly answers customer inquiries & shares menus/services
✅ Books appointment slots / takes orders automatically 24/7
✅ Collects customer feedback & Google ratings

Can we activate a free 3-day test pilot on your number?`;

    case 'local_seo':
      return `Namaste Team *${businessName}* 🙏

We noticed your Google Maps profile in ${city}! 

We help local businesses rank in the **Top 3 on Google Maps** and automatically gather **50+ genuine 5-star reviews** every month via automated post-visit WhatsApp messages.

Would you like a free 3-minute Google SEO audit for *${businessName}*?`;

    default:
      return `Namaste Team *${businessName}* 🙏\n\nI am ${senderName}. We build high-speed websites, Android apps, and 24/7 WhatsApp AI automation suites for businesses in ${city}.\n\nWould you be open to a quick 2-minute preview?`;
  }
}
