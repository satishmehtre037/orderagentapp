import { sendWhatsAppInteractiveButtons } from '@/lib/whatsapp';
import { supabaseAdmin } from '@/lib/supabase';

export interface CampaignLead {
  id: string;
  business_name: string;
  phone_number: string;
  category?: string;
  city?: string;
  status?: string;
  [key: string]: any;
}

export interface CampaignLog {
  time: string;
  text: string;
  type: 'info' | 'success' | 'warn';
}

export interface CampaignState {
  id: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';
  currentIndex: number;
  total: number;
  delaySeconds: number;
  countdown: number;
  currentLead: CampaignLead | null;
  pitchType: string;
  senderName: string;
  startedAt: string | null;
  finishedAt: string | null;
  logs: CampaignLog[];
}

export function buildPersonalizedPitch(
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

class CampaignService {
  private state: CampaignState = {
    id: '',
    status: 'idle',
    currentIndex: 0,
    total: 0,
    delaySeconds: 35,
    countdown: 0,
    currentLead: null,
    pitchType: 'all_in_one',
    senderName: 'Satish (WebCore Studios)',
    startedAt: null,
    finishedAt: null,
    logs: [],
  };

  private queue: CampaignLead[] = [];
  private customMessage: string = '';
  private isCancelled: boolean = false;
  private isPaused: boolean = false;
  private isRunning: boolean = false;

  public getStatus(): CampaignState {
    return { ...this.state };
  }

  public addLog(text: string, type: 'info' | 'success' | 'warn' = 'info') {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.state.logs = [{ time, text, type }, ...this.state.logs.slice(0, 70)];
  }

  public startCampaign(params: {
    leads: CampaignLead[];
    pitchType?: string;
    customMessage?: string;
    senderName?: string;
    delaySeconds?: number;
  }): { success: boolean; error?: string; campaignId?: string } {
    if (this.isRunning && this.state.status === 'running') {
      return { success: false, error: 'A background campaign is already actively running.' };
    }

    const validLeads = (params.leads || []).filter(
      (l) => (l.phone_number || '').replace(/\D/g, '').length >= 10
    );

    if (validLeads.length === 0) {
      return { success: false, error: 'No valid leads with phone numbers provided.' };
    }

    this.queue = validLeads;
    this.customMessage = params.customMessage || '';
    this.isCancelled = false;
    this.isPaused = false;
    this.isRunning = true;

    const campaignId = `camp_${Date.now()}`;
    this.state = {
      id: campaignId,
      status: 'running',
      currentIndex: 0,
      total: validLeads.length,
      delaySeconds: params.delaySeconds && params.delaySeconds >= 10 ? params.delaySeconds : 35,
      countdown: 0,
      currentLead: null,
      pitchType: params.pitchType || 'all_in_one',
      senderName: params.senderName || 'Satish (WebCore Studios)',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      logs: [],
    };

    this.addLog(`🚀 Cloud Background Campaign started with ${validLeads.length} leads (${this.state.delaySeconds}s safe pacing)`, 'info');

    // Launch non-blocking background loop on server
    this.runBackgroundLoop();

    return { success: true, campaignId };
  }

  public pauseCampaign(): { success: boolean } {
    if (this.state.status === 'running') {
      this.isPaused = true;
      this.state.status = 'paused';
      this.addLog(`⏸️ Background campaign paused by user`, 'warn');
      return { success: true };
    }
    return { success: false };
  }

  public resumeCampaign(): { success: boolean } {
    if (this.state.status === 'paused') {
      this.isPaused = false;
      this.state.status = 'running';
      this.addLog(`▶️ Background campaign resumed`, 'info');
      return { success: true };
    }
    return { success: false };
  }

  public cancelCampaign(): { success: boolean } {
    this.isCancelled = true;
    this.isRunning = false;
    this.state.status = 'cancelled';
    this.state.finishedAt = new Date().toISOString();
    this.addLog(`🛑 Background campaign cancelled by user`, 'warn');
    return { success: true };
  }

  private async runBackgroundLoop() {
    for (let i = 0; i < this.queue.length; i++) {
      if (this.isCancelled) break;

      while (this.isPaused) {
        await new Promise((r) => setTimeout(r, 800));
        if (this.isCancelled) break;
      }
      if (this.isCancelled) break;

      const lead = this.queue[i];
      this.state.currentIndex = i + 1;
      this.state.currentLead = lead;

      await this.dispatchLeadPitch(lead);

      // Safe pacing countdown delay between sends
      if (i < this.queue.length - 1 && !this.isCancelled) {
        for (let c = this.state.delaySeconds; c > 0; c--) {
          if (this.isCancelled) break;
          while (this.isPaused) {
            await new Promise((r) => setTimeout(r, 800));
            if (this.isCancelled) break;
          }
          this.state.countdown = c;
          await new Promise((r) => setTimeout(r, 1000));
        }
        this.state.countdown = 0;
      }
    }

    if (!this.isCancelled) {
      this.state.status = 'completed';
      this.state.finishedAt = new Date().toISOString();
      this.isRunning = false;
      this.addLog(`🎉 Background Campaign completed! Dispatched ${this.state.total} leads.`, 'success');
    }
  }

  private async dispatchLeadPitch(lead: CampaignLead) {
    const businessName = lead.business_name || 'Business Owner';
    const city = lead.city || 'your city';
    const category = lead.category || 'business';

    let pitchText = '';
    if (this.customMessage && this.customMessage.trim().length > 0) {
      pitchText = this.customMessage
        .replace(/{Business_Name}/gi, businessName)
        .replace(/{City}/gi, city)
        .replace(/{Category}/gi, category);
    } else {
      pitchText = buildPersonalizedPitch(businessName, category, city, this.state.pitchType, this.state.senderName);
    }

    let cleanPhone = lead.phone_number.replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      const digits = cleanPhone.replace(/\D/g, '');
      cleanPhone = digits.length === 10 ? `+91${digits}` : `+${digits}`;
    }

    this.addLog(`[${this.state.currentIndex}/${this.state.total}] 📤 Pitching ${businessName} (${cleanPhone})...`, 'info');

    try {
      await sendWhatsAppInteractiveButtons(
        cleanPhone,
        pitchText,
        [
          { id: 'btn_show_demo', title: '✅ Yes, Show Demo' },
          { id: 'btn_pricing', title: '💰 Pricing & Cost?' },
          { id: 'btn_not_now', title: '❌ Not Now' },
        ]
      );

      // Record in conversations table
      try {
        let bizId = 'e39dee77-e7b9-45cf-ad64-fd6400f59a29';
        const { data: bizList } = await supabaseAdmin.from('businesses').select('id').limit(1);
        if (bizList && bizList.length > 0) bizId = bizList[0].id;

        await supabaseAdmin.from('conversations').insert({
          business_id: bizId,
          customer_number: cleanPhone,
          message_text: pitchText,
          message_direction: 'outbound',
        });
      } catch (dbErr) {
        console.warn('[Campaign DB Save Notice]:', dbErr);
      }

      this.addLog(`✅ Pitch delivered to ${businessName}!`, 'success');
    } catch (err: any) {
      this.addLog(`⚠️ Failed pitching ${businessName}: ${err.message}`, 'warn');
    }
  }
}

// Global Singleton instance in server environment
const globalForCampaign = global as unknown as { campaignService?: CampaignService };
export const campaignService = globalForCampaign.campaignService || new CampaignService();
if (process.env.NODE_ENV !== 'production') globalForCampaign.campaignService = campaignService;
