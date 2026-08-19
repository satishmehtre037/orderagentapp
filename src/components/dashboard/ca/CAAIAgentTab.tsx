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
  const [selectedClientProfile, setSelectedClientProfile] = useState('Mehta Textiles');
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'client',
      senderName: 'Ramesh Mehta',
      text: 'Namaste! Mujhe GSTR-3B ke baare mein poochna tha, kab tak bharna hai August ka?',
      meta: 'Ramesh Mehta • 10:24 AM',
    },
    {
      id: '2',
      sender: 'ai',
      senderName: 'AI Tax Assistant',
      text: '🙏 Namaste Ramesh ji! August 2026 ka GSTR-3B filing ki last date **20 August 2026** hai. Aapka GSTIN 23AABCM1234F1Z5 hai na? Main check kar raha hoon ki aapka data ready hai ya nahi…\n\n⚠️ Aapka Bank Statement abhi pending hai. Kripya jald se upload karein taaki hum time par file kar sakein.',
      meta: '🤖 AI Agent • 10:24 AM • Auto-replied',
    },
    {
      id: '3',
      sender: 'client',
      senderName: 'Ramesh Mehta',
      text: 'Haan wahi hai mera. Bank statement kahan bhejun?',
      meta: 'Ramesh Mehta • 10:26 AM',
    },
    {
      id: '4',
      sender: 'ai',
      senderName: 'AI Tax Assistant',
      text: 'Bilkul! Aap documents 3 aasan tarike se de sakte hain:\n\n📲 **WhatsApp:** Is number par hi PDF bhej dein\n📧 **Email:** docs@sharmaassociates.in\n🔗 **Secure Link:** https://client.portal/upload\n\nDocument receive hone par aapko instant confirmation aur verification report milega. Koi aur sawaal?',
      meta: '🤖 AI Agent • 10:26 AM • Auto-replied',
    },
    {
      id: '5',
      sender: 'client',
      senderName: 'Ramesh Mehta',
      text: 'Fees kitni hogi GSTR-3B ki?',
      meta: 'Ramesh Mehta • 10:28 AM',
    },
    {
      id: '6',
      sender: 'ai',
      senderName: 'AI Tax Assistant',
      text: 'Ramesh ji, standard monthly GSTR-3B + 1 package ₹2,500/month hai. Specific quotation ke liye main Senior CA Partner ko notify kar raha hoon. Woh aapko aaj dopahar tak call karenge. 🙏',
      meta: '🤖 AI Agent • 10:28 AM • Escalated to Senior CA',
      escalated: true,
    },
  ]);

  const FAQS = [
    {
      q: 'GSTR-3B ki deadline kab hai?',
      asks: '48 asks',
      reply: 'GSTR-3B monthly return har mahine ki 20 tarikh ko file hota hai (e.g. 20th August). Late filing par ₹50/day penalty aur 18% interest lagta hai.',
    },
    {
      q: 'ITR file karne ke liye kaun se documents chahiye?',
      asks: '41 asks',
      reply: 'Salaried individual ke liye Form 16, PAN, Aadhaar, Bank Statements aur Form 26AS/AIS chahiye hote hain.',
    },
    {
      q: 'GST registration ke liye fees kitni hai?',
      asks: '33 asks',
      reply: 'Naye GST registration ke liye professional fee ₹1,999 hai jisme ARN tracking aur GST certificate delivery included hai.',
    },
    {
      q: 'Pvt Ltd company kaise banate hain?',
      asks: '27 asks',
      reply: 'Pvt Ltd company incorporation MCA portal par SPICe+ form dwara hoti hai. PAN, Aadhaar, DSC aur Address proof zaroori hai. 7-10 working days me ho jati hai.',
    },
    {
      q: 'Late filing penalty kya hogi?',
      asks: '22 asks',
      reply: 'GST me late fee ₹50/din (Nil return me ₹20/din) hoti hai. Income Tax me Sec 234F ke tahat ₹1,000 ya ₹5,000 late fees lagti hai.',
    },
  ];

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputMsg;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'client',
      senderName: 'Client (WhatsApp)',
      text: query,
      meta: 'Client • Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMsg('');
    setIsTyping(true);

    setTimeout(() => {
      let aiResponse = `Main aapki query samajh gaya. Hamari AI system ne aapka requirement record kar liya hai. Senior CA team is par review kar rahi hai. 🙏`;

      const lower = query.toLowerCase();
      if (lower.includes('gst') || lower.includes('3b')) {
        aiResponse = `🙏 GST-3B return ki statutory due date har mahine ki **20 tarikh** hoti hai. Aapke sales & purchase bills upload hote hi return draft tayar ho jayega.`;
      } else if (lower.includes('itr') || lower.includes('form 16') || lower.includes('income tax')) {
        aiResponse = `📊 ITR filing ke liye aapka Form 16 aur Bank Statement required hai. Aap yahan direct PDF share kar sakte hain, hum turant verify karenge!`;
      } else if (lower.includes('roc') || lower.includes('company') || lower.includes('incorporat')) {
        aiResponse = `🏛️ Company Incorporation & ROC Annual Filings (AOC-4/MGT-7) ke liye hamare compliance experts 24/7 uplabdh hain.`;
      } else if (lower.includes('fee') || lower.includes('price') || lower.includes('cost')) {
        aiResponse = `💰 Hamari quotation automated generate hoti hai. Aapka requirement record kar liya gaya hai aur official estimate WhatsApp par bhej diya gaya hai.`;
      }

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        senderName: 'AI Tax Assistant',
        text: aiResponse,
        meta: '🤖 AI Agent • Just now • Auto-replied',
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
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
            Automatic 24/7 WhatsApp & Email query resolution engine. Reduces repetitive queries by 94%.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Chat Simulator (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col h-[560px] shadow-sm">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <span className="text-xl">💬</span>
              <div>
                <h3 className="text-xs font-bold text-white">Live WhatsApp Chat Simulator</h3>
                <p className="text-[11px] text-slate-400">Meta Cloud API v20.0 • 24/7 Active</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] text-emerald-400 font-bold">AI Active</span>
              <select
                value={selectedClientProfile}
                onChange={(e) => setSelectedClientProfile(e.target.value)}
                className="text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-1 focus:outline-none"
              >
                <option>Mehta Textiles</option>
                <option>Priya Sharma</option>
                <option>Gupta Hardware</option>
                <option>Satish (ROC & ITR)</option>
              </select>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3.5 no-scrollbar text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'client' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-line shadow-xs ${
                    m.sender === 'client'
                      ? 'bg-teal-600 text-white rounded-br-xs'
                      : m.escalated
                      ? 'bg-purple-950/70 border border-purple-800 text-purple-200 rounded-bl-xs'
                      : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">{m.meta}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-1.5 p-2 bg-slate-800/60 rounded-2xl w-16 border border-slate-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="pt-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Client ki taraf se message likhein (e.g. GST deadline kab hai?)..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 text-white placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={() => handleSendMessage()}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: AI Metrics & Top FAQs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 4 Mini Stat Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-bold font-mono text-teal-400">94%</div>
                <div className="text-[11px] text-slate-400">Auto-resolve rate</div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-bold font-mono text-emerald-400">18s</div>
                <div className="text-[11px] text-slate-400">Avg response time</div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-bold font-mono text-amber-400">247</div>
                <div className="text-[11px] text-slate-400">Queries this month</div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-bold font-mono text-purple-400">16</div>
                <div className="text-[11px] text-slate-400">Escalated to CA</div>
              </div>
            </div>
          </div>

          {/* Top FAQs Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
              <span className="text-base">❓</span>
              <h3 className="text-xs font-bold text-white">Top Frequently Asked Questions</h3>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSendMessage(faq.q)}
                  className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-800/40 p-2 rounded-xl cursor-pointer transition"
                >
                  <div className="text-slate-300 font-medium">{faq.q}</div>
                  <span className="text-[10px] text-teal-400 font-bold bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded-full shrink-0">
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
