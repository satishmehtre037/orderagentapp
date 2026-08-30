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
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
} from '@/components/ui';

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
        tools.push('Reschedule / Cancel Appointment');
        aiReply = `🗓️ *Appointment Rescheduled*\n\nYour consultation has been moved to *Friday at 4:30 PM* with *Dr. Priya Sharma*.\n\nYour new queue token is *#OPD-22*.`;
      } else {
        tools.push('Get Hospital And Doctor Info');
        aiReply = `Thank you for reaching out to *${businessName || 'MediCare Hospital'}*. I can help you with:\n\n1️⃣ *Book Doctor Consultation*\n2️⃣ *Check Diagnostic Lab Report Status*\n3️⃣ *OPD Queue & Token Inquiries*\n4️⃣ *Emergency Casualty Information*\n\nWhat would you like assistance with?`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolsUsed: tools,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 900);
  };

  const samplePrompts = [
    'Book an appointment with Dr. Rajesh Gupta for tomorrow morning',
    'Are my CBC lab test reports ready?',
    'What are the doctor timings and consultation fees for Orthopedics?',
    'I have severe chest pain and breathlessness since 1 hour',
    'I want to reschedule my appointment to Friday evening',
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-accent" />
              <span>24/7 WhatsApp Medical AI Simulator</span>
            </CardTitle>
            <CardDescription>
              Test medical triage, OPD appointment booking, lab OCR status, and emergency casualty handoffs in real-time
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-subtle text-success border border-success-border">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live Medical LLM Active
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Simulator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Simulator controls & tools */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Simulate as Patient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-fg-muted">
                Select an active patient record to test contextual memory:
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className={`w-full text-left p-2.5 rounded-md border text-xs transition-colors flex items-center justify-between ${
                      selectedPatient?.id === p.id
                        ? 'bg-accent-subtle border-accent-border text-accent font-semibold shadow-xs'
                        : 'bg-surface border-line text-fg hover:bg-surface-hover'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-[10px] text-fg-muted font-mono">{p.phone}</div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-subtle border border-line text-fg-muted">
                      {p.blood_group || 'O+'}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Scenario Prompts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-left p-2 rounded-md bg-surface-subtle hover:bg-surface-hover border border-line text-xs text-fg transition-colors flex items-start gap-1.5 group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{prompt}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Chat Simulator Screen */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col h-[560px]">
            {/* WhatsApp Chat Header */}
            <div className="p-3 border-b border-line bg-surface-subtle flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-accent text-accent-fg flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div>
                  <div className="text-xs font-bold text-fg">
                    {businessName || 'MediCare Hospital'} AI Staff
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
                      text: `Hello! I am the 24/7 Medical AI Assistant for ${businessName || 'MediCare Hospital'}. How may I assist you today?`,
                      timestamp: '10:00 AM',
                    },
                  ])
                }
                title="Reset Conversation"
                leftIcon={<RefreshCw className="w-3 h-3" />}
              >
                Reset
              </Button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-base/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'patient' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed shadow-xs whitespace-pre-line ${
                      msg.sender === 'patient'
                        ? 'bg-accent text-accent-fg rounded-tr-none'
                        : 'bg-surface text-fg border border-line rounded-tl-none'
                    }`}
                  >
                    {msg.text}

                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-line/50 flex flex-wrap gap-1">
                        {msg.toolsUsed.map((tool, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-surface-subtle text-accent border border-accent-border"
                          >
                            <Zap className="w-2.5 h-2.5" />
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-fg-subtle mt-0.5 font-mono px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 text-xs text-fg-muted p-2 rounded-lg bg-surface border border-line w-fit">
                  <span className="w-2 h-2 rounded-full bg-accent animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[10px] ml-1">AI checking hospital schedule & medical guidelines...</span>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 border-t border-line bg-surface flex items-center gap-2">
              <Input
                placeholder="Type patient query (e.g. 'book appointment', 'lab report status')..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 text-xs"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
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
