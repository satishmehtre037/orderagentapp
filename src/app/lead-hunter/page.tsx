'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Sparkles,
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  MapPin,
  Star,
  Phone,
  Layers,
  Code2,
  Smartphone,
  Globe,
  TrendingUp,
  RefreshCw,
  Trash2,
  Play,
  Pause,
  Square,
  Copy,
  ExternalLink,
  MessageSquare,
  Bot,
  Zap,
} from 'lucide-react';
import { ScrapedLead } from '../api/admin/lead-hunter/search/route';

export default function LeadHunterPage() {
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
          city: city.trim(),
          count: leadVolume,
          noWebsiteOnly,
          customQuery: customSearchQuery.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.leads) {
        setLeads(data.leads);
        setSelectedLeadIds(data.leads.map((l: ScrapedLead) => l.id));
        setPreviewSampleLead(data.leads[0] || null);
        addLog(`Found ${data.leads.length} verified ${selectedCategory} leads in ${city} ${noWebsiteOnly ? '(Without Website 🔥)' : ''}`, 'success');
      }
    } catch (err: any) {
      addLog(`Search error: ${err.message}`, 'warn');
    } finally {
      setIsSearching(false);
    }
  };

  // Quick Import Pasted Numbers
  const handleImportPastedNumbers = () => {
    if (!pastedNumbersText.trim()) return;
    const lines = pastedNumbersText.split('\n');
    const imported: ScrapedLead[] = [];

    lines.forEach((line, idx) => {
      const clean = line.trim();
      if (!clean) return;
      // Extract phone digits
      const digits = clean.replace(/\D/g, '');
      if (digits.length >= 10) {
        const phone = digits.length === 10 ? `+91${digits}` : `+${digits}`;
        const name = clean.includes(',') ? clean.split(',')[0].trim() : `Business Contact (${digits.slice(-4)})`;
        const addr = `${city || 'Local Area'} Directory Contact`;
        imported.push({
          id: `lead_pasted_${Date.now()}_${idx}`,
          business_name: name,
          category: selectedCategory,
          city: city || 'Local',
          phone_number: phone,
          rating: 4.5,
          reviews_count: 50,
          address: addr,
          has_website: false,
          maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + (city || 'India'))}`,
          status: 'pending',
        });
      }
    });

    if (imported.length > 0) {
      setLeads((prev) => [...imported, ...prev]);
      setSelectedLeadIds((prev) => [...imported.map((l) => l.id), ...prev]);
      addLog(`📥 Imported ${imported.length} custom contact numbers.`, 'success');
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

  // Add Log Entry
  const addLog = (text: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setCampaignLogs((prev) => [{ time, text, type }, ...prev.slice(0, 49)]);
  };

  // Dispatch Single Pitch
  const sendSinglePitch = async (lead: ScrapedLead) => {
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
        addLog(`✅ WhatsApp pitch sent to ${lead.business_name}!`, 'success');
      } else {
        addLog(`❌ Failed for ${lead.business_name}: ${data.error}`, 'warn');
      }
    } catch (err: any) {
      addLog(`❌ Exception for ${lead.business_name}: ${err.message}`, 'warn');
    }
  };

  // Smart Paced Batch Campaign Loop
  const startPacedCampaign = async () => {
    const targetLeads = leads.filter((l) => selectedLeadIds.includes(l.id));
    if (targetLeads.length === 0) {
      alert('Please select at least 1 lead to start outreach.');
      return;
    }

    setIsCampaignRunning(true);
    setIsCampaignPaused(false);
    isRunningRef.current = true;
    isPausedRef.current = false;
    setCampaignTotal(targetLeads.length);
    setCampaignCurrentIdx(0);

    addLog(`🚀 Starting Smart-Paced Outreach to ${targetLeads.length} leads (Pacing: ${delaySeconds}s delay)`, 'info');

    for (let i = 0; i < targetLeads.length; i++) {
      if (!isRunningRef.current) {
        addLog(`🛑 Outreach campaign stopped by user.`, 'warn');
        break;
      }

      // Check pause
      while (isPausedRef.current && isRunningRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!isRunningRef.current) break;

      const currentLead = targetLeads[i];
      setCampaignCurrentIdx(i + 1);

      await sendSinglePitch(currentLead);

      // Delay countdown between messages (except last one)
      if (i < targetLeads.length - 1 && isRunningRef.current) {
        for (let cd = delaySeconds; cd > 0; cd--) {
          if (!isRunningRef.current) break;
          while (isPausedRef.current && isRunningRef.current) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          setCountdown(cd);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        setCountdown(0);
      }
    }

    setIsCampaignRunning(false);
    isRunningRef.current = false;
    addLog(`🎉 Outreach campaign completed!`, 'success');
  };

  const stopCampaign = () => {
    isRunningRef.current = false;
    isPausedRef.current = false;
    setIsCampaignRunning(false);
    setIsCampaignPaused(false);
    setCountdown(0);
  };

  const togglePause = () => {
    isPausedRef.current = !isPausedRef.current;
    setIsCampaignPaused(isPausedRef.current);
    addLog(isPausedRef.current ? `⏸️ Campaign paused.` : `▶️ Campaign resumed.`, 'info');
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
                placeholder="Enter Passcode (e.g., webcore2026)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className={`w-full px-4 py-3 bg-slate-800/80 border ${
                  passcodeError ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl text-center text-sm font-semibold tracking-widest text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                autoFocus
              />
              {passcodeError && (
                <p className="text-xs text-rose-400 font-medium mt-2">
                  Incorrect passcode. (Default: <code className="text-white">webcore2026</code>)
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
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
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
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Target City / Area</label>
              <input
                type="text"
                placeholder="e.g. Thane, Pune, Mumbai, Bangalore"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Extract Volume</label>
              <select
                value={leadVolume}
                onChange={(e) => setLeadVolume(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={25}>⚡ 25 High-Intent Leads</option>
                <option value={50}>🚀 50 Leads (Daily Campaign)</option>
                <option value={100}>🔥 100 Bulk Leads</option>
                <option value={150}>💎 150 Mega Batch</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Custom Query (Optional)</label>
              <input
                type="text"
                placeholder="e.g. CA firms near Naupada / Panchpakhadi"
                value={customSearchQuery}
                onChange={(e) => setCustomSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <label className="mt-2 flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noWebsiteOnly}
                  onChange={(e) => setNoWebsiteOnly(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500"
                />
                <span className="text-[11px] font-bold text-rose-400">🔥 No Website Only (High-Conversion Leads)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleAddMyNumberTestLead}
                className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs rounded-xl border border-emerald-500/30 transition flex items-center space-x-1.5"
              >
                <span>📱 Add My Number (+918779841346) as Test Lead</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
              >
                <span>📥 Paste / Upload List</span>
              </button>
            </div>

            <button
              onClick={handleSearchLeads}
              disabled={isSearching}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
              <span>{isSearching ? `Extracting ${leadVolume} Leads...` : `Search & Extract ${leadVolume} Leads`}</span>
            </button>
          </div>
        </div>

        {/* Section 2: Multi-Service Pitch Arsenal */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">2. WebCore Studios Service Pitch Offering</h2>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Sender Signature:</span>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-medium"
              />
            </div>
          </div>

          {/* Pitch Package Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setPitchType('all_in_one')}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                pitchType === 'all_in_one'
                  ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/40 text-white'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">All-In-One Tech Suite</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Web App + Android App + WhatsApp AI + Google SEO
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPitchType('whatsapp_ai')}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                pitchType === 'whatsapp_ai'
                  ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/40 text-white'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold">WhatsApp AI Bot</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                24/7 AI Reception, OPD Tokens & Online Booking
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPitchType('web_mobile')}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                pitchType === 'web_mobile'
                  ? 'bg-pink-600/20 border-pink-500 ring-2 ring-pink-500/40 text-white'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-bold">Web & Android Apps</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Fast Modern Website & Play Store Ready App
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPitchType('local_seo')}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                pitchType === 'local_seo'
                  ? 'bg-emerald-600/20 border-emerald-500 ring-2 ring-emerald-500/40 text-white'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Local SEO & Reviews</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Google Maps Top 3 Ranking & 5-Star Reviews
              </p>
            </button>
          </div>
        </div>

        {/* Section 3: Smart-Paced Campaign Dispatcher */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>3. Smart-Paced Campaign Dispatcher</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Dispatches 1 personalized WhatsApp pitch every {delaySeconds}s to protect your WhatsApp number from spam filters.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400">Delay:</span>
                <input
                  type="number"
                  min="20"
                  max="120"
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value) || 35)}
                  className="w-12 px-1 text-center bg-slate-900 border border-slate-700 rounded text-xs font-bold text-white"
                />
                <span className="text-xs text-slate-400">sec</span>
              </div>

              {!isCampaignRunning ? (
                <button
                  type="button"
                  onClick={startPacedCampaign}
                  disabled={leads.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Campaign ({selectedLeadIds.length})</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={togglePause}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>{isCampaignPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCampaign}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {isCampaignRunning && (
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-indigo-400">
                  Sending {campaignCurrentIdx} of {campaignTotal} leads...
                </span>
                {countdown > 0 && (
                  <span className="text-amber-400 animate-pulse">
                    ⏳ Next lead in {countdown}s...
                  </span>
                )}
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${(campaignCurrentIdx / (campaignTotal || 1)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Leads Table & Real-Time Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table (2 Cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Extracted Local Leads ({leads.length})</span>
              </h3>

              {leads.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedLeadIds(leads.map((l) => l.id))}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => setSelectedLeadIds([])}
                    className="text-[11px] text-slate-400 hover:text-slate-300 underline"
                  >
                    Deselect All
                  </button>
                </div>
              )}
            </div>

            {leads.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800/80 space-y-2">
                <Search className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">No leads extracted yet.</p>
                <p className="text-[11px] text-slate-500">
                  Select a category above (e.g. Clinics in Pune) and click &quot;Search & Extract Leads&quot;.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold">
                      <th className="pb-3 pr-2 w-8">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.length === leads.length && leads.length > 0}
                          onChange={(e) =>
                            setSelectedLeadIds(e.target.checked ? leads.map((l) => l.id) : [])
                          }
                          className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="pb-3">Business Name</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Rating</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {leads.map((lead) => {
                      const isSelected = selectedLeadIds.includes(lead.id);
                      return (
                        <tr key={lead.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 pr-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLeadIds([...selectedLeadIds, lead.id]);
                                } else {
                                  setSelectedLeadIds(selectedLeadIds.filter((id) => id !== lead.id));
                                }
                              }}
                              className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-3 font-semibold text-white">
                            <div className="flex items-center space-x-1.5">
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
                            <div>{lead.phone_number}</div>
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
                              <a
                                href={`https://wa.me/${lead.phone_number.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-0.5"
                              >
                                <MessageSquare className="w-2.5 h-2.5" />
                                <span>Chat</span>
                              </a>
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
