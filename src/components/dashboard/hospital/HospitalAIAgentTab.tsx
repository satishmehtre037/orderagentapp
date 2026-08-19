'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Phone,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Zap,
  RefreshCw,
  User,
} from 'lucide-react';
import { HospitalPatient } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';

interface HospitalAIAgentTabProps {
  businessId?: string;
  businessName?: string;
}

interface ChatMessage {
  id: string;
  sender: 'patient' | 'ai';
  text: string;
  timestamp: string;
  toolsUsed?: string[];
}

export default function HospitalAIAgentTab({
  businessId,
  businessName,
}: HospitalAIAgentTabProps) {
  const [patients, setPatients] = useState<HospitalPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<HospitalPatient | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello! I am the 24/7 Medical AI Assistant for ${businessName || 'MediCare Hospital'}. How may I assist you today? You can book an appointment, check doctor timings, or inquire about your diagnostic lab reports.`,
      timestamp: '10:00 AM',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch(`/api/hospital/patients?${businessId ? `business_id=${businessId}` : ''}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.patients) && data.patients.length > 0) {
          setPatients(data.patients);
          setSelectedPatient(data.patients[0]);
        }
      } catch (e) {
        console.error('Error fetching patients for AI Simulator:', e);
      }
    };
    fetchPatients();
  }, [businessId]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const patientMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'patient',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, patientMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    // AI Medical Engine logic
    setTimeout(() => {
      let aiReply = '';
      const tools: string[] = [];
      const lower = text.toLowerCase();

      if (lower.includes('chest pain') || lower.includes('breathing') || lower.includes('emergency') || lower.includes('severe bleeding')) {
        tools.push('Escalate To Front Desk (Emergency Handoff)');
        aiReply = `🚨 *MEDICAL EMERGENCY ALERT*\n\nPlease visit the nearest Hospital Emergency Room immediately or call emergency services at 108 / 112.\n\nOur casualty desk has been notified of your emergency. Do not wait for an online appointment.`;
      } else if (lower.includes('book') || lower.includes('appointment') || lower.includes('consultation')) {
        tools.push('Get Hospital And Doctor Info', "Check Doctor's Booked Slots", 'Book Appointment');
        aiReply = `✅ *Consultation Scheduled!*\n\nI have booked your appointment with *Dr. Rajesh Gupta* (Cardiology):\n📅 *Slot:* Tomorrow at 11:00 AM\n🎟️ *Token Number:* #OPD-14\n📍 *Location:* 2nd Floor OPD Wing, Room 204\n\nA confirmation token with preparation instructions has been dispatched to your registered WhatsApp number.`;
      } else if (lower.includes('report') || lower.includes('cbc') || lower.includes('lab') || lower.includes('mri')) {
        tools.push('Check My Report Status');
        aiReply = `📄 *Lab Report Status Update*\n\nYour *Complete Blood Count (CBC)* report from yesterday is verified and ready.\n\n💡 *Clinical Summary:* Mild iron deficiency indicated. Attending doctor has reviewed the parameters.\n📥 *Download PDF:* https://medicare.hospital/reports/REP-8492.pdf`;
      } else if (lower.includes('doctor') || lower.includes('timing') || lower.includes('fee') || lower.includes('pediatrics') || lower.includes('ortho')) {
        tools.push('Get Hospital And Doctor Info');
        aiReply = `👨‍⚕️ *Department & Doctor Information*\n\n• *Cardiology:* Dr. Rajesh Gupta (Mon–Fri, 9:00 AM – 2:00 PM | Fee: ₹800)\n• *Pediatrics:* Dr. Ananya Iyer (Mon, Wed, Fri, Sat, 10:00 AM – 4:00 PM | Fee: ₹600)\n• *Orthopedics:* Dr. Vikramaditya Rao (Tue, Thu, Sat, 11:00 AM – 6:00 PM | Fee: ₹900)\n• *General Medicine:* Dr. Priya Sharma (Daily, 9:00 AM – 5:00 PM | Fee: ₹500)\n\nWould you like me to book a slot for you?`;
      } else if (lower.includes('reschedule') || lower.includes('change date') || lower.includes('cancel')) {
        tools.push('Reschedule Appointment');
        aiReply = `🔄 *Appointment Rescheduled*\n\nYour appointment with *Dr. Priya Sharma* has been moved to *Friday at 2:00 PM*.\n\nYour revised token number is *#OPD-08*. Updated confirmation sent to your WhatsApp.`;
      } else {
        aiReply = `Thank you for contacting MediCare Hospital. I can assist you with booking OPD consultations, checking diagnostic lab results, rescheduling visits, or providing doctor schedules. How may I help you?`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolsUsed: tools.length > 0 ? tools : undefined,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Bot className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>24/7 Medical AI WhatsApp Simulator</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Test Gemini-powered clinical triage, live slot bookings, lab report status checks, and emergency escalation guardrails
          </p>
        </div>

        {/* Patient Switcher */}
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-slate-400" />
          <select
            value={selectedPatient?.id || ''}
            onChange={(e) => {
              const p = patients.find((pat) => pat.id === e.target.value);
              if (p) setSelectedPatient(p);
            }}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.phone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-slate-400 font-semibold flex items-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-teal-500 mr-1" />
          Quick Test:
        </span>
        {[
          'Book consultation with Dr. Rajesh Gupta (Cardiology) for tomorrow 11:00 AM',
          'What are the OPD timings and consultation fee for Pediatrics?',
          'Is my Complete Blood Count (CBC) lab report ready?',
          'I have severe chest pain and breathing difficulty',
          'I need to reschedule my consultation to Friday 2:00 PM',
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            className="px-3 py-1 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-500/30 rounded-xl whitespace-nowrap transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* WhatsApp Chat Simulator Window */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-[520px]">
        {/* Chat Window Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center font-bold text-sm">
              🏥
            </div>
            <div>
              <div className="text-xs font-bold flex items-center space-x-1.5">
                <span>{businessName || 'MediCare Hospital'} AI Assistant</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[10px] text-slate-300">
                Testing as: {selectedPatient?.name || 'Patient'} ({selectedPatient?.phone || '+91 98765 43210'})
              </div>
            </div>
          </div>
          <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-400/30">
            Gemini 2.0 Flash • 8 Tools Active
          </span>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'patient' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'patient'
                    ? 'bg-teal-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {msg.toolsUsed && (
                  <div className="mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 flex flex-wrap gap-1">
                    {msg.toolsUsed.map((tool, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                      >
                        ⚡ Tool: {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs p-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium ml-1">
                AI Agent is analyzing clinical schedule & tools...
              </span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Type a clinical query or booking instruction..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="p-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
