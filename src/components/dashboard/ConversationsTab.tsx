import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseClient } from '../../lib/supabase/client';
import { Conversation, ConversationThread } from '../../types';
import { ConversationThreadSkeleton } from './SkeletonLoaders';
import {
  MessageSquare,
  User,
  Bot,
  Clock,
  Sparkles,
  RefreshCw,
  Send,
  Search,
  Phone,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface ConversationsTabProps {
  businessId: string;
}

export const ConversationsTab: React.FC<ConversationsTabProps> = ({ businessId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerNumber, setSelectedCustomerNumber] = useState<string | null>(null);
  const [manualReplyText, setManualReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch all conversations from server API
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

    // Supabase Realtime subscription
    const channel = supabaseClient
      .channel(`realtime-conversations-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const rawMsg = payload.new as any;
          const newMsg: Conversation = {
            ...rawMsg,
            message: rawMsg.message_text || rawMsg.message || '',
            sender:
              rawMsg.message_direction === 'inbound' || rawMsg.sender === 'customer' || rawMsg.sender === 'inbound'
                ? 'customer'
                : 'agent',
          };
          setConversations((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [businessId, fetchConversations]);

  // Group conversations by customer_number
  const threadsMap = new Map<string, ConversationThread>();
  conversations.forEach((rawMsg: any) => {
    const text = rawMsg.message_text || rawMsg.message || '';
    const sender =
      rawMsg.message_direction === 'inbound' || rawMsg.sender === 'customer' || rawMsg.sender === 'inbound'
        ? 'customer'
        : 'agent';
    const msg: Conversation = {
      ...rawMsg,
      message: text,
      sender: sender,
    };

    const existing = threadsMap.get(msg.customer_number);
    if (!existing) {
      threadsMap.set(msg.customer_number, {
        customer_number: msg.customer_number,
        last_message: msg.message,
        last_timestamp: msg.created_at,
        messages: [msg],
      });
    } else {
      existing.messages.push(msg);
      existing.last_message = msg.message;
      existing.last_timestamp = msg.created_at;
    }
  });

  const threads = Array.from(threadsMap.values()).sort(
    (a, b) => new Date(b.last_timestamp).getTime() - new Date(a.last_timestamp).getTime()
  );

  // Filter threads by search query
  const filteredThreads = threads.filter(
    (t) =>
      t.customer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Set default selected thread if none selected
  useEffect(() => {
    if (!selectedCustomerNumber && threads.length > 0) {
      setSelectedCustomerNumber(threads[0].customer_number);
    }
  }, [threads, selectedCustomerNumber]);

  const activeThread = threads.find((t) => t.customer_number === selectedCustomerNumber);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages]);

  // Send Manual Reply (Human Takeover)
  const handleSendManualReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReplyText.trim() || !selectedCustomerNumber) return;

    setSendingReply(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          customerNumber: selectedCustomerNumber,
          messageText: manualReplyText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        setConversations((prev) => [...prev, data.message]);
        setManualReplyText('');
      } else {
        alert(data.error || 'Failed to deliver message via WhatsApp');
      }
    } catch (err: any) {
      alert(`Error sending message: ${err.message}`);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Toolbar */}
      <div className="bg-warm-card border border-warm-border p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-paper rounded border border-warm-border">
            <MessageSquare className="w-5 h-5 text-teal" />
          </div>
          <div>
            <h2 className="font-serif text-base font-bold text-ink">Conversations Studio & Live Takeover</h2>
            <p className="text-xs text-ink-muted">
              Live automated AI chat history with direct manual WhatsApp reply capabilities
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchConversations(true)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-paper border border-warm-border text-xs font-mono text-ink-light hover:text-ink hover:bg-warm-stub transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Chats'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Split Layout */}
      <div className="bg-paper border-2 border-warm-border rounded-lg shadow-ledger overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Sidebar: Threads List */}
        <div className="md:col-span-4 border-r border-warm-border flex flex-col h-full bg-warm-card/30">
          {/* Thread Search Box */}
          <div className="p-3.5 border-b border-warm-border bg-warm-stub">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-light absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search phone or text..."
                className="w-full pl-8 pr-3 py-1.5 bg-paper border border-warm-border rounded text-xs focus:border-teal"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-warm-border/60">
            {loading ? (
              <div className="p-4 space-y-3">
                <ConversationThreadSkeleton />
                <ConversationThreadSkeleton />
                <ConversationThreadSkeleton />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs text-ink-muted">No conversation threads found.</p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = thread.customer_number === selectedCustomerNumber;
                return (
                  <div
                    key={thread.customer_number}
                    onClick={() => setSelectedCustomerNumber(thread.customer_number)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-paper border-l-4 border-l-teal shadow-sm'
                        : 'hover:bg-warm-card/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3 h-3 text-teal" />
                        <span className="font-mono text-xs font-bold text-ink">{thread.customer_number}</span>
                      </div>
                      <span className="text-[10px] font-mono text-ink-light">
                        {new Date(thread.last_timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted line-clamp-1 font-sans">{thread.last_message}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Active Chat Transcript & Live Takeover Input */}
        <div className="md:col-span-8 flex flex-col h-full bg-paper">
          {activeThread ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-3.5 border-b border-warm-border bg-warm-stub flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-teal-light text-teal border border-teal/30 flex items-center justify-center font-mono font-bold text-xs">
                    WA
                  </div>
                  <div>
                    <h3 className="font-mono text-xs font-bold text-ink">{activeThread.customer_number}</h3>
                    <span className="text-[10px] text-ink-muted flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-sage" />
                      <span>Groq Llama 3.3 Active Assistant</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-paper rounded border border-warm-border text-ink-light">
                    {activeThread.messages.length} messages
                  </span>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[460px]">
                {activeThread.messages.map((msg, index) => {
                  const isCustomer = msg.sender === 'customer';
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex items-start space-x-2.5 ${isCustomer ? 'justify-start' : 'justify-end'}`}
                    >
                      {isCustomer && (
                        <div className="w-7 h-7 rounded-full bg-warm-card border border-warm-border flex items-center justify-center text-ink-light shrink-0 mt-1">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[78%] rounded-lg p-3.5 text-xs shadow-sm whitespace-pre-wrap leading-relaxed ${
                          isCustomer
                            ? 'bg-warm-card border border-warm-border text-ink'
                            : 'bg-teal text-white border border-teal'
                        }`}
                      >
                        <p>{msg.message}</p>
                        <div
                          className={`text-[9px] font-mono mt-1 text-right ${
                            isCustomer ? 'text-ink-light' : 'text-teal-light'
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {!isCustomer && (
                        <div className="w-7 h-7 rounded-full bg-teal-light border border-teal/30 flex items-center justify-center text-teal shrink-0 mt-1">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Live Takeover / Manual WhatsApp Reply Bar */}
              <div className="p-4 border-t border-warm-border bg-warm-stub">
                <form onSubmit={handleSendManualReply} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={manualReplyText}
                    onChange={(e) => setManualReplyText(e.target.value)}
                    placeholder="Type manual reply to customer's WhatsApp..."
                    className="flex-1 px-3.5 py-2.5 bg-paper border border-warm-border rounded-md text-xs focus:border-teal"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !manualReplyText.trim()}
                    className="px-4 py-2.5 rounded-md bg-teal text-white font-serif font-bold text-xs hover:bg-teal-hover shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-marigold" />
                    <span>{sendingReply ? 'Sending...' : 'Send'}</span>
                  </button>
                </form>
                <span className="text-[10px] text-ink-muted block mt-1.5">
                  Sends directly to customer's WhatsApp chat from your business number.
                </span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-ink-light" />
              <h4 className="font-serif font-bold text-sm text-ink">No conversation selected</h4>
              <p className="text-xs text-ink-muted">Select a conversation thread from the left to view the transcript.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
