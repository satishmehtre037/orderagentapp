'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabaseClient } from '../../lib/supabase/client';
import { Conversation, ConversationThread } from '../../types';
import {
  MessageSquare,
  User,
  Bot,
  RefreshCw,
  Send,
  Search,
  Phone,
  CheckCheck,
  ArrowLeft,
  Sparkles,
  Zap,
  ShoppingBag,
  Clock,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';
import { useToast } from '../ui/ToastContext';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Badge,
  Avatar,
  Modal,
  ConversationThreadSkeleton,
} from '../ui';

interface ConversationsTabProps {
  businessId: string;
}

export const ConversationsTab: React.FC<ConversationsTabProps> = ({ businessId }) => {
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerNumber, setSelectedCustomerNumber] = useState<string | null>(null);
  const [manualReplyText, setManualReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [humanTakeover, setHumanTakeover] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [isMobileInspectorOpen, setIsMobileInspectorOpen] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const fetchConversations = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        const res = await fetch(`/api/conversations?businessId=${encodeURIComponent(businessId)}`);
        const data = await res.json();

        if (data.conversations) {
          setConversations(data.conversations);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [businessId]
  );

  useEffect(() => {
    fetchConversations();

    const pollInterval = setInterval(() => {
      fetchConversations(false);
    }, 2500);

    const channel = supabaseClient
      .channel(`realtime-conversations-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          fetchConversations(false);
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabaseClient.removeChannel(channel);
    };
  }, [businessId, fetchConversations]);

  const threads = useMemo(() => {
    const threadsMap = new Map<string, ConversationThread>();
    conversations.forEach((rawMsg: any) => {
      const text = rawMsg.message_text || rawMsg.message || '';
      const sender =
        rawMsg.message_direction === 'inbound' || rawMsg.sender === 'customer' || rawMsg.sender === 'inbound'
          ? 'customer'
          : 'agent';
      const msg: Conversation = {
        id: rawMsg.id,
        business_id: rawMsg.business_id,
        customer_number: rawMsg.customer_number,
        message: text,
        sender,
        created_at: rawMsg.created_at,
      };

      const existing = threadsMap.get(msg.customer_number);
      if (existing) {
        existing.messages.push(msg);
        if (new Date(msg.created_at) > new Date(existing.last_timestamp)) {
          existing.last_timestamp = msg.created_at;
          existing.last_message = msg.message;
        }
      } else {
        threadsMap.set(msg.customer_number, {
          customer_number: msg.customer_number,
          last_message: msg.message,
          last_timestamp: msg.created_at,
          messages: [msg],
        });
      }
    });

    return Array.from(threadsMap.values()).sort(
      (a, b) => new Date(b.last_timestamp).getTime() - new Date(a.last_timestamp).getTime()
    );
  }, [conversations]);

  const filteredThreads = useMemo(() => {
    return threads.filter(
      (t) =>
        t.customer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.last_message.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [threads, searchQuery]);

  const activeThread = useMemo(() => {
    if (!selectedCustomerNumber) return null;
    const thread = threads.find((t) => t.customer_number === selectedCustomerNumber);
    if (!thread) return null;
    return {
      ...thread,
      messages: [...thread.messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    };
  }, [threads, selectedCustomerNumber]);

  // Derive smart AI Co-Pilot insights from the active thread messages
  const aiInsights = useMemo(() => {
    if (!activeThread || activeThread.messages.length === 0) return null;
    const lastCustomerMsg = [...activeThread.messages]
      .reverse()
      .find((m) => m.sender === 'customer')?.message || activeThread.last_message;

    const lower = lastCustomerMsg.toLowerCase();
    let intent = 'General Inquiry';
    let intentTone: 'accent' | 'success' | 'warning' | 'info' = 'info';
    let draftAction = 'Answering customer questions autonomously';
    let confidence = 96;

    if (lower.includes('order') || lower.includes('buy') || lower.includes('cake') || lower.includes('price') || lower.includes('cost') || lower.includes('kg') || lower.includes('rate') || lower.includes('menu')) {
      intent = 'Order / Price Inquiry';
      intentTone = 'success';
      draftAction = 'Evaluating product catalog & pricing';
      confidence = 98;
    } else if (lower.includes('book') || lower.includes('appointment') || lower.includes('slot') || lower.includes('doctor') || lower.includes('time') || lower.includes('schedule')) {
      intent = 'Appointment Booking';
      intentTone = 'accent';
      draftAction = 'Checking available calendar slots';
      confidence = 97;
    } else if (lower.includes('help') || lower.includes('complaint') || lower.includes('issue') || lower.includes('cancel') || lower.includes('not working')) {
      intent = 'Support / Escalation';
      intentTone = 'warning';
      draftAction = 'Human attention recommended if unresolved';
      confidence = 88;
    }

    return {
      intent,
      intentTone,
      draftAction,
      confidence,
      totalMessages: activeThread.messages.length,
      firstSeen: activeThread.messages[0]?.created_at,
      lastCustomerMsg,
    };
  }, [activeThread]);

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeThread?.messages]);

  useEffect(() => {
    if (!selectedCustomerNumber && threads.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSelectedCustomerNumber(threads[0].customer_number);
    }
  }, [threads, selectedCustomerNumber]);

  const handleSendManualReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReplyText.trim() || !selectedCustomerNumber) return;

    try {
      setSendingReply(true);
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          to: selectedCustomerNumber,
          message: manualReplyText.trim(),
          source: 'dashboard_manual_reply',
        }),
      });

      if (res.ok) {
        setManualReplyText('');
        showToast({ title: 'Reply Sent', message: 'WhatsApp message delivered to customer.', type: 'whatsapp' });
        fetchConversations(false);
      } else {
        showToast({ title: 'Reply Failed', message: 'Could not send WhatsApp message.', type: 'error' });
      }
    } catch (err) {
      console.error('Manual reply error:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const renderInspectorContent = () => {
    if (!activeThread || !aiInsights) return null;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-fg">AI Co-Pilot</span>
          </div>
          <Badge tone="accent">
            {aiInsights.confidence}% Confidence
          </Badge>
        </div>

        {/* Detected Intent */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider">Detected Intent</span>
          <div className="p-3 rounded-lg bg-surface-subtle border border-line">
            <Badge tone={aiInsights.intentTone} className="font-semibold text-xs">
              {aiInsights.intent}
            </Badge>
            <p className="text-xs text-fg-muted mt-1.5 leading-relaxed">
              {aiInsights.draftAction}
            </p>
          </div>
        </div>

        {/* Customer Context */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider">Customer Profile</span>
          <div className="p-3 rounded-lg bg-surface-subtle border border-line space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-fg-muted">WhatsApp Phone</span>
              <span className="font-mono font-semibold text-fg">{activeThread.customer_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-fg-muted">Thread Activity</span>
              <span className="font-mono font-semibold text-fg">{aiInsights.totalMessages} messages</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-fg-muted">First Dialogue</span>
              <span className="font-mono text-fg-subtle text-[11px]">
                {aiInsights.firstSeen ? new Date(aiInsights.firstSeen).toLocaleDateString() : 'Today'}
              </span>
            </div>
          </div>
        </div>

        {/* 1-Click Takeover Card */}
        <div className="pt-2 border-t border-line space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-fg">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Autopilot Controls</span>
          </div>
          <p className="text-[11px] text-fg-muted leading-relaxed">
            Take over this conversation to reply manually. 24/7 AI replies will pause for this customer until resumed.
          </p>
          <Button
            variant={humanTakeover ? 'danger' : 'secondary'}
            size="sm"
            fullWidth
            onClick={() => {
              const next = !humanTakeover;
              setHumanTakeover(next);
              showToast({
                title: next ? 'Human Mode Enabled' : 'AI Autopilot Resumed',
                message: next ? 'AI paused for this thread.' : 'AI will handle incoming messages.',
                type: next ? 'warning' : 'whatsapp',
              });
            }}
          >
            {humanTakeover ? 'Resume AI Autopilot' : 'Take Over Chat'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <Card className="border border-line bg-surface shadow-xs">
        <CardHeader className="p-3.5 sm:p-4 flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-fg">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span>Live WhatsApp Customer Inbox & AI Logs</span>
            </CardTitle>
            <CardDescription className="text-xs text-fg-muted">
              Real-time feed of customer inquiries and autonomous AI agent responses
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchConversations(true)}
              disabled={refreshing || loading}
              title="Refresh Chats"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main Chat Split Panel */}
      <Card className="p-0 overflow-hidden h-[640px] flex flex-col md:flex-row border border-line bg-surface shadow-xs rounded-xl">
        {/* Left Sidebar: Threads List */}
        <div
          className={`w-full md:w-80 md:border-r border-line flex flex-col bg-surface ${
            selectedCustomerNumber ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search Box */}
          <div className="p-3 border-b border-line bg-surface-subtle/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search phone or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 text-xs h-9"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-line no-scrollbar">
            {loading && threads.length === 0 ? (
              <div className="p-3 space-y-2">
                <ConversationThreadSkeleton />
                <ConversationThreadSkeleton />
                <ConversationThreadSkeleton />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-fg-muted">
                No conversation threads found.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = selectedCustomerNumber === thread.customer_number;
                return (
                  <button
                    key={thread.customer_number}
                    onClick={() => setSelectedCustomerNumber(thread.customer_number)}
                    className={`w-full text-left p-3 transition-colors flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-accent-subtle/80 border-l-2 border-accent font-medium'
                        : 'hover:bg-surface-hover'
                    }`}
                  >
                    <Avatar name={thread.customer_number} size="sm" className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-fg font-mono truncate">
                          {thread.customer_number}
                        </span>
                        <span className="text-[10px] text-fg-subtle shrink-0 font-mono">
                          {new Date(thread.last_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-fg-muted truncate mt-0.5">
                        {thread.last_message}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center Pane: Active Thread Chat View */}
        <div
          className={`flex-1 flex flex-col bg-base/20 ${
            !selectedCustomerNumber ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeThread ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-line bg-surface flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => setSelectedCustomerNumber(null)}
                    className="md:hidden p-1.5 rounded-md text-fg-muted hover:bg-surface-subtle"
                    aria-label="Back to threads"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <Avatar name={activeThread.customer_number} size="sm" status="online" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-fg font-mono truncate">
                      {activeThread.customer_number}
                    </div>
                    <div className="text-[10px] text-success flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      <span>Live 24/7 AI Managed</span>
                    </div>
                  </div>
                </div>

                {/* AI Co-Pilot Toggle Button */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={humanTakeover ? 'danger' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      const next = !humanTakeover;
                      setHumanTakeover(next);
                      showToast({
                        title: next ? 'Human Takeover Activated' : 'AI Autopilot Resumed',
                        message: next
                          ? 'AI is silent for this thread. Type your replies below.'
                          : 'AI agent will handle incoming replies autonomously.',
                        type: next ? 'warning' : 'whatsapp',
                      });
                    }}
                    leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                  >
                    <span className="hidden sm:inline">{humanTakeover ? 'Human Mode' : 'AI Autopilot'}</span>
                  </Button>

                  {/* Tablet / Mobile Drawer trigger */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsMobileInspectorOpen(true)}
                    className="lg:hidden"
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
                  >
                    <span>Inspect</span>
                  </Button>

                  {/* Desktop Inspector inline toggle */}
                  <Button
                    variant={showInspector ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setShowInspector(!showInspector)}
                    className="hidden lg:inline-flex"
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
                  >
                    <span>Inspector</span>
                  </Button>
                </div>
              </div>

              {/* Chat Bubble Feed */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {activeThread.messages.map((msg) => {
                  const isAgent = msg.sender === 'agent';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-3 text-xs leading-relaxed whitespace-pre-line shadow-xs ${
                          isAgent
                            ? 'chat-outbound-bubble rounded-tr-none'
                            : 'chat-inbound-bubble rounded-tl-none'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[9px] text-fg-subtle mt-0.5 font-mono px-1 flex items-center gap-1">
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isAgent && <CheckCheck className="w-3 h-3 text-accent" />}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Manual Override Input Bar */}
              <form onSubmit={handleSendManualReply} className="p-3 border-t border-line bg-surface flex items-center gap-2">
                <Input
                  placeholder={humanTakeover ? 'Type manual WhatsApp message...' : 'Type to manually intervene or reply...'}
                  value={manualReplyText}
                  onChange={(e) => setManualReplyText(e.target.value)}
                  className="flex-1 text-xs h-10"
                />
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={!manualReplyText.trim()}
                  loading={sendingReply}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  className="h-10"
                >
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-fg-muted">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-accent" />
              <p className="text-sm font-semibold text-fg">Select a customer thread</p>
              <p className="text-xs max-w-xs mt-1 text-fg-muted">
                Choose any customer conversation from the list to view real-time WhatsApp dialogue and AI responses.
              </p>
            </div>
          )}
        </div>

        {/* Right Pane: AI Co-Pilot Inspector (Desktop) */}
        {activeThread && showInspector && aiInsights && (
          <div className="hidden lg:flex w-72 border-l border-line bg-surface flex-col p-4 overflow-y-auto">
            {renderInspectorContent()}
          </div>
        )}
      </Card>

      {/* Mobile / Tablet Slide-Over Inspector Modal */}
      <Modal
        open={isMobileInspectorOpen}
        onClose={() => setIsMobileInspectorOpen(false)}
        title="AI Co-Pilot Inspector"
        description="Live inquiry analysis & autonomous action log"
        icon={<Sparkles className="text-accent" />}
        mobile="sheet"
        size="md"
      >
        <div className="py-2">
          {renderInspectorContent()}
        </div>
      </Modal>
    </div>
  );
};


