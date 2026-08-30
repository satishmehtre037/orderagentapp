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
  RefreshCw,
} from 'lucide-react';
import type { CAClient } from '@/types';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
} from '@/components/ui';

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
    'What documents are needed for GST-3B monthly filing?',
    'What is the last date for corporate ITR-6 with tax audit?',
    'How do I calculate advance tax liability for Q3?',
    'We received a Section 143(1) intimation. How do we proceed?',
    'What are the ROC penalties for delayed MGT-7 filing?',
  ];

  const handleSend = async (queryText?: string) => {
    const msg = queryText || inputMsg;
    if (!msg.trim()) return;

    const newClientMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'client',
      senderName: selectedClientName,
      text: msg,
      meta: `Client (${selectedClientPhone || 'WhatsApp'}) • Just now`,
    };

    setMessages((prev) => [...prev, newClientMsg]);
    if (!queryText) setInputMsg('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ca/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          client_name: selectedClientName,
          phone: selectedClientPhone || '919876543210',
          message: msg,
          firm_name: businessName,
        }),
      });

      const data = await res.json();

      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        senderName: 'AI Tax Assistant',
        text: data.reply || 'Thank you for your inquiry. Our senior CA team has been notified.',
        meta: `🤖 AI Agent • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Live Auto-reply`,
        escalated: data.escalated || false,
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error('Chat AI error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-accent" />
              <span>24/7 WhatsApp AI Tax & Corporate Law Desk</span>
            </CardTitle>
            <CardDescription>
              Autonomous responses for GST/ITR inquiries, document checklists, fee invoices, and senior partner escalations
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-subtle text-success border border-success-border">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live CA Assistant Active
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Simulator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Contextual Client Selector & Quick Prompts */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Simulate as Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-fg-muted">
                Choose a client entity to test contextual compliance memory:
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedClientName(c.client_name);
                      setSelectedClientPhone(c.phone);
                    }}
                    className={`w-full text-left p-2.5 rounded-md border text-xs transition-colors flex items-center justify-between ${
                      selectedClientName === c.client_name
                        ? 'bg-accent-subtle border-accent-border text-accent font-semibold shadow-xs'
                        : 'bg-surface border-line text-fg hover:bg-surface-hover'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{c.client_name}</div>
                      <div className="text-[10px] text-fg-muted font-mono">{c.phone}</div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-subtle border border-line text-fg-muted">
                      {c.entity_type || 'Pvt Ltd'}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Frequently Asked Tax Queries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {FAQS.map((faq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(faq)}
                  className="w-full text-left p-2 rounded-md bg-surface-subtle hover:bg-surface-hover border border-line text-xs text-fg transition-colors flex items-start gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{faq}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Interactive WhatsApp Sandbox */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col h-[560px]">
            {/* Header */}
            <div className="p-3 border-b border-line bg-surface-subtle flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-accent text-accent-fg flex items-center justify-center font-bold text-xs">
                  CA
                </div>
                <div>
                  <div className="text-xs font-bold text-fg">
                    {businessName} AI Staff
                  </div>
                  <div className="text-[10px] text-success flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Online 24/7 on WhatsApp
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setMessages([
                    {
                      id: '1',
                      sender: 'ai',
                      senderName: 'AI Practice Assistant',
                      text: `Greetings! I am the 24/7 Autonomous Tax & Corporate Compliance Assistant for ${businessName}. How may I assist you today?`,
                      meta: '🤖 AI Agent • Live Auto-reply',
                    },
                  ])
                }
                title="Reset Sandbox"
                leftIcon={<RefreshCw className="w-3 h-3" />}
              >
                Reset
              </Button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-base/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'client' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed shadow-xs whitespace-pre-line ${
                      msg.sender === 'client'
                        ? 'bg-accent text-accent-fg rounded-tr-none'
                        : 'bg-surface text-fg border border-line rounded-tl-none'
                    }`}
                  >
                    {msg.text}

                    {msg.escalated && (
                      <div className="mt-2 pt-2 border-t border-line/50 flex items-center gap-1.5 text-[11px] font-bold text-danger">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Escalated to Senior CA Partner on WhatsApp</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-fg-subtle mt-0.5 font-mono px-1">
                    {msg.meta}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 text-xs text-fg-muted p-2 rounded-lg bg-surface border border-line w-fit">
                  <span className="w-2 h-2 rounded-full bg-accent animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[10px] ml-1">AI analyzing GST & Income Tax provisions...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-line bg-surface flex items-center gap-2">
              <Input
                placeholder="Ask statutory question (e.g. 'what documents for GST-3B?', 'advance tax due date')..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 text-xs"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSend()}
                disabled={!inputMsg.trim()}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
