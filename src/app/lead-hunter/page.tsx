'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Building2,
  Phone,
  Sparkles,
  Send,
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Layers,
  Smartphone,
  Globe,
  TrendingUp,
  RefreshCw,
  Star,
  MapPin,
  Lock,
  Unlock,
  Code2,
  MessageSquare,
  Bot,
  Zap,
} from 'lucide-react';
import { ScrapedLead } from '../api/admin/lead-hunter/search/route';

export default function LeadHunterPage() {
  // Navigation Tab: 'hunter' = Lead Scraper & Dispatcher, 'chats' = Live WhatsApp Conversations
  const [activeTab, setActiveTab] = useState<'hunter' | 'chats'>('hunter');

  // 1. Passcode Lockscreen State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  // 2. Search & Lead Scraper State
  const [selectedCategory, setSelectedCategory] = useState('clinic');
  const [city, setCity] = useState('Thane');
  const [leadVolume, setLeadVolume] = useState<number>(25);
  const [noWebsiteOnly, setNoWebsiteOnly] = useState<boolean>(false);
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [leads, setLeads] = useState<ScrapedLead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedNumbersText, setPastedNumbersText] = useState('');

  // 3. Multi-Service Pitch Arsenal State
  const [pitchType, setPitchType] = useState<'all_in_one' | 'whatsapp_ai' | 'web_mobile' | 'local_seo' | 'custom'>('all_in_one');
  const [senderName, setSenderName] = useState('Satish (WebCore Studios)');
  const [customMessage, setCustomMessage] = useState('');
  const [showPitchPreview, setShowPitchPreview] = useState(false);
  const [previewSampleLead, setPreviewSampleLead] = useState<ScrapedLead | null>(null);

  // 4. Smart Paced Campaign State
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [isCampaignPaused, setIsCampaignPaused] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState(35);
  const [campaignCurrentIdx, setCampaignCurrentIdx] = useState(0);
  const [campaignTotal, setCampaignTotal] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [campaignLogs, setCampaignLogs] = useState<Array<{ time: string; text: string; type: 'info' | 'success' | 'warn' }>>([]);

  // 5. Live WhatsApp Chat Inbox State
  const [chatThreads, setChatThreads] = useState<any[]>([]);
  const [selectedThreadPhone, setSelectedThreadPhone] = useState<string | null>(null);
  const [chatReplyText, setChatReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [chatSearchFilter, setChatSearchFilter] = useState('');

  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);

  // Check saved session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = sessionStorage.getItem('webcore_admin_auth');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'webcore2026' || passcode.trim() === 'admin123') {
      setIsAuthenticated(true);
      setPasscodeError(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('webcore_admin_auth', 'true');
      }
    } else {
      setPasscodeError(true);
    }
  };

  // Search / Scrape Leads
  const handleSearchLeads = async () => {
    setIsSearching(true);
    try {
      const res = await fetch('/api/admin/lead-hunter/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          city: city || 'Thane',
          customQuery: customSearchQuery || undefined,
          count: leadVolume,
          noWebsiteOnly,
        }),
      });
      const data = await res.json();
      if (data.success && data.leads) {
        setLeads(data.leads);
        setSelectedLeadIds(data.leads.map((l: ScrapedLead) => l.id));
        addLog(`⚡ Extracted ${data.leads.length} live verified leads for "${data.query}"`, 'success');
      } else {
        addLog(`Search failed: ${data.error || 'Unknown error'}`, 'warn');
      }
    } catch (err: any) {
      addLog(`Error searching leads: ${err.message}`, 'warn');
    } finally {
      setIsSearching(false);
    }
  };

  // Toggle Single Lead Selection
  const handleToggleLeadSelection = (leadId: string) => {
    if (selectedLeadIds.includes(leadId)) {
      setSelectedLeadIds(selectedLeadIds.filter((id) => id !== leadId));
    } else {
      setSelectedLeadIds([...selectedLeadIds, leadId]);
    }
  };

  // Select/Deselect All
  const handleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
    }
  };

  // Import Pasted Numbers
  const handleImportPastedNumbers = () => {
    if (!pastedNumbersText.trim()) return;
    const lines = pastedNumbersText.split('\n');
    const imported: ScrapedLead[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const parts = trimmed.split(/,|\t/);
      let name = '';
      let phone = '';

      if (parts.length >= 2) {
        name = parts[0].trim();
        phone = parts[1].trim();
      } else {
        phone = trimmed;
        name = `External Contact #${idx + 1}`;
      }

      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 10) {
        const cleanPhone = digits.length === 10 ? `+91${digits}` : `+${digits}`;
        imported.push({
          id: `lead_pasted_${idx}_${Date.now()}`,
          business_name: name,
          category: selectedCategory,
          city: city || 'Thane',
          phone_number: cleanPhone,
          rating: 4.5,
          reviews_count: 50,
          address: `${city || 'Thane'} (Direct Upload)`,
          has_website: false,
          maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + (city || 'Thane'))}`,
          status: 'pending',
        });
      }
    });

    if (imported.length > 0) {
      setLeads((prev) => [...imported, ...prev]);
      setSelectedLeadIds((prev) => [...imported.map((l) => l.id), ...prev]);
      addLog(`📥 Successfully imported ${imported.length} external leads into queue!`, 'success');
      setShowPasteModal(false);
      setPastedNumbersText('');
    } else {
      alert('No valid 10-digit phone numbers detected in text.');
    }
  };

  // Quick Add Personal Test Lead
  const handleAddMyNumberTestLead = () => {
    const myTestLead: ScrapedLead = {
      id: `lead_my_test_${Date.now()}`,
      business_name: 'Satish Mehtre (WebCore Demo Lead)',
      category: selectedCategory,
      city: city || 'Thane',
      phone_number: '+918779841346',
      rating: 5.0,
      reviews_count: 120,
      address: `${city || 'Thane'} HQ (Personal Test Lead)`,
      has_website: true,
      website: 'https://webcorestudios.com',
      maps_url: `https://www.google.com/maps/search/?api=1&query=Thane+West+Maharashtra`,
      status: 'pending',
    };
    setLeads((prev) => [myTestLead, ...prev.filter((l) => l.phone_number !== '+918779841346')]);
    setSelectedLeadIds((prev) => [myTestLead.id, ...prev]);
    addLog(`📱 Added your personal test lead (+918779841346). Click "Send Pitch" to test live!`, 'success');
  };

  // Fetch Conversations / Threads (Merging server + local state)
  const fetchConversations = async () => {
    setIsLoadingChats(true);
    let localSaved: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('webcore_lead_threads');
        if (raw) localSaved = JSON.parse(raw);
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/admin/lead-hunter/conversations');
      const data = await res.json();
      const serverThreads: any[] = data.success && data.threads ? data.threads : [];

      // Merge server threads and local threads by phone
      const map: Record<string, any> = {};
      [...localSaved, ...serverThreads].forEach((t) => {
        const clean = t.phone.replace(/\D/g, '');
        if (!map[clean]) {
          map[clean] = t;
        } else {
          // Merge messages and pick latest
          const existing = map[clean];
          const allMsgs = [...(existing.messages || []), ...(t.messages || [])];
          const seenMsgIds = new Set<string>();
          const dedupedMsgs = allMsgs.filter((m) => {
            const id = m.id || m.text;
            if (seenMsgIds.has(id)) return false;
            seenMsgIds.add(id);
            return true;
          });
          map[clean] = {
            ...existing,
            ...t,
            messages: dedupedMsgs,
            last_message: t.last_message || existing.last_message,
            last_timestamp: t.last_timestamp || existing.last_timestamp,
          };
        }
      });

      const merged = Object.values(map).sort(
        (a: any, b: any) => new Date(b.last_timestamp).getTime() - new Date(a.last_timestamp).getTime()
      );

      setChatThreads(merged);
      if (typeof window !== 'undefined') {
        localStorage.setItem('webcore_lead_threads', JSON.stringify(merged));
      }
      if (!selectedThreadPhone && merged.length > 0) {
        setSelectedThreadPhone(merged[0].phone);
      }
    } catch (err: any) {
      if (localSaved.length > 0) {
        setChatThreads(localSaved);
        if (!selectedThreadPhone) setSelectedThreadPhone(localSaved[0].phone);
      }
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Load chats on initial mount & when switching to 'chats' tab
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (activeTab === 'chats' && isAuthenticated) {
      const interval = setInterval(fetchConversations, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, isAuthenticated]);

  // Send Direct Manual Reply from Dashboard Chat Window
  const sendManualChatReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedThreadPhone || !chatReplyText.trim()) return;

    setIsSendingReply(true);
    const cleanTarget = selectedThreadPhone.replace(/\D/g, '');
    const activeThread = chatThreads.find((t) => t.phone.replace(/\D/g, '') === cleanTarget);
    const textToSend = chatReplyText.trim();
    setChatReplyText('');

    const newLocalMsg = {
      id: `msg_local_${Date.now()}`,
      text: textToSend,
      sender: 'bot',
      timestamp: new Date().toISOString(),
    };

    // Optimistically update UI and local storage immediately
    setChatThreads((prev) => {
      const exists = prev.find((t) => t.phone.replace(/\D/g, '') === cleanTarget);
      let updated: any[];
      if (exists) {
        updated = prev.map((thread) =>
          thread.phone.replace(/\D/g, '') === cleanTarget
            ? {
                ...thread,
                last_message: textToSend,
                last_sender: 'bot',
                last_timestamp: new Date().toISOString(),
                messages: [...(thread.messages || []), newLocalMsg],
              }
            : thread
        );
      } else {
        updated = [
          {
            phone: selectedThreadPhone,
            business_name: activeThread?.business_name || 'Prospect',
            category: activeThread?.category || 'lead',
            last_message: textToSend,
            last_sender: 'bot',
            last_timestamp: new Date().toISOString(),
            messages: [newLocalMsg],
          },
          ...prev,
        ];
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('webcore_lead_threads', JSON.stringify(updated));
      }
      return updated;
    });

    try {
      const res = await fetch('/api/admin/lead-hunter/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedThreadPhone,
          message: textToSend,
          businessName: activeThread?.business_name || 'Prospect',
        }),
      });
      const data = await res.json();
      if (data.success) {
        addLog(`💬 Manual reply sent to ${selectedThreadPhone}`, 'success');
        setTimeout(fetchConversations, 1200);
      } else {
        alert(`Failed to send: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Send Exception: ${err.message}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Add Log Entry
  const addLog = (text: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setCampaignLogs((prev) => [{ time, text, type }, ...prev.slice(0, 49)]);
  };

  // Dispatch Single Pitch
  const sendSinglePitch = async (lead: ScrapedLead) => {
    const cleanDigits = (lead.phone_number || '').replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      addLog(`⚠️ Cannot send to "${lead.business_name}": Missing or incomplete phone number (${lead.phone_number || 'Empty'}). Edit in table to send!`, 'warn');
      return;
    }

    addLog(`Dispatching pitch to ${lead.business_name} (${lead.phone_number})...`, 'info');
    try {
      const res = await fetch('/api/admin/lead-hunter/send-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          pitchType,
          customMessage: pitchType === 'custom' ? customMessage : undefined,
          senderName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, status: 'sent' } : l))
        );

        const pitchContent = generatePitchText(lead, pitchType, customMessage, senderName);
        const newMsg = {
          id: `msg_pitch_${Date.now()}`,
          text: pitchContent,
          sender: 'bot',
          timestamp: new Date().toISOString(),
        };

        setChatThreads((prev) => {
          const clean = lead.phone_number.replace(/\D/g, '');
          const existingIdx = prev.findIndex((t) => t.phone.replace(/\D/g, '') === clean);
          let updated: any[];
          if (existingIdx >= 0) {
            updated = prev.map((t, idx) =>
              idx === existingIdx
                ? {
                    ...t,
                    last_message: pitchContent,
                    last_sender: 'bot',
                    last_timestamp: new Date().toISOString(),
                    messages: [...(t.messages || []), newMsg],
                  }
                : t
            );
          } else {
            updated = [
              {
                phone: lead.phone_number,
                business_name: lead.business_name,
                category: lead.category,
                last_message: pitchContent,
                last_sender: 'bot',
                last_timestamp: new Date().toISOString(),
                messages: [newMsg],
              },
              ...prev,
            ];
          }

          if (typeof window !== 'undefined') {
            localStorage.setItem('webcore_lead_threads', JSON.stringify(updated));
          }
          return updated;
        });

        addLog(`✅ WhatsApp Pitch delivered to ${lead.business_name}!`, 'success');
      } else {
        addLog(`⚠️ Failed delivering to ${lead.business_name}: ${data.error}`, 'warn');
      }
    } catch (err: any) {
      addLog(`❌ Network error pitching ${lead.business_name}: ${err.message}`, 'warn');
    }
  };

  // Paced Campaign Dispatcher
  const handleStartPacedCampaign = async () => {
    const validQueue = leads.filter(
      (l) => selectedLeadIds.includes(l.id) && l.status === 'pending' && (l.phone_number || '').replace(/\D/g, '').length >= 10
    );
    const missingQueue = leads.filter(
      (l) => selectedLeadIds.includes(l.id) && l.status === 'pending' && (l.phone_number || '').replace(/\D/g, '').length < 10
    );

    if (missingQueue.length > 0) {
      addLog(`ℹ️ Skipped ${missingQueue.length} leads with missing phone numbers. Click Maps or edit their number in the table.`, 'warn');
    }

    if (validQueue.length === 0) {
      alert('No pending leads with valid phone numbers selected. Please enter phone numbers in the table or click "Add My Number".');
      return;
    }

    setIsCampaignRunning(true);
    setIsCampaignPaused(false);
    isRunningRef.current = true;
    isPausedRef.current = false;
    setCampaignTotal(validQueue.length);
    setCampaignCurrentIdx(0);
    addLog(`🚀 Starting automated campaign: ${validQueue.length} verified leads with ${delaySeconds}s safe delay...`, 'info');

    for (let i = 0; i < validQueue.length; i++) {
      if (!isRunningRef.current) break;

      while (isPausedRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!isRunningRef.current) break;
      }

      if (!isRunningRef.current) break;

      const lead = validQueue[i];
      setCampaignCurrentIdx(i + 1);
      await sendSinglePitch(lead);

      if (i < validQueue.length - 1 && isRunningRef.current) {
        for (let c = delaySeconds; c > 0; c--) {
          if (!isRunningRef.current) break;
          while (isPausedRef.current) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (!isRunningRef.current) break;
          }
          setCountdown(c);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        setCountdown(0);
      }
    }

    setIsCampaignRunning(false);
    isRunningRef.current = false;
    addLog(`🎉 Campaign execution completed!`, 'success');
  };

  const handlePauseResumeCampaign = () => {
    if (isCampaignPaused) {
      setIsCampaignPaused(false);
      isPausedRef.current = false;
      addLog(`▶️ Campaign resumed.`, 'info');
    } else {
      setIsCampaignPaused(true);
      isPausedRef.current = true;
      addLog(`⏸️ Campaign paused.`, 'warn');
    }
  };

  const handleStopCampaign = () => {
    setIsCampaignRunning(false);
    setIsCampaignPaused(false);
    isRunningRef.current = false;
    isPausedRef.current = false;
    setCountdown(0);
    addLog(`🛑 Campaign stopped by user.`, 'warn');
  };

  // Generate Pitch Preview Text (Category-Aware High-Conversion AI Copy)
  const generatePitchText = (lead: ScrapedLead, type: string, custom: string, sender: string) => {
    if (type === 'custom' && custom.trim()) {
      return custom
        .replace(/{business_name}/gi, lead.business_name)
        .replace(/{city}/gi, lead.city)
        .replace(/{sender_name}/gi, sender);
    }
    const name = lead.business_name;
    const cat = (lead.category || '').toLowerCase();
    const city = lead.city || 'your city';

    const isCA = cat.includes('ca') || cat.includes('tax') || cat.includes('audit') || cat.includes('accountant') || name.toLowerCase().includes('ca ') || name.toLowerCase().includes('accountant') || name.toLowerCase().includes('gst');
    const isHospital = cat.includes('hospital') || name.toLowerCase().includes('hospital');
    const isSalon = cat.includes('salon') || cat.includes('spa') || cat.includes('beauty') || name.toLowerCase().includes('salon');
    const isClinic = !isCA && !isHospital && !isSalon;

    if (type === 'whatsapp_ai') {
      if (isCA) {
        return `Namaste Team *${name}* (Chartered Accountants)! 💼\n\nStop spending hours manually chasing clients for GST invoices and ITR documents.\n\nWe build *24/7 WhatsApp AI Agents for CA & Tax Firms* in ${city} that:\n\n✅ *Auto-Collect Tax Docs*: Clients upload PAN, Form 16 & GST bills directly on WhatsApp\n✅ *Automated Deadline Reminders*: Smart proactive alerts before 20th GST & Advance Tax dates\n✅ *24/7 Tax Query Bot*: Answers client compliance & filing status queries instantly\n\nWould you like a quick 2-minute live demo on your WhatsApp? Reply *YES* to see it live!\n\nBest regards,\n${sender}`;
      } else if (isHospital) {
        return `Namaste Team *${name}*! 🏥\n\nEliminate front-desk phone bottlenecks and patient wait times.\n\nWe build *24/7 WhatsApp AI Receptionists for Hospitals* in ${city} that:\n\n✅ *Instant OPD Token & Bed Inquiries*: Automated token issuance 24/7 on WhatsApp\n✅ *Doctor Scheduling*: Real-time OPD slot booking across all specialties\n✅ *Automated Lab Report Delivery*: Dispatches PDF lab reports directly to patient WhatsApp\n\nWould you like a quick 2-minute live demo on WhatsApp? Reply *YES* to test it!\n\nBest regards,\n${sender}`;
      } else if (isSalon) {
        return `Hello Team *${name}*! ✂️\n\nStop losing appointments during busy styling hours when your staff is occupied.\n\nWe build *24/7 WhatsApp AI Booking Agents for Luxury Salons* in ${city} that:\n\n✅ *Instant Slot Booking*: Shows stylist availability & service menu 24/7\n✅ *Automated Client Re-engagement*: Proactively invites clients back for grooming every 3-4 weeks\n✅ *5-Star Review Engine*: Collects 5-star Google ratings after every visit\n\nWould you like a quick 2-minute live demo on your WhatsApp? Reply *YES* to see it live!\n\nBest regards,\n${sender}`;
      } else {
        return `Namaste Dr. / Team *${name}*! 🩺\n\nI noticed your practice on Google Maps. We build *24/7 AI WhatsApp Assistants* for top doctors in ${city}.\n\n✅ *Auto-Book Consultations*: Patients book appointments 24/7 on WhatsApp\n✅ *Automated OPD Tokens*: Reduces clinic waiting room crowd by 40%\n✅ *Medicine & Follow-up Reminders*: Proactively reminds patients about checkups\n\nWould you like a quick 2-minute live demo on your WhatsApp? Reply *YES* to see it live!\n\nBest regards,\n${sender}`;
      }
    }

    if (type === 'web_mobile') {
      if (isCA) {
        return `Namaste Team *${name}*! 🌐\n\nLegacy CA websites look outdated. We build high-authority *Client Portals & Mobile Apps* for Chartered Accountants in ${city}:\n\n🔒 *Secure Client Document Vault & ITR Tracker*\n⚡ *Ultra-Fast Next.js Firm Website* (< 1s load speed)\n📱 *Native Android Client App* on Google Play Store\n💳 *Integrated Online Invoicing & UPI Payments*\n\nCan I send you a custom design mockup for *${name}*? Reply *YES* to review!\n\nBest regards,\n${sender}`;
      } else if (isHospital || isClinic) {
        return `Namaste Team *${name}*! 🌐\n\nWe build lightning-fast *Patient Portals & Android Mobile Apps* for healthcare centers in ${city}:\n\n🚀 *Ultra-Fast Hospital/Clinic Website* with instant WhatsApp appointment booking\n📱 *Native Android Patient App* (Doctor profiles, OPD booking & health records)\n💳 *Integrated Online Consultation & UPI Payment Gateway*\n\nCan I share a custom interactive design mockup for *${name}*? Reply *YES* to see it!\n\nBest regards,\n${sender}`;
      } else {
        return `Hello Team *${name}*! 👋\n\nWe build *Lightning-Fast Modern Websites & Android Apps* for growing businesses in ${city}:\n\n🚀 *Ultra-Fast Next.js High-Performance Website*\n📱 *Play Store Ready Native Android App*\n💳 *Integrated UPI & Online Payment Gateway*\n\nCan I send you a custom mockup for *${name}*? Reply *YES* to review!\n\nCheers,\n${sender}`;
      }
    }

    if (type === 'local_seo') {
      if (isCA) {
        return `Namaste Team *${name}*! 📍\n\nWe help Chartered Accountant & Tax consulting firms in ${city} rank *Top #1 on Google Maps* when corporate companies and HNIs search for "Best CA near me":\n\n⭐ *Automated 5-Star Google Reviews via WhatsApp*\n📍 *Google Business Profile Optimization & Audit*\n🔍 *Dominate Local Corporate Searches in ${city}*\n\nWould you like a free Local SEO Audit Report for *${name}*? Reply *AUDIT* to receive it today!\n\nRegards,\n${sender}`;
      } else {
        return `Namaste Team *${name}*! 📍\n\nWe help businesses in ${city} rank *Top 3 on Google Maps* to generate 50+ new client inquiries every month:\n\n⭐ *5-Star Review Automation via WhatsApp*\n📍 *Google Business Profile Optimization*\n🔍 *Dominate local neighborhood searches in ${city}*\n\nWould you like a free Local SEO Audit Report for *${name}*? Reply *AUDIT* to receive it today!\n\nRegards,\n${sender}`;
      }
    }

    // Default: All In One Tech Suite
    if (isCA) {
      return `Namaste Team *${name}* (Chartered Accountants)! 📊\n\nI am Satish from *WebCore Studios*. We build custom client automation & secure tech suites for top CA firms in ${city}:\n\n1️⃣ *Modern CA Firm Portal & Mobile App* (Secure client login & ITR tracker)\n2️⃣ *24/7 WhatsApp AI Tax Assistant* (Instant answers to client compliance queries)\n3️⃣ *Automated Document Collection Vault* (Auto-collects GST bills on WhatsApp)\n4️⃣ *Proactive GST/ITR Deadline Reminders* (Zero manual client follow-ups)\n\n🎁 We are offering a *Free 3-Day Live Pilot* with zero upfront setup cost for *${name}*.\n\nReply *YES* if you'd like to see a custom live demo!\n\nWarm regards,\n${sender}\nWebCore Studios`;
    } else if (isHospital) {
      return `Namaste Team *${name}*! 🏥\n\nI am Satish from *WebCore Studios*. We deliver full-stack hospital digitization & AI reception suites in ${city}:\n\n1️⃣ *Modern Hospital Web Portal & Android App* (Multi-specialty doctor schedule)\n2️⃣ *24/7 WhatsApp AI OPD Reception* (Auto token issue & bed inquiries)\n3️⃣ *Automated Lab Report Delivery on WhatsApp* (PDF dispatch to patients)\n4️⃣ *Google Maps Top #1 Healthcare Ranking* (5-star reviews engine)\n\n🎁 We offer a *Free 3-Day Live Pilot* for *${name}*.\n\nReply *YES* if you'd like to see a custom live demo!\n\nWarm regards,\n${sender}\nWebCore Studios`;
    } else if (isSalon) {
      return `Hello Team *${name}*! ✂️\n\nI am Satish from *WebCore Studios*. We provide complete technology and AI booking solutions for luxury salons in ${city}:\n\n1️⃣ *Modern Salon Web App & Android App* (Interactive style gallery & rates)\n2️⃣ *24/7 WhatsApp AI Appointment Booking* (Stylist slot allocation)\n3️⃣ *Automated 3-Week Re-engagement Campaigns* (Boosts repeat client visits)\n4️⃣ *Google Maps Top #1 Ranking & 5-Star Reviews Engine*\n\n🎁 We offer a *Free 3-Day Live Pilot* for *${name}*.\n\nReply *YES* to see a live demo!\n\nWarm regards,\n${sender}\nWebCore Studios`;
    } else {
      return `Namaste Dr. / Team *${name}*! 🩺\n\nI am Satish from *WebCore Studios*. We provide complete modern technology solutions for healthcare centers in ${city}:\n\n1️⃣ *Modern Responsive Website* (Ultra-fast Next.js)\n2️⃣ *Native Android App* (Play Store ready patient portal)\n3️⃣ *24/7 AI WhatsApp Assistant* (Auto OPD & Booking tokens)\n4️⃣ *Google Maps SEO* (Top Local Rankings & 5-Star Reviews)\n\n🎁 We are offering a *Free 3-Day Live Pilot* with zero upfront setup cost for *${name}*.\n\nReply *YES* if you'd like to see a custom live demo!\n\nWarm regards,\n${sender}\nWebCore Studios`;
    }
  };

  // Lockscreen Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 selection:bg-indigo-500 selection:text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-1.5">
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider border border-indigo-500/20">
              WebCore Studios
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white mt-2">Private Lead Hunter</h1>
            <p className="text-xs text-slate-400">
              Enter your Master Admin Passcode to access the automated client acquisition suite.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="••••••••••••"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className={`w-full px-4 py-3 bg-slate-800/80 border ${
                  passcodeError ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl text-center text-sm font-semibold tracking-widest text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                autoFocus
              />
              {passcodeError && (
                <p className="text-xs text-rose-400 font-medium mt-2 text-center">
                  Access Denied: Invalid Master Admin Passcode.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Outreach Suite</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const sentCount = leads.filter((l) => l.status === 'sent').length;
  const pendingCount = leads.filter((l) => l.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-black tracking-tight text-white">WebCore Studios</span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-500/20">
                PRO LEAD HUNTER
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Web Apps • Android Apps • 24/7 WhatsApp AI • Local SEO
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('hunter')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'hunter'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Lead Hunter & Scraper</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('chats');
              fetchConversations();
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'chats'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live WhatsApp Chats</span>
            {chatThreads.length > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-full">
                {chatThreads.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              sessionStorage.removeItem('webcore_admin_auth');
              setIsAuthenticated(false);
            }}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition"
          >
            Lock Screen
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'chats' ? (
          /* Live WhatsApp Chat Window (Outreach & Replies Inbox) */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[750px]">
            {/* Left Sidebar: Threads List */}
            <div className="w-full md:w-80 lg:w-96 border-r border-slate-800 flex flex-col bg-slate-900/60">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span>Outreach Conversations</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {chatThreads.length} active threads
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchConversations}
                  disabled={isLoadingChats}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                  title="Refresh Chats"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingChats ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Search Filter */}
              <div className="p-3 border-b border-slate-800/80">
                <input
                  type="text"
                  placeholder="Search by name or number..."
                  value={chatSearchFilter}
                  onChange={(e) => setChatSearchFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Threads List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
                {chatThreads.filter(
                  (t) =>
                    t.business_name.toLowerCase().includes(chatSearchFilter.toLowerCase()) ||
                    t.phone.includes(chatSearchFilter)
                ).length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    {isLoadingChats ? 'Loading conversations...' : 'No conversations recorded yet. Send a pitch from Lead Hunter to start chatting!'}
                  </div>
                ) : (
                  chatThreads
                    .filter(
                      (t) =>
                        t.business_name.toLowerCase().includes(chatSearchFilter.toLowerCase()) ||
                        t.phone.includes(chatSearchFilter)
                    )
                    .map((thread) => {
                      const isSelected = selectedThreadPhone === thread.phone;
                      return (
                        <button
                          key={thread.phone}
                          type="button"
                          onClick={() => setSelectedThreadPhone(thread.phone)}
                          className={`w-full text-left p-3.5 transition flex items-start space-x-3 ${
                            isSelected ? 'bg-indigo-600/10 border-l-4 border-indigo-500' : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-purple-700 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md">
                            {thread.business_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-white truncate">{thread.business_name}</h4>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(thread.last_timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">{thread.phone}</div>
                            <p
                              className={`text-[11px] truncate mt-1 ${
                                thread.last_sender === 'client' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                              }`}
                            >
                              {thread.last_sender === 'client' ? '📥 ' : '📤 '}
                              {thread.last_message || 'No messages'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            {/* Right Main Chat Window */}
            <div className="flex-1 flex flex-col bg-slate-950">
              {chatThreads.find((t) => t.phone.replace(/\D/g, '') === (selectedThreadPhone || '').replace(/\D/g, '')) ? (
                (() => {
                  const currentThread = chatThreads.find(
                    (t) => t.phone.replace(/\D/g, '') === (selectedThreadPhone || '').replace(/\D/g, '')
                  )!;
                  return (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 flex-wrap gap-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow">
                            {currentThread.business_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                              <span>{currentThread.business_name}</span>
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                                WhatsApp Live
                              </span>
                            </h3>
                            <div className="text-xs font-mono text-slate-400 flex items-center space-x-2 mt-0.5">
                              <span>{currentThread.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentThread.business_name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1 transition"
                          >
                            <MapPin className="w-3 h-3 text-indigo-400" />
                            <span>Maps</span>
                          </a>
                          <a
                            href={`https://wa.me/${currentThread.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-bold rounded-xl border border-emerald-500/30 flex items-center space-x-1 transition shadow-sm"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp Web</span>
                          </a>
                        </div>
                      </div>

                      {/* Chat Messages Body */}
                      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-950/70">
                        {currentThread.messages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                              <Bot className="w-7 h-7" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-white">No Messages with {currentThread.business_name} Yet</h4>
                              <p className="text-xs text-slate-400 max-w-sm mt-1">
                                Send a personalized AI pitch or type a custom WhatsApp message in the input bar below.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const leadObj: ScrapedLead = leads.find((l) => l.phone_number === currentThread.phone) || {
                                  id: `lead_${Date.now()}`,
                                  business_name: currentThread.business_name,
                                  category: currentThread.category || 'clinic',
                                  city: city || 'Thane',
                                  phone_number: currentThread.phone,
                                  rating: 5.0,
                                  reviews_count: 50,
                                  address: `${city || 'Thane'}`,
                                  has_website: false,
                                  maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentThread.business_name)}`,
                                  status: 'pending',
                                };
                                sendSinglePitch(leadObj);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>⚡ Send AI Pitch Package to this Lead</span>
                            </button>
                          </div>
                        ) : (
                          currentThread.messages.map((msg: any) => {
                            const isClient = msg.sender === 'client';
                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
                              >
                                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mb-1 px-1 font-mono">
                                  <span>{isClient ? currentThread.business_name : 'Satish (WebCore)'}</span>
                                  <span>•</span>
                                  <span>
                                    {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <div
                                  className={`max-w-lg rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                                    isClient
                                      ? 'bg-slate-800 text-white border border-slate-700 rounded-tl-sm shadow-md'
                                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-lg shadow-indigo-600/20'
                                  }`}
                                >
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Quick Chat Reply Bar */}
                      <form
                        onSubmit={sendManualChatReply}
                        className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/60 flex items-center space-x-3"
                      >
                        <input
                          type="text"
                          placeholder={`Type a WhatsApp reply to ${currentThread.business_name}...`}
                          value={chatReplyText}
                          onChange={(e) => setChatReplyText(e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="submit"
                          disabled={isSendingReply || !chatReplyText.trim()}
                          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center space-x-1.5"
                        >
                          {isSendingReply ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Send WhatsApp</span>
                        </button>
                      </form>
                    </>
                  );
                })()
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-500">
                  <MessageSquare className="w-12 h-12 text-slate-700" />
                  <p className="text-sm font-semibold text-slate-400">Select a conversation from the left</p>
                  <p className="text-xs max-w-sm">
                    View complete message thread of what pitches you sent and what the business replied.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Lead Hunter Workspace */
          <>
            {/* Top Metric Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
                <span className="text-xs font-medium text-slate-400">Total Leads Found</span>
                <div className="text-2xl font-bold text-white mt-1">{leads.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
                <span className="text-xs font-medium text-emerald-400">Pitches Sent</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{sentCount}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
                <span className="text-xs font-medium text-amber-400">Pending Outreach</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
                <span className="text-xs font-medium text-indigo-400">Selected for Dispatch</span>
                <div className="text-2xl font-bold text-indigo-400 mt-1">{selectedLeadIds.length}</div>
              </div>
            </div>

            {/* Section 1: Search & Scrape Engine */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
              <div className="flex items-center space-x-2.5">
                <Search className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">1. Search & Extract Local Businesses</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Target Industry / Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="clinic">🩺 Clinics & Polyclinics</option>
                    <option value="hospital">🏥 Hospitals & Multi-Specialty</option>
                    <option value="ca_firm">📊 CA & Tax Accounting Firms</option>
                    <option value="salon">✂️ Salons & Luxury Spas</option>
                    <option value="real_estate">🏢 Real Estate & Builders</option>
                    <option value="tuition">🎓 Coaching & Academies</option>
                    <option value="restaurant">🍽️ Restaurants & Cafes</option>
                    <option value="retail">🛍️ Boutiques & Retail Stores</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">City / Target Location</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Thane, Mumbai, Pune"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Search Volume</label>
                  <select
                    value={leadVolume}
                    onChange={(e) => setLeadVolume(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={25}>⚡ 25 High-Intent Leads</option>
                    <option value={50}>🔥 50 Commercial Leads</option>
                    <option value={100}>🚀 100 High-Volume Leads</option>
                    <option value={150}>👑 150 Maximum Territory Scan</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-3.5 py-2.5 rounded-xl transition">
                    <input
                      type="checkbox"
                      checked={noWebsiteOnly}
                      onChange={(e) => setNoWebsiteOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-rose-400">🔥 No Website Only (High-Conversion)</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <input
                  type="text"
                  value={customSearchQuery}
                  onChange={(e) => setCustomSearchQuery(e.target.value)}
                  placeholder="Or custom search query: e.g. 'Pediatrician clinics in Naupada Thane' or 'Dentists in Majiwada'..."
                  className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  type="button"
                  onClick={handleSearchLeads}
                  disabled={isSearching}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>{isSearching ? 'Extracting Directory...' : 'Extract High-Value Leads'}</span>
                </button>
              </div>
            </div>

            {/* Section 2: Multi-Service Pitch Arsenal */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">2. High-Converting Pitch Arsenal</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setPitchType('all_in_one')}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                    pitchType === 'all_in_one'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs">All-In-One Tech Suite</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Website + Android App + WhatsApp AI OPD Bot + Local SEO.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPitchType('whatsapp_ai')}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                    pitchType === 'whatsapp_ai'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs">24/7 WhatsApp AI Bot</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Automated appointment booking & voice OPD reception.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPitchType('web_mobile')}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                    pitchType === 'web_mobile'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-xs">Web & Android Apps</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Next.js custom web app + Play Store native mobile app.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPitchType('local_seo')}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                    pitchType === 'local_seo'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs">Google Maps & SEO</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Top #1 ranking on Google Maps & 5-star review engine.
                  </p>
                </button>
              </div>

              {/* Pitch Customizer & Preview Controls */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-bold text-slate-300">Sender Identity:</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPreviewSampleLead(
                        leads.length > 0
                          ? leads[0]
                          : {
                              id: 'sample_preview',
                              business_name: 'Dr. Godbole Polyclinic',
                              category: selectedCategory,
                              city: city || 'Thane',
                              phone_number: '+919820123456',
                              rating: 4.8,
                              reviews_count: 140,
                              address: 'Naupada, Thane West',
                              has_website: false,
                              maps_url: 'https://maps.google.com',
                              status: 'pending',
                            }
                      );
                      setShowPitchPreview(!showPitchPreview);
                    }}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                  >
                    <span>{showPitchPreview ? 'Hide Message Preview' : '👁️ View Live Message Pitch Preview'}</span>
                  </button>
                </div>

                {showPitchPreview && previewSampleLead && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                      <span>Preview Message to: <strong className="text-white">{previewSampleLead.business_name}</strong></span>
                      <span className="font-mono text-emerald-400">WhatsApp Cloud API</span>
                    </div>
                    <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {generatePitchText(previewSampleLead, pitchType, customMessage, senderName)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Smart Paced Campaign Dispatcher */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-2.5">
                  <Send className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">3. Paced Automated Campaign</h2>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleAddMyNumberTestLead}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center space-x-1.5 transition"
                    title="Add Satish's phone number as a test lead"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>+ Add My Number (+918779841346)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPasteModal(true)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center space-x-1.5 transition"
                  >
                    <span>📥 Paste Phone List</span>
                  </button>
                </div>
              </div>

              {/* Progress & Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Safe Pacing Interval:</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="range"
                      min={10}
                      max={60}
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(Number(e.target.value))}
                      disabled={isCampaignRunning}
                      className="w-32 accent-indigo-500"
                    />
                    <span className="text-xs font-bold text-white font-mono">{delaySeconds}s / msg</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-medium">Campaign Progress:</div>
                  <div className="text-xs font-bold text-white mt-1">
                    {campaignCurrentIdx} of {campaignTotal} sent
                    {countdown > 0 && (
                      <span className="text-emerald-400 font-mono ml-2">
                        (Next in {countdown}s...)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 sm:justify-end">
                  {!isCampaignRunning ? (
                    <button
                      type="button"
                      onClick={handleStartPacedCampaign}
                      disabled={selectedLeadIds.length === 0}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Campaign ({selectedLeadIds.length} Leads)</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handlePauseResumeCampaign}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1"
                      >
                        {isCampaignPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        <span>{isCampaignPaused ? 'Resume' : 'Pause'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleStopCampaign}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1"
                      >
                        <Square className="w-3.5 h-3.5" />
                        <span>Stop</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Extracted Leads Table & Live Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Leads Table (2 Cols) */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-sm text-white">Target Businesses Queue ({leads.length})</h3>
                  </div>

                  {leads.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        {selectedLeadIds.length === leads.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  )}
                </div>

                {leads.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl space-y-2">
                    <Search className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs font-semibold">No leads extracted yet.</p>
                    <p className="text-[11px]">Select an industry & city above, or click "Add My Number" to test live.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-1 w-8"></th>
                          <th className="py-2.5">Business & Location</th>
                          <th className="py-2.5">Phone Number</th>
                          <th className="py-2.5">Rating</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {leads.map((lead) => {
                          const isSelected = selectedLeadIds.includes(lead.id);
                          return (
                            <tr
                              key={lead.id}
                              className={`hover:bg-slate-800/40 transition ${
                                isSelected ? 'bg-indigo-600/5' : ''
                              }`}
                            >
                              <td className="py-3 px-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleLeadSelection(lead.id)}
                                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="py-3">
                                <div className="font-bold text-white flex items-center space-x-1.5">
                                  <a
                                    href={lead.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.business_name + ' ' + lead.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-indigo-400 underline-offset-2 hover:underline flex items-center space-x-1 font-bold group"
                                    title="Click to view and verify on Google Maps"
                                  >
                                    <span>{lead.business_name}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                                  </a>
                                </div>
                                <div className="text-[10px] text-slate-400 font-normal">{lead.address}</div>
                                <div className="mt-1 flex items-center space-x-2">
                                  {!lead.has_website ? (
                                    <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[9px] font-bold">
                                      🔥 No Website (Hot Prospect)
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[9px] font-medium">
                                      🌐 Has Website
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 font-mono text-slate-300 whitespace-nowrap">
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="text"
                                    value={lead.phone_number}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setLeads((prev) =>
                                        prev.map((l) => (l.id === lead.id ? { ...l, phone_number: val } : l))
                                      );
                                    }}
                                    placeholder="+91..."
                                    className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-white w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                    title="Click to edit or paste verified mobile number"
                                  />
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <a
                                    href={lead.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.business_name + ' ' + lead.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-0.5"
                                  >
                                    <MapPin className="w-2.5 h-2.5" />
                                    <span>Maps</span>
                                  </a>
                                  <span className="text-slate-600">•</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const clean = lead.phone_number;
                                      setChatThreads((prev) => {
                                        const cleanDigits = clean.replace(/\D/g, '');
                                        const exists = prev.find((t) => t.phone.replace(/\D/g, '') === cleanDigits);
                                        if (!exists) {
                                          const newT = {
                                            phone: clean,
                                            business_name: lead.business_name,
                                            category: lead.category,
                                            last_message: lead.status === 'sent' ? 'Pitch Sent' : 'Ready to chat',
                                            last_sender: 'bot',
                                            last_timestamp: new Date().toISOString(),
                                            messages: [],
                                          };
                                          const updated = [newT, ...prev];
                                          if (typeof window !== 'undefined') {
                                            localStorage.setItem('webcore_lead_threads', JSON.stringify(updated));
                                          }
                                          return updated;
                                        }
                                        return prev;
                                      });
                                      setSelectedThreadPhone(clean);
                                      setActiveTab('chats');
                                    }}
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-0.5"
                                    title="Open full WhatsApp chat window for this lead"
                                  >
                                    <MessageSquare className="w-2.5 h-2.5" />
                                    <span>Open Live Chat</span>
                                  </button>
                                </div>
                              </td>
                              <td className="py-3">
                                <span className="inline-flex items-center space-x-1 text-amber-400 font-bold">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span>{lead.rating}</span>
                                  <span className="text-[10px] text-slate-500 font-normal">({lead.reviews_count})</span>
                                </span>
                              </td>
                              <td className="py-3">
                                {lead.status === 'sent' ? (
                                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold text-[10px] rounded-full border border-emerald-500/20 flex items-center space-x-1 w-max">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Sent</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 font-semibold text-[10px] rounded-full border border-slate-700 w-max">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => sendSinglePitch(lead)}
                                  className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold text-[10px] rounded-lg border border-indigo-500/30 transition flex items-center space-x-1 ml-auto"
                                >
                                  <Send className="w-2.5 h-2.5" />
                                  <span>Send Pitch</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Real-Time Logs Console (1 Col) */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3 shadow-xl flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Live Outreach Console</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCampaignLogs([])}
                    className="text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex-1 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 font-mono text-[11px] space-y-2 overflow-y-auto max-h-[420px]">
                  {campaignLogs.length === 0 ? (
                    <div className="text-slate-600 text-center py-6">Ready. No outreach events yet.</div>
                  ) : (
                    campaignLogs.map((log, idx) => (
                      <div key={idx} className="leading-tight">
                        <span className="text-slate-500">[{log.time}]</span>{' '}
                        <span
                          className={
                            log.type === 'success'
                              ? 'text-emerald-400'
                              : log.type === 'warn'
                              ? 'text-amber-400'
                              : 'text-slate-300'
                          }
                        >
                          {log.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Paste / Bulk Import Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>📥 Paste External Phone List / CSV</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Paste phone numbers (one per line, e.g. from Excel, Justdial, or Google Maps). You can optionally prefix with business name: <code className="text-indigo-300">Dr. Sharma Clinic, 9820123456</code>.
            </p>

            <textarea
              rows={8}
              placeholder={`Mehta CA & Associates, 9822123456\nDr. Amit Dental Clinic, 9890987654\n9850112233\n9881445566`}
              value={pastedNumbersText}
              onChange={(e) => setPastedNumbersText(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportPastedNumbers}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                Import Contacts into Outreach Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
