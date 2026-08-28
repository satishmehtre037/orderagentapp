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
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
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
import { ScrapedLead } from '../../services/leadSourceService';
import {
  buildPersonalizedPitch,
  renderCustomMessage,
  type PitchType,
} from '../../services/pitchTemplates';

/** Consent values that let the campaign worker actually send. */
const SENDABLE_CONSENT = ['opt_in', 'legitimate_b2b'];

const CONSENT_LABELS: Record<string, { text: string; className: string; title: string }> = {
  opt_in: {
    text: '✅ Opt-in',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    title: 'This contact asked to be messaged. Sending is allowed.',
  },
  legitimate_b2b: {
    text: '✅ B2B basis',
    className: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
    title: 'A documented existing business relationship is on file. Sending is allowed.',
  },
  opted_out: {
    text: '🚫 Opted out',
    className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    title: 'This person replied STOP. They are suppressed permanently and cannot be re-enabled.',
  },
  none: {
    text: '⚠️ No consent',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    title:
      'Sourced from a public listing, which is not consent. The campaign worker will skip this lead until a lawful basis is recorded.',
  },
};


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

  // Sourcing / consent state. Leads arrive with consent_status 'none' and the
  // campaign worker refuses to send to them, so the operator needs to see that
  // and be able to record a basis before dispatch.
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isRecordingConsent, setIsRecordingConsent] = useState(false);
  const [consentBasis, setConsentBasis] = useState<'opt_in' | 'legitimate_b2b'>('legitimate_b2b');
  const [consentNote, setConsentNote] = useState('');
  const [pasteConsentNote, setPasteConsentNote] = useState('');
  const [pasteConsentBasis, setPasteConsentBasis] = useState<'opt_in' | 'legitimate_b2b'>('opt_in');

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
  const [campaignSent, setCampaignSent] = useState(0);
  const [campaignFailed, setCampaignFailed] = useState(0);
  const [campaignSkipped, setCampaignSkipped] = useState(0);

  // 5. Live WhatsApp Chat Inbox State
  const [chatThreads, setChatThreads] = useState<any[]>([]);
  const [selectedThreadPhone, setSelectedThreadPhone] = useState<string | null>(null);
  const [chatReplyText, setChatReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [chatSearchFilter, setChatSearchFilter] = useState('');

  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat body to bottom when messages update
  useEffect(() => {
    if (activeTab === 'chats') {
      const timer = setTimeout(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [chatThreads, selectedThreadPhone, activeTab]);

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
    setSearchError(null);
    setSearchNotice(null);
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

      // 503 means Google Places is not configured. The route deliberately does
      // not fall back to generating leads, so say so plainly rather than showing
      // an empty table that looks like "no businesses found".
      if (res.status === 503) {
        setSearchError(data.error || 'Lead sourcing is not configured on this server.');
        addLog('⛔ Lead sourcing unavailable — see the banner above.', 'warn');
        return;
      }

      if (!res.ok || !data.success) {
        setSearchError(data.error || `Search failed (HTTP ${res.status}).`);
        addLog(`Search failed: ${data.error || res.status}`, 'warn');
        return;
      }

      setLeads(data.leads || []);
      // Nothing is pre-selected any more. Everything Places returns has
      // consent_status 'none', so auto-selecting the whole page made it one
      // click to queue a campaign that the worker would skip in its entirety.
      setSelectedLeadIds([]);
      setSearchNotice(data.notice || null);

      const s = data.skipped || {};
      addLog(
        `🔎 Places query "${data.query}" — scanned ${data.scanned ?? '?'}, kept ${data.count ?? 0}.`,
        (data.count ?? 0) > 0 ? 'success' : 'warn'
      );
      const skippedParts = [
        s.noPhone ? `${s.noPhone} no phone` : '',
        s.invalidPhone ? `${s.invalidPhone} not a mobile` : '',
        s.closed ? `${s.closed} permanently closed` : '',
        s.hasWebsite ? `${s.hasWebsite} filtered out by the website rule` : '',
      ].filter(Boolean);
      if (skippedParts.length > 0) {
        addLog(`↪️ Skipped: ${skippedParts.join(', ')}.`, 'info');
      }
      if ((data.count ?? 0) > 0) {
        addLog('⚠️ These leads have no consent recorded yet — record a basis before starting a campaign.', 'warn');
      }
    } catch (err: any) {
      setSearchError(err.message);
      addLog(`Error searching leads: ${err.message}`, 'warn');
    } finally {
      setIsSearching(false);
    }
  };

  /** Reloads persisted leads so consent changes and opt-outs survive a refresh. */
  const reloadSavedLeads = async () => {
    try {
      const res = await fetch(`/api/admin/lead-hunter/search?limit=200&_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.leads) && data.leads.length > 0) {
        setLeads(data.leads);
      }
    } catch {
      /* the table just stays as it is */
    }
  };

  useEffect(() => {
    if (isAuthenticated) reloadSavedLeads();
  }, [isAuthenticated]);

  /**
   * Records a lawful basis for the selected leads.
   *
   * Leads sourced from Google Places sit at consent_status 'none' and the
   * campaign worker skips them. This is the only route past that gate, and the
   * note is mandatory: it is what makes the decision auditable later.
   */
  const handleRecordConsent = async () => {
    const targets = leads.filter(
      (l) => selectedLeadIds.includes(l.id) && l.consent_status !== 'opted_out' && !String(l.id).startsWith('lead_')
    );

    if (targets.length === 0) {
      alert(
        'Select at least one saved lead first. Leads that are opted out cannot be re-enabled, and unsaved rows have no record to attach consent to.'
      );
      return;
    }
    if (consentNote.trim().length < 10) {
      alert('Write at least 10 characters describing the basis — where the opt-in came from, or what the relationship is.');
      return;
    }

    setIsRecordingConsent(true);
    try {
      const res = await fetch('/api/admin/lead-hunter/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: targets.map((l) => l.id),
          consentStatus: consentBasis,
          consentNote: consentNote.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(`Could not record consent: ${data.error}`);
        addLog(`⚠️ Consent not recorded: ${data.error}`, 'warn');
        return;
      }

      const updatedIds = new Set((data.leads || []).map((l: any) => l.id));
      setLeads((prev) =>
        prev.map((l) => (updatedIds.has(l.id) ? { ...l, consent_status: consentBasis } : l))
      );
      addLog(
        `🛡️ Recorded "${consentBasis}" for ${data.updated} lead(s)${
          data.skippedOptedOut ? ` (${data.skippedOptedOut} left suppressed — they opted out)` : ''
        }.`,
        'success'
      );
      setConsentNote('');
    } catch (err: any) {
      alert(`Consent request failed: ${err.message}`);
    } finally {
      setIsRecordingConsent(false);
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

  /**
   * Imports pasted numbers through the manual sourcing endpoint.
   *
   * This used to build ScrapedLead objects in the browser with `rating: 4.5,
   * reviews_count: 50` and an id like `lead_pasted_3_1699…`. Two problems: the
   * operator was shown a 4.5-star rating for a business nobody had rated, and
   * the row existed only in React state — so it had no consent record and the
   * campaign worker skipped every one of them. The server now saves them with
   * the basis the operator states here.
   */
  const handleImportPastedNumbers = async () => {
    if (!pastedNumbersText.trim()) return;

    if (pasteConsentNote.trim().length < 10) {
      alert(
        'A consent note is required (at least 10 characters). Record where these numbers came from and why they may be contacted — that note is the audit trail.'
      );
      return;
    }

    const entries: Array<{ phone: string; businessName?: string; category?: string; city?: string }> = [];

    pastedNumbersText.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const parts = trimmed.split(/,|\t/);
      if (parts.length >= 2) {
        entries.push({
          businessName: parts[0].trim(),
          phone: parts[1].trim(),
          category: selectedCategory,
          city: city || 'Thane',
        });
      } else {
        entries.push({ phone: trimmed, category: selectedCategory, city: city || 'Thane' });
      }
    });

    if (entries.length === 0) {
      alert('No lines to import.');
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/lead-hunter/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'manual',
          entries,
          consentStatus: pasteConsentBasis,
          consentNote: pasteConsentNote.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(`Import failed: ${data.error}`);
        addLog(`⚠️ Manual import failed: ${data.error}`, 'warn');
        return;
      }

      const saved: ScrapedLead[] = data.leads || [];
      setLeads((prev) => [...saved, ...prev.filter((p) => !saved.some((s) => s.id === p.id))]);
      setSelectedLeadIds((prev) => [...saved.map((l) => l.id), ...prev]);

      addLog(`📥 Imported ${saved.length} lead(s) with basis "${pasteConsentBasis}".`, 'success');
      if (data.rejected?.length > 0) {
        addLog(
          `↪️ ${data.rejected.length} rejected as not valid Indian mobile numbers: ${data.rejected
            .slice(0, 5)
            .map((r: any) => r.phone)
            .join(', ')}${data.rejected.length > 5 ? '…' : ''}`,
          'warn'
        );
      }

      setShowPasteModal(false);
      setPastedNumbersText('');
      setPasteConsentNote('');
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Adds the operator's own number as a test lead — via the manual endpoint, so
   * it gets a real row and a real consent record. It used to be built in the
   * browser with `rating: 5.0, reviews_count: 120`, neither of which was real,
   * and with no database row it could never pass the send gate.
   */
  const handleAddMyNumberTestLead = async () => {
    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/lead-hunter/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'manual',
          entries: [
            {
              phone: '+918779841346',
              businessName: 'Satish Mehtre (WebCore test number)',
              category: selectedCategory,
              city: city || 'Thane',
            },
          ],
          consentStatus: 'opt_in',
          consentNote: 'Operator’s own number, added from the Lead Hunter console for live delivery testing.',
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        addLog(`⚠️ Could not add the test lead: ${data.error}`, 'warn');
        return;
      }

      const saved: ScrapedLead[] = data.leads || [];
      setLeads((prev) => [...saved, ...prev.filter((p) => !saved.some((s) => s.id === p.id))]);
      setSelectedLeadIds((prev) => [...saved.map((l) => l.id), ...prev]);
      addLog('📱 Test lead saved with an opt-in basis. "Send Pitch" will now go through.', 'success');
    } catch (err: any) {
      addLog(`⚠️ Could not add the test lead: ${err.message}`, 'warn');
    } finally {
      setIsImporting(false);
    }
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
      const res = await fetch(`/api/admin/lead-hunter/conversations?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      const data = await res.json();
      const serverThreads: any[] = data.success && data.threads ? data.threads : [];

      // Sanitize messages to eliminate any legacy reasoning artifacts
      const sanitizedServer = serverThreads.map((t: any) => {
        const clean = (t.phone || '').replace(/\D/g, '');
        let name = t.business_name;
        if (!name || name.startsWith('Lead (')) {
          if (clean === '918779841346' || clean === '8779841346') {
            name = 'Satish Mehtre (WebCore Demo Lead)';
          } else {
            const matched = leads.find((l) => (l.phone_number || '').replace(/\D/g, '') === clean);
            if (matched) name = matched.business_name;
          }
        }
        return {
          ...t,
          business_name: name || t.business_name || `Lead (+${clean})`,
          messages: (t.messages || []).filter((m: any) => !m.text.includes('**Reasoning') && !m.text.includes('<think>')),
        };
      });

      // Merge server threads and local threads by clean phone (Server takes priority)
      const map: Record<string, any> = {};
      [...sanitizedServer, ...localSaved].forEach((t) => {
        const clean = (t.phone || '').replace(/\D/g, '');
        if (!clean) return;
        let threadName = t.business_name;
        if (!threadName || threadName.startsWith('Lead (')) {
          if (clean === '918779841346' || clean === '8779841346') {
            threadName = 'Satish Mehtre (WebCore Demo Lead)';
          } else {
            const matched = leads.find((l) => (l.phone_number || '').replace(/\D/g, '') === clean);
            if (matched) threadName = matched.business_name;
          }
        }
        if (!map[clean]) {
          map[clean] = { ...t, business_name: threadName, messages: [...(t.messages || [])] };
        } else {
          const existing = map[clean];
          const allMsgs = [...(existing.messages || []), ...(t.messages || [])];
          const seenIds = new Set<string>();
          const deduped: any[] = [];
          allMsgs.forEach((m) => {
            if (m.text?.includes('**Reasoning') || m.text?.includes('<think>')) return;
            if (m.id && seenIds.has(m.id)) return;
            if (m.id) seenIds.add(m.id);
            const last = deduped[deduped.length - 1];
            if (
              last &&
              last.sender === m.sender &&
              (last.text || '').trim() === (m.text || '').trim() &&
              Math.abs(new Date(m.timestamp).getTime() - new Date(last.timestamp).getTime()) < 4000
            ) {
              return;
            }
            deduped.push(m);
          });
          deduped.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          const lastM = deduped[deduped.length - 1];
          map[clean] = {
            ...existing,
            ...t,
            messages: deduped,
            last_message: lastM ? lastM.text : (t.last_message || existing.last_message),
            last_sender: lastM ? lastM.sender : (t.last_sender || existing.last_sender),
            last_timestamp: lastM ? lastM.timestamp : (t.last_timestamp || existing.last_timestamp),
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
      setSelectedThreadPhone((prev) => {
        if (prev && merged.some((t: any) => t.phone.replace(/\D/g, '') === prev.replace(/\D/g, ''))) {
          return prev;
        }
        return merged[0]?.phone || null;
      });
    } catch (err: any) {
      if (localSaved.length > 0) {
        setChatThreads(localSaved);
        setSelectedThreadPhone((prev) => prev || localSaved[0]?.phone || null);
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
      } else if (res.status === 403) {
        // The consent gate lives on the server and it refused. Say why, and say
        // what would change it, rather than reporting a generic failure.
        addLog(
          `🛡️ Not sent to ${lead.business_name}: ${data.error} ` +
            (data.reason === 'opted_out'
              ? 'This number is permanently suppressed.'
              : 'Select the lead in the table and record a lawful basis first.'),
          'warn'
        );
      } else {
        addLog(`⚠️ Failed delivering to ${lead.business_name}: ${data.error}`, 'warn');
      }
    } catch (err: any) {
      addLog(`❌ Network error pitching ${lead.business_name}: ${err.message}`, 'warn');
    }
  };

  // Synchronize 24/7 Cloud Background Campaign Status
  const syncServerCampaign = async () => {
    try {
      const res = await fetch(`/api/admin/lead-hunter/campaign?_t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && data.campaign) {
        const camp = data.campaign;
        setCampaignSent(camp.sent || 0);
        setCampaignFailed(camp.failed || 0);
        setCampaignSkipped(camp.skipped || 0);
        if (camp.status === 'running' || camp.status === 'paused') {
          setIsCampaignRunning(true);
          setIsCampaignPaused(camp.status === 'paused');
          setCampaignTotal(camp.total);
          setCampaignCurrentIdx(camp.currentIndex);
          setCountdown(camp.countdown || 0);
          if (camp.logs && camp.logs.length > 0) {
            setCampaignLogs(camp.logs);
          }
        } else if (camp.status === 'completed' || camp.status === 'cancelled') {
          if (isCampaignRunning) {
            setIsCampaignRunning(false);
            setIsCampaignPaused(false);
            setCountdown(0);
            // Consent may have flipped to opted_out mid-campaign if anyone
            // replied STOP, so re-read the lead rows rather than keep stale ones.
            reloadSavedLeads();
          }
        }
      }
    } catch (e) {}
  };

  // Poll server campaign status every 2.5s
  useEffect(() => {
    if (isAuthenticated) {
      syncServerCampaign();
      const interval = setInterval(syncServerCampaign, 2500);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isCampaignRunning]);

  // 24/7 Paced Server Campaign Dispatcher
  const handleStartPacedCampaign = async () => {
    const selected = leads.filter((l) => selectedLeadIds.includes(l.id) && l.status === 'pending');

    const missingQueue = selected.filter((l) => (l.phone_number || '').replace(/\D/g, '').length < 10);
    const withPhone = selected.filter((l) => (l.phone_number || '').replace(/\D/g, '').length >= 10);

    // The worker checks consent itself and skips anything without a basis, so
    // sending these would just produce a campaign of skipped rows. Report it
    // here instead, where the operator can act on it.
    const noConsent = withPhone.filter((l) => !SENDABLE_CONSENT.includes(String(l.consent_status)));
    const validQueue = withPhone.filter((l) => SENDABLE_CONSENT.includes(String(l.consent_status)));

    if (missingQueue.length > 0) {
      addLog(`ℹ️ ${missingQueue.length} lead(s) have no usable mobile number and were left out.`, 'warn');
    }
    if (noConsent.length > 0) {
      addLog(
        `🛡️ ${noConsent.length} lead(s) have no recorded lawful basis and were left out. Select them and use "Record consent" first.`,
        'warn'
      );
    }

    if (validQueue.length === 0) {
      alert(
        noConsent.length > 0
          ? `None of the ${selected.length} selected leads can be contacted yet: ${noConsent.length} have no recorded consent. Select them and use "Record consent basis" to log an opt-in or a documented B2B relationship first.`
          : 'No pending leads with a valid Indian mobile number are selected.'
      );
      return;
    }

    if (
      !window.confirm(
        `Queue ${validQueue.length} WhatsApp pitch(es) at one every ${delaySeconds}s?\n\n` +
          `Each recipient has a recorded lawful basis and every message carries a "Reply STOP" footer.`
      )
    ) {
      return;
    }

    setIsCampaignRunning(true);
    setIsCampaignPaused(false);
    setCampaignTotal(validQueue.length);
    setCampaignCurrentIdx(0);
    addLog(`🚀 Queueing ${validQueue.length} lead(s) on the server at ${delaySeconds}s pacing...`, 'info');

    try {
      const res = await fetch('/api/admin/lead-hunter/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: validQueue,
          pitchType,
          customMessage: pitchType === 'custom' ? customMessage : undefined,
          senderName,
          delaySeconds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addLog(
          `☁️ ${data.queued} queued on the server${
            data.rejected ? `, ${data.rejected} rejected as invalid or duplicate` : ''
          }. Safe to close this browser — the worker keeps sending.`,
          'success'
        );
        syncServerCampaign();
      } else {
        alert(`Failed to start the campaign: ${data.error}`);
        addLog(`⚠️ Campaign not started: ${data.error}`, 'warn');
        setIsCampaignRunning(false);
      }
    } catch (err: any) {
      alert(`Campaign request error: ${err.message}`);
      setIsCampaignRunning(false);
    }
  };

  const handlePauseResumeCampaign = async () => {
    const targetAction = isCampaignPaused ? 'resume' : 'pause';
    try {
      await fetch('/api/admin/lead-hunter/campaign/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: targetAction }),
      });
      setIsCampaignPaused(!isCampaignPaused);
      addLog(targetAction === 'pause' ? '⏸️ Background campaign paused on server.' : '▶️ Background campaign resumed on server.', 'info');
      syncServerCampaign();
    } catch (e) {}
  };

  const handleStopCampaign = async () => {
    try {
      await fetch('/api/admin/lead-hunter/campaign/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      setIsCampaignRunning(false);
      setIsCampaignPaused(false);
      setCountdown(0);
      addLog(`🛑 Background campaign cancelled on server.`, 'warn');
      syncServerCampaign();
    } catch (e) {}
  };

  /**
   * Preview / optimistic-bubble text.
   *
   * This used to be a fourth verbatim copy of the pitch copy (the other three
   * were campaignService, send-pitch and pitchTemplates). It had already
   * drifted: this one omitted the opt-out footer, so the preview did not match
   * the message the server actually sent. It now calls the same builder.
   */
  const generatePitchText = (lead: ScrapedLead, type: string, custom: string, sender: string) => {
    const businessName = lead.business_name;
    const leadCity = lead.city || 'your city';
    const category = lead.category || 'business';

    if (type === 'custom') {
      if (!custom.trim()) return '(Write your custom message above to see the preview.)';
      return renderCustomMessage(custom, { businessName, city: leadCity, category, senderName: sender });
    }

    return buildPersonalizedPitch(businessName, category, leadCity, type as PitchType, sender);
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

  // Consent breakdown of the current selection. The campaign worker skips
  // anything without a lawful basis, so the operator needs these two numbers in
  // front of them before pressing Start — otherwise a "50 lead" campaign quietly
  // becomes 50 skips.
  const selectedLeads = leads.filter((l) => selectedLeadIds.includes(l.id));
  const sendableSelected = selectedLeads.filter((l) => SENDABLE_CONSENT.includes(String(l.consent_status)));
  const blockedSelected = selectedLeads.filter(
    (l) => !SENDABLE_CONSENT.includes(String(l.consent_status)) && l.consent_status !== 'opted_out'
  );
  const optedOutSelected = selectedLeads.filter((l) => l.consent_status === 'opted_out');
  const noConsentTotal = leads.filter((l) => String(l.consent_status || 'none') === 'none').length;

  const getThreadDisplayName = (thread: any) => {
    if (!thread) return 'Prospect';
    const clean = (thread.phone || '').replace(/\D/g, '');
    if (clean === '918779841346' || clean === '8779841346') {
      return 'Satish Mehtre (WebCore Demo Lead)';
    }
    const matchedLead = leads.find((l) => (l.phone_number || '').replace(/\D/g, '') === clean);
    if (matchedLead && matchedLead.business_name && !matchedLead.business_name.startsWith('External Contact')) {
      return matchedLead.business_name;
    }
    if (thread.business_name && !thread.business_name.startsWith('Lead (')) {
      return thread.business_name;
    }
    for (const m of (thread.messages || [])) {
      const pitchMatch = (m.text || '').match(/Namaste (?:Dr\.\s*\/\s*Team|Dr\.|Team)?\s*\*([^*]+)\*/i);
      if (pitchMatch && pitchMatch[1]) return pitchMatch[1].trim();
    }
    return thread.business_name || `Lead (+${clean})`;
  };

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
                    getThreadDisplayName(t).toLowerCase().includes(chatSearchFilter.toLowerCase()) ||
                    t.phone.includes(chatSearchFilter)
                ).length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    {isLoadingChats ? 'Loading conversations...' : 'No conversations recorded yet. Send a pitch from Lead Hunter to start chatting!'}
                  </div>
                ) : (
                  chatThreads
                    .filter(
                      (t) =>
                        getThreadDisplayName(t).toLowerCase().includes(chatSearchFilter.toLowerCase()) ||
                        t.phone.includes(chatSearchFilter)
                    )
                    .map((thread) => {
                      const isSelected = selectedThreadPhone === thread.phone;
                      const name = getThreadDisplayName(thread);
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
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-white truncate">{name}</h4>
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
                  const currentDisplayName = getThreadDisplayName(currentThread);
                  return (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 flex-wrap gap-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow">
                            {currentDisplayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                              <span>{currentDisplayName}</span>
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
                          <button
                            type="button"
                            onClick={() => fetchConversations()}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1 transition"
                            title="Force sync latest messages from database"
                          >
                            <RefreshCw className={`w-3 h-3 ${isLoadingChats ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
                            <span>Sync</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                localStorage.removeItem('webcore_lead_threads');
                              }
                              fetchConversations();
                            }}
                            className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-xl border border-rose-800/40 flex items-center space-x-1 transition"
                            title="Purge local cache and reload clean server messages"
                          >
                            <span>Clear Cache</span>
                          </button>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentDisplayName)}`}
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
                              <h4 className="font-bold text-sm text-white">No Messages with {currentDisplayName} Yet</h4>
                              <p className="text-xs text-slate-400 max-w-sm mt-1">
                                Send a personalized AI pitch or type a custom WhatsApp message in the input bar below.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const leadObj: ScrapedLead = leads.find((l) => l.phone_number === currentThread.phone) || {
                                  // No id, so the server resolves this thread to its real
                                  // lead row by phone number and reads that row's consent
                                  // status. The old literal made one up (`lead_${Date.now()}`,
                                  // `rating: 5.0, reviews_count: 50`), which matched nothing
                                  // and showed the operator numbers nobody had recorded.
                                  id: '',
                                  business_name: currentDisplayName,
                                  category: currentThread.category || 'clinic',
                                  city: city || 'Thane',
                                  phone_number: currentThread.phone,
                                  rating: null,
                                  reviews_count: null,
                                  address: '',
                                  has_website: false,
                                  maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentDisplayName)}`,
                                  status: 'pending',
                                  source: 'inbound',
                                  consent_status: 'none',
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
                          <>
                            {currentThread.messages.map((msg: any) => {
                              const isClient = msg.sender === 'client';
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
                                >
                                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mb-1 px-1 font-mono">
                                    <span>{isClient ? currentDisplayName : 'Satish (WebCore)'}</span>
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
                            })}
                            <div ref={chatMessagesEndRef} />
                          </>
                        )}
                      </div>

                      {/* Quick Chat Reply Bar */}
                      <form
                        onSubmit={sendManualChatReply}
                        className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/60 flex items-center space-x-3"
                      >
                        <input
                          type="text"
                          placeholder={`Type a WhatsApp reply to ${currentDisplayName}...`}
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
                  <span>{isSearching ? 'Searching Google Places...' : 'Find Real Businesses'}</span>
                </button>
              </div>

              {/* Sourcing state. A 503 has to look like a 503 — it used to be
                  rendered as an empty table, which reads as "no businesses found". */}
              {searchError && (
                <div className="flex items-start space-x-2.5 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-300">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="text-[11px] leading-relaxed">
                    <strong className="block text-rose-200 text-xs mb-0.5">Lead sourcing unavailable</strong>
                    {searchError}
                  </div>
                </div>
              )}

              {searchNotice && !searchError && (
                <div className="flex items-start space-x-2.5 p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-300">
                  <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="text-[11px] leading-relaxed">
                    <strong className="block text-amber-200 text-xs mb-0.5">Sourced, but not yet contactable</strong>
                    {searchNotice}
                  </div>
                </div>
              )}
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
                    {selectedCategory === 'restaurant'
                      ? 'Website + Android App + WhatsApp QR Ordering + 5-Star Reviews.'
                      : selectedCategory === 'ca_firm'
                      ? 'Firm Portal + Mobile App + WhatsApp Tax Assistant + GST Vault.'
                      : selectedCategory === 'salon'
                      ? 'Salon Website + Client App + WhatsApp AI Booking + Local SEO.'
                      : selectedCategory === 'real_estate'
                      ? 'Property Portal + Buyer App + WhatsApp AI Qualifier + Maps SEO.'
                      : selectedCategory === 'tuition'
                      ? 'Academy Portal + Student App + WhatsApp Admissions Bot + Local SEO.'
                      : selectedCategory === 'retail'
                      ? 'E-Commerce App + Mobile Catalog + WhatsApp Order Bot + Local SEO.'
                      : 'Modern Website + Mobile App + 24/7 AI WhatsApp Assistant + Local SEO.'}
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
                    {selectedCategory === 'restaurant'
                      ? 'Direct food ordering, QR menu & instant table reservations.'
                      : selectedCategory === 'ca_firm'
                      ? 'Auto-collects GST invoices & answers tax queries 24/7.'
                      : selectedCategory === 'salon'
                      ? 'Automated stylist booking & 3-week repeat client recall.'
                      : selectedCategory === 'real_estate'
                      ? 'Instant property brochures, price quotes & site visits.'
                      : selectedCategory === 'tuition'
                      ? 'Course inquiries, demo class booking & fee alerts.'
                      : selectedCategory === 'retail'
                      ? 'Product catalog browsing, order taking & VIP deals.'
                      : 'Automated client inquiries, 24/7 booking & instant support.'}
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
                              // Clearly labelled sample copy, not a business. The
                              // previous placeholder was a real-sounding clinic name
                              // with `rating: 4.8, reviews_count: 140` and a live-looking
                              // Mumbai mobile number, which read as a sourced lead.
                              id: 'sample_preview',
                              business_name: '[Sample Business Name]',
                              category: selectedCategory,
                              city: city || 'your city',
                              phone_number: '+91XXXXXXXXXX',
                              rating: null,
                              reviews_count: null,
                              address: 'Preview only — not a real listing',
                              has_website: false,
                              maps_url: '',
                              status: 'pending',
                              source: 'manual',
                              consent_status: 'none',
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
                <div className="flex items-center space-x-2.5 flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <Send className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-base font-bold text-white">3. Paced Automated Campaign</h2>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold flex items-center space-x-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>☁️ 24/7 Cloud Background Queue (Safe to Close Browser)</span>
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleAddMyNumberTestLead}
                    disabled={isImporting}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center space-x-1.5 transition disabled:opacity-50"
                    title="Save your own number as an opted-in test lead"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>+ Add My Number (+918779841346)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPasteModal(true)}
                    disabled={isImporting}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    <span>📥 Paste Phone List</span>
                  </button>
                </div>
              </div>

              {/* Progress & Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Safe Pacing Interval:</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        delaySeconds >= 40
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : delaySeconds >= 25
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {delaySeconds >= 40 ? '🟢 100% Safe (Recommended)' : delaySeconds >= 25 ? '🟡 Fast & Safe' : '⚡ Rapid'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <input
                      type="range"
                      min={10}
                      max={60}
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(Number(e.target.value))}
                      disabled={isCampaignRunning}
                      className="w-32 accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-white font-mono">{delaySeconds}s / msg</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-medium">Campaign Progress:</div>
                  <div className="text-xs font-bold text-white mt-1">
                    {campaignCurrentIdx} of {campaignTotal} processed
                    {countdown > 0 && (
                      <span className="text-emerald-400 font-mono ml-2">
                        (Next in {countdown}s...)
                      </span>
                    )}
                  </div>
                  {/* Sent / failed / skipped, straight from the server campaign row.
                      The panel used to say "N of M sent" for every processed target,
                      including the ones the worker refused to contact. */}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {campaignSent} sent
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {campaignFailed} failed
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      title="Refused by the consent gate — no lawful basis on file, or the contact replied STOP."
                    >
                      {campaignSkipped} skipped
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-stretch sm:items-end gap-2">
                  <div className="flex items-center space-x-2 sm:justify-end">
                    {!isCampaignRunning ? (
                      <button
                        type="button"
                        onClick={handleStartPacedCampaign}
                        disabled={sendableSelected.length === 0}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center space-x-1.5 disabled:opacity-50"
                        title={
                          sendableSelected.length === 0
                            ? 'Every selected lead is missing a recorded lawful basis. Record consent first.'
                            : `Queue ${sendableSelected.length} message(s) on the server`
                        }
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Campaign ({sendableSelected.length} contactable)</span>
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

                  {!isCampaignRunning && (blockedSelected.length > 0 || optedOutSelected.length > 0) && (
                    <p className="text-[10px] text-amber-400 font-semibold text-left sm:text-right leading-snug max-w-[16rem]">
                      {blockedSelected.length > 0 && <>{blockedSelected.length} selected lead(s) have no recorded basis and will be left out. </>}
                      {optedOutSelected.length > 0 && <>{optedOutSelected.length} opted out and can never be contacted.</>}
                    </p>
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
                    {noConsentTotal > 0 && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold">
                        {noConsentTotal} awaiting consent
                      </span>
                    )}
                  </div>

                  {leads.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={reloadSavedLeads}
                        className="text-xs text-slate-400 hover:text-slate-200 font-bold flex items-center space-x-1"
                        title="Re-read the saved leads, including any consent changes"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Refresh</span>
                      </button>
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

                {/* Consent recorder.
                    The send gate is enforced on the server, and until this existed
                    there was no way to satisfy it — every campaign skipped every
                    lead. Recording a basis is a deliberate, written act. */}
                {selectedLeadIds.length > 0 && (
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-xs font-bold text-white">
                        Record a lawful basis for {blockedSelected.length || sendableSelected.length} selected lead(s)
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Appearing in a public directory is not consent. State why you may message these numbers —
                      the note is stored against every lead and is what you would produce if a recipient complains
                      to TRAI. Leads that replied STOP stay suppressed and are never affected by this.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={consentBasis}
                        onChange={(e) => setConsentBasis(e.target.value as 'opt_in' | 'legitimate_b2b')}
                        className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[11px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="legitimate_b2b">Documented B2B relationship</option>
                        <option value="opt_in">Explicit opt-in</option>
                      </select>

                      <input
                        type="text"
                        value={consentNote}
                        onChange={(e) => setConsentNote(e.target.value)}
                        placeholder="Where did this basis come from? e.g. 'Signed enquiry form at Thane Traders Expo, 12 Aug 2026'"
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[11px] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />

                      <button
                        type="button"
                        onClick={handleRecordConsent}
                        disabled={isRecordingConsent || consentNote.trim().length < 10}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold rounded-xl transition disabled:opacity-40 whitespace-nowrap"
                        title={
                          consentNote.trim().length < 10
                            ? 'Write at least 10 characters describing the basis.'
                            : 'Record this basis against the selected leads'
                        }
                      >
                        {isRecordingConsent ? 'Recording...' : 'Record consent basis'}
                      </button>
                    </div>
                  </div>
                )}

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
