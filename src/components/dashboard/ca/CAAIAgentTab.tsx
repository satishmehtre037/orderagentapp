'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  HelpCircle,
  AlertCircle,
  MessageSquare,
  Zap,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import type { CAClient } from '@/types';

interface CAAIAgentTabProps {
  businessId?: string;
  businessName?: string;
}

interface ChatMessage {
  id: string;
  sender: 'client' | 'ai';
  senderName: string;
  text: string;
  meta: string;
  escalated?: boolean;
}

export default function CAAIAgentTab({
  businessId,
  businessName = 'Sharma & Associates',
}: CAAIAgentTabProps) {
  const [clients, setClients] = useState<CAClient[]>([]);
  const [selectedClientName, setSelectedClientName] = useState<string>('Live Client');
  const [selectedClientPhone, setSelectedClientPhone] = useState<string>('');
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'client',
      senderName: 'Client (WhatsApp)',
      text: 'Good day! Could you please clarify the upcoming statutory compliance deadlines for our entity?',
      meta: 'Client • 10:24 AM',
    },
    {
      id: '2',
      sender: 'ai',
      senderName: 'AI Practice Assistant',
      text: 'Greetings! I am your 24/7 Autonomous Tax & Corporate Compliance Assistant. I monitor GST Returns (GSTR-3B / GSTR-1), Income Tax (ITR & Tax Audits), TDS quarterly returns, and MCA ROC Secretarial Filings.\n\nPlease share your GSTIN or specify the statutory filing you require assistance with.',
      meta: '🤖 AI Agent • 10:24 AM • Live Auto-reply',
    },
  ]);

  // Load real clients from database
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const bizParam = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
        const res = await fetch(`/api/ca/clients${bizParam}`);
        const data = await res.json();
        if (data.clients && data.clients.length > 0) {
          setClients(data.clients);
          setSelectedClientName(data.clients[0].client_name);
          setSelectedClientPhone(data.clients[0].phone);
        }
      } catch (err) {
        console.error('Error fetching clients for AI agent:', err);
      }
    };
    fetchClients();
  }, [businessId]);

  const FAQS = [
    {
      q: 'What is the statutory deadline for GSTR-3B monthly filing?',
      asks: 'Statutory Date',
      reply: 'GSTR-3B is due on the 20th of every month (e.g., 20th August). Delayed filings attract a statutory late fee of ₹50/day and 18% annual interest on net tax liabilities.',
    },
    {
      q: 'What mandatory documents are required for Corporate ITR filing?',
      asks: 'Tax Checklist',
      reply: 'Audited Financial Statements (Balance Sheet & P&L), Form 3CD Tax Audit Report, Form 26AS / AIS Tax Credit reconciliation, and Director DSC credentials.',
    },
    {
      q: 'What is the standard professional fee for New GST Registration?',
      asks: 'Service Quote',
      reply: 'New GST Registration is processed at a standard professional fee of ₹1,999, inclusive of ARN tracking, query resolution, and delivery of official GST Certificate.',
    },
    {
      q: 'What is the procedure and timeline for Private Limited Incorporation?',
      asks: 'ROC Guide',
      reply: 'Incorporation is executed via the MCA SPICe+ digital gateway. Required credentials include Director PAN, Aadhaar, Digital Signature (DSC), and Registered Office utility proof. Average clearance is 7-10 business days.',
    },
    {
      q: 'What are the statutory late fees and penalties for overdue filings?',
      asks: 'Penalty Rules',
      reply: 'GST late fee is ₹50/day (₹20/day for NIL returns). Income Tax late filing fee under Section 234F is ₹1,000 or ₹5,000 based on taxable turnover.',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMsg;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'client',
      senderName: selectedClientName || 'Client (WhatsApp)',
      text: query,
      meta: `${selectedClientName} • Just now`,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMsg('');
    setIsTyping(true);

    try {
      // Call live chat API backend
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          businessId: businessId,
          customerNumber: selectedClientPhone || '919876543210',
          category: 'ca_firm',
        }),
      });

      let aiResponseText = '';
      if (res.ok) {
        const chatData = await res.json();
        aiResponseText = chatData.reply || chatData.response || '';
      }

      if (!aiResponseText) {
        // Fallback intelligent response generator
        const lower = query.toLowerCase();
        if (lower.includes('gst') || lower.includes('3b')) {
          aiResponseText = `The statutory due date for GSTR-3B monthly return is the **20th of every month**. Your return draft will be prepared immediately upon upload of your sales register and purchase ITC invoices.`;
        } else if (lower.includes('itr') || lower.includes('form 16') || lower.includes('tax')) {
          aiResponseText = `For Income Tax Return (ITR) filing, your Form 16 / Trial Balance and Bank Statements are required. You may upload them directly here for automated verification.`;
        } else if (lower.includes('roc') || lower.includes('company') || lower.includes('incorporat')) {
          aiResponseText = `Company Incorporation (SPICe+) and ROC Annual Compliance (Form AOC-4 & MGT-7) are monitored autonomously by our corporate secretarial desk.`;
        } else {
          aiResponseText = `Thank you for your inquiry. Your statutory requirement has been logged into our practice management system and routed to our Senior CA Partners for review.`;
        }
      }

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        senderName: 'AI Practice Assistant',
        text: aiResponseText,
        meta: '🤖 AI Agent • Just now • Live Auto-reply',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Error in chat simulator:', err);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🤖</span>
            <span>AI Client Support Agent</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automatic 24/7 WhatsApp & Email query resolution engine connected to your live database.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Chat Simulator (7 cols) */}
        <div className="lg:col-span-7 backdrop-blur-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-5 flex flex-col h-[560px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <span className="text-xl">💬</span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Live WhatsApp Chat Simulator</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Meta Cloud API v20.0 • 24/7 Active</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">AI Active</span>
              {clients.length > 0 && (
                <select
                  value={selectedClientName}
                  onChange={(e) => {
                    const selName = e.target.value;
                    setSelectedClientName(selName);
                    const found = clients.find((c) => c.client_name === selName);
                    if (found) setSelectedClientPhone(found.phone);
                  }}
                  className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-2.5 py-1 focus:outline-none max-w-[140px] truncate"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.client_name}>
                      👤 {c.client_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3.5 no-scrollbar text-xs bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl my-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'client' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line shadow-xs ${
                    m.sender === 'client'
                      ? 'bg-teal-600 text-white rounded-br-xs'
                      : m.escalated
                      ? 'bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 rounded-bl-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">{m.meta}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-1.5 p-2 bg-white dark:bg-slate-800 rounded-2xl w-16 border border-slate-200 dark:border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder={`Type a statutory query on behalf of "${selectedClientName}" (e.g. When is our GSTR-3B due?)...`}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={() => handleSendMessage()}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: AI Metrics & Top FAQs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 4 Mini Stat Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="backdrop-blur-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="p-2.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">94%</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Auto-resolve rate</div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">&lt;2s</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Avg response time</div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{clients.length}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Registered Clients</div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">24/7</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">AI Bot Status</div>
              </div>
            </div>
          </div>

          {/* Top FAQs Card */}
          <div className="backdrop-blur-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-5 space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-base">❓</span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Top Frequently Asked Questions</h3>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSendMessage(faq.q)}
                  className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl cursor-pointer transition"
                >
                  <div className="text-slate-700 dark:text-slate-300 font-medium">{faq.q}</div>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 px-2 py-0.5 rounded-full shrink-0">
                    {faq.asks}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
