'use client';

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
  CheckCheck,
  ArrowLeft,
} from 'lucide-react';
import { useToast } from '../ui/ToastContext';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
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

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const prevMessagesLengthRef = useRef<number>(0);
  const prevSelectedThreadRef = useRef<string | null>(null);

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

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              <span>Live WhatsApp Customer Inbox & AI Logs</span>
            </CardTitle>
            <CardDescription>
              Real-time message feed of incoming customer requests and autonomous AI responses
            </CardDescription>
          </div>

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
        </CardHeader>
      </Card>

      {/* Main Chat Split Panel */}
      <Card className="p-0 overflow-hidden h-[600px] flex flex-col md:flex-row">
        {/* Left Sidebar: Threads List */}
        <div
          className={`w-full md:w-80 md:border-r border-line flex flex-col bg-surface ${
            selectedCustomerNumber ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search Box */}
          <div className="p-3 border-b border-line">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search phone or text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 text-xs"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-line no-scrollbar">
            {loading && threads.length === 0 ? (
              <div className="p-3 space-y-3">
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
                    className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                      isSelected
                        ? 'bg-accent-subtle/40 border-l-2 border-accent font-medium'
                        : 'hover:bg-surface-hover'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-surface-subtle border border-line flex items-center justify-center text-fg-muted shrink-0 text-xs font-bold">
                      <User className="w-4 h-4" />
                    </div>
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

        {/* Right Pane: Active Thread Chat View */}
        <div
          className={`flex-1 flex flex-col bg-base/50 ${
            !selectedCustomerNumber ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeThread ? (
            <>
              {/* Header */}
              <div className="p-3 border-b border-line bg-surface flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setSelectedCustomerNumber(null)}
                    className="md:hidden p-1 rounded-md text-fg-muted hover:bg-surface-subtle"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-accent text-accent-fg flex items-center justify-center font-bold text-xs">
                    WA
                  </div>
                  <div>
                    <div className="text-xs font-bold text-fg font-mono">
                      {activeThread.customer_number}
                    </div>
                    <div className="text-[10px] text-success flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      Active WhatsApp Thread
                    </div>
                  </div>
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
                        className={`max-w-[80%] rounded-lg p-3 text-xs leading-relaxed whitespace-pre-line shadow-xs ${
                          isAgent
                            ? 'bg-accent text-accent-fg rounded-tr-none'
                            : 'bg-surface text-fg border border-line rounded-tl-none'
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
                  placeholder="Type manual override WhatsApp reply..."
                  value={manualReplyText}
                  onChange={(e) => setManualReplyText(e.target.value)}
                  className="flex-1 text-xs"
                />
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={!manualReplyText.trim()}
                  loading={sendingReply}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-fg-muted">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm font-semibold">Select a customer thread</p>
              <p className="text-xs max-w-xs mt-1">
                Choose any customer conversation from the list to view real-time WhatsApp dialogue and AI responses.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
