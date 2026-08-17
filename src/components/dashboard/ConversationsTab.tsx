import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabaseClient } from '../../lib/supabase/client';
import { Conversation, ConversationThread } from '../../types';
import { ConversationThreadSkeleton } from './SkeletonLoaders';
import {
  MessageSquare,
  User,
  Bot,
  RefreshCw,
  Send,
  Search,
  Phone,
  ShieldCheck,
  CheckCheck,
  ArrowLeft,
} from 'lucide-react';
import { useToast } from '../ui/ToastContext';

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

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const prevMessagesLengthRef = useRef<number>(0);
  const prevSelectedThreadRef = useRef<string | null>(null);

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

  // Group threads by customer_number
  const threads = useMemo(() => {
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

    return Array.from(threadsMap.values()).sort(
      (a, b) => new Date(b.last_timestamp).getTime() - new Date(a.last_timestamp).getTime()
    );
  }, [conversations]);

  // Auto-select first thread if none selected
  useEffect(() => {
    if (!selectedCustomerNumber && threads.length > 0) {
      setSelectedCustomerNumber(threads[0].customer_number);
    }
  }, [threads, selectedCustomerNumber]);

  // Filtered threads based on search
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      const q = searchQuery.toLowerCase();
      return (
        t.customer_number.toLowerCase().includes(q) ||
        t.last_message.toLowerCase().includes(q)
      );
    });
  }, [threads, searchQuery]);

  // Active Selected Thread
  const activeThread = useMemo(() => {
    return threads.find((t) => t.customer_number === selectedCustomerNumber) || null;
  }, [threads, selectedCustomerNumber]);

  // Track if user has scrolled away from bottom
  const handleChatScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const threshold = 60;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  }, []);

  // Smart Auto-Scroll
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el || !activeThread) return;

    const threadChanged = prevSelectedThreadRef.current !== selectedCustomerNumber;
    const messagesAdded = activeThread.messages.length > prevMessagesLengthRef.current;

    if (threadChanged) {
      el.scrollTop = el.scrollHeight;
      isAtBottomRef.current = true;
    } else if (messagesAdded && isAtBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }

    prevSelectedThreadRef.current = selectedCustomerNumber;
    prevMessagesLengthRef.current = activeThread.messages.length;
  }, [activeThread?.messages, selectedCustomerNumber]);

  // Send Manual Reply via WhatsApp Cloud API
  const handleSendManualReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReplyText.trim() || !selectedCustomerNumber || sendingReply) return;

    setSendingReply(true);
    const messageToSend = manualReplyText.trim();
    setManualReplyText('');

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          customerNumber: selectedCustomerNumber,
          message: messageToSend,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to dispatch WhatsApp message');
      }
    } catch (err: any) {
      console.error('Manual reply error:', err);
      showToast({
        title: 'WhatsApp Send Error',
        message: err.message,
        type: 'error',
      });
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Toolbar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Live WhatsApp Inbox & Human Takeover</h2>
            <p className="text-xs text-slate-500">
              Inspect real-time customer conversations or step in with manual replies anytime
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchConversations(true)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-slate-900' : 'text-slate-400'}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Inbox'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Split Layout */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden md:grid md:grid-cols-12 min-h-[550px]">
        {/* Left Sidebar: Threads List (Visible on desktop or when no chat is selected on mobile) */}
        <div className={`md:col-span-4 border-r border-slate-200/80 flex flex-col h-full bg-slate-50/50 ${selectedCustomerNumber ? 'hidden md:flex' : 'flex'}`}>
          {/* Thread Search Box */}
          <div className="p-3 border-b border-slate-200/80 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats by phone or text..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[600px]">
            {loading ? (
              <div className="p-4 space-y-3">
                <ConversationThreadSkeleton />
                <ConversationThreadSkeleton />
                <ConversationThreadSkeleton />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs text-slate-500">No conversations recorded yet.</p>
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
                        ? 'bg-white border-l-4 border-l-slate-900 shadow-sm'
                        : 'hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="font-mono text-xs font-semibold text-slate-900">{thread.customer_number}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(thread.last_timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{thread.last_message}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Active Chat Transcript & Live Takeover Input (Visible on desktop or when a chat is selected on mobile) */}
        <div className={`md:col-span-8 flex flex-col h-full bg-white ${selectedCustomerNumber ? 'flex' : 'hidden md:flex'}`}>
          {activeThread ? (
            <>
              {/* Chat Header */}
              <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => setSelectedCustomerNumber(null)}
                    className="md:hidden p-1.5 -ml-1.5 mr-0.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Back to inbox"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono font-bold text-xs">
                    WA
                  </div>
                  <div>
                    <h3 className="font-mono text-xs font-semibold text-slate-900">{activeThread.customer_number}</h3>
                    <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Groq Whisper + LLaMA Live Agent</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] px-2.5 py-0.5 bg-white rounded-md border border-slate-200 text-slate-600 font-medium">
                    {activeThread.messages.length} msgs
                  </span>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div
                ref={chatContainerRef}
                onScroll={handleChatScroll}
                className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[480px] bg-slate-50/30"
              >
                {activeThread.messages.map((msg, index) => {
                  const isCustomer = msg.sender === 'customer';
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex items-start space-x-2.5 ${isCustomer ? 'justify-start' : 'justify-end'}`}
                    >
                      {isCustomer && (
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-1">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[78%] rounded-xl p-3.5 text-xs shadow-sm whitespace-pre-wrap leading-relaxed ${
                          isCustomer
                            ? 'bg-white border border-slate-200 text-slate-900'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        <p>{msg.message}</p>
                        <div
                          className={`flex items-center justify-end space-x-1 text-[10px] mt-1.5 ${
                            isCustomer ? 'text-slate-400' : 'text-slate-400'
                          }`}
                        >
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {!isCustomer && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                        </div>
                      </div>

                      {!isCustomer && (
                        <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0 mt-1">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Live Takeover Manual Message Input */}
              <form onSubmit={handleSendManualReply} className="p-4 border-t border-slate-200 bg-white">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={manualReplyText}
                    onChange={(e) => setManualReplyText(e.target.value)}
                    placeholder={`Reply manually to ${activeThread.customer_number} via WhatsApp...`}
                    disabled={sendingReply}
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!manualReplyText.trim() || sendingReply}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingReply ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 stroke-1 text-slate-300" />
              <p className="text-xs text-slate-500">Select a conversation thread to view the live chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
