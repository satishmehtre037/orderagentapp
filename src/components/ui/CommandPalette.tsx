'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Search,
  MessageSquare,
  ShoppingBag,
  Building,
  CreditCard,
  Sparkles,
  SunMoon,
  PlusCircle,
  PhoneCall,
  ExternalLink,
  Command as CommandIcon,
  X,
  Bot,
  UserCheck,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  group: 'Navigation' | 'Actions' | 'Controls';
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabKey: string) => void;
  onToggleAiStaff?: () => void;
  onToggleTheme?: () => void;
  onNewOrder?: () => void;
  category?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onToggleAiStaff,
  onToggleTheme,
  onNewOrder,
  category = 'general',
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Navigation
      {
        id: 'nav-orders',
        label: 'Go to Orders & Bookings',
        description: 'View active orders, customer requests and delivery records',
        icon: <ShoppingBag className="h-4 w-4 text-accent" />,
        group: 'Navigation',
        shortcut: 'G O',
        onSelect: () => onNavigateTab('ledger'),
      },
      {
        id: 'nav-chats',
        label: 'Go to Live WhatsApp Inbox',
        description: 'Real-time conversation logs & AI dialogues',
        icon: <MessageSquare className="h-4 w-4 text-emerald-500" />,
        group: 'Navigation',
        shortcut: 'G C',
        onSelect: () => onNavigateTab('conversations'),
      },
      {
        id: 'nav-settings',
        label: 'Go to Business Settings',
        description: 'Update catalog, operating hours & AI knowledge base',
        icon: <Building className="h-4 w-4 text-fg-subtle" />,
        group: 'Navigation',
        shortcut: 'G S',
        onSelect: () => onNavigateTab('business-info'),
      },
      {
        id: 'nav-billing',
        label: 'Go to Subscription & Billing',
        description: 'Manage plan, invoices and payment methods',
        icon: <CreditCard className="h-4 w-4 text-fg-subtle" />,
        group: 'Navigation',
        shortcut: 'G B',
        onSelect: () => onNavigateTab('billing'),
      },

      // Actions
      ...(onNewOrder
        ? [
            {
              id: 'action-new-order',
              label: 'Create Manual Order / Booking',
              description: 'Record walk-in or offline customer transaction',
              icon: <PlusCircle className="h-4 w-4 text-accent" />,
              group: 'Actions' as const,
              shortcut: 'N',
              onSelect: onNewOrder,
            },
          ]
        : []),
      {
        id: 'action-wa-web',
        label: 'Open WhatsApp Web',
        description: 'Launch official WhatsApp Web client in a new tab',
        icon: <ExternalLink className="h-4 w-4 text-emerald-500" />,
        group: 'Actions',
        onSelect: () => window.open('https://web.whatsapp.com', '_blank'),
      },

      // Controls
      ...(onToggleAiStaff
        ? [
            {
              id: 'control-toggle-ai',
              label: 'Toggle 24/7 AI Autonomous Staff',
              description: 'Pause or resume automated WhatsApp replies',
              icon: <Bot className="h-4 w-4 text-accent" />,
              group: 'Controls' as const,
              onSelect: onToggleAiStaff,
            },
          ]
        : []),
      ...(onToggleTheme
        ? [
            {
              id: 'control-toggle-theme',
              label: 'Toggle Dark / Light Theme',
              description: 'Switch application color palette',
              icon: <SunMoon className="h-4 w-4 text-warning" />,
              group: 'Controls' as const,
              shortcut: 'T',
              onSelect: onToggleTheme,
            },
          ]
        : []),
    ];

    return list;
  }, [onNavigateTab, onToggleAiStaff, onToggleTheme, onNewOrder]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        (item.description && item.description.toLowerCase().includes(lower))
    );
  }, [items, query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? filteredItems.length - 1 : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface-elevated shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input header */}
        <div className="relative flex items-center border-b border-line px-3.5 py-3">
          <Search className="h-4 w-4 text-fg-subtle shrink-0 mr-2.5" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search actions... (Esc to exit)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm text-fg placeholder:text-fg-subtle outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-fg-subtle hover:text-fg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-line bg-surface-subtle px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle ml-2">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2 no-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-fg-muted">
              No matching commands or actions found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors',
                    isSelected
                      ? 'bg-accent-subtle text-fg font-medium border-l-2 border-accent'
                      : 'text-fg-muted hover:bg-surface-hover hover:text-fg'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-fg truncate">{item.label}</div>
                      {item.description && (
                        <div className="text-[11px] text-fg-subtle truncate">{item.description}</div>
                      )}
                    </div>
                  </div>

                  {item.shortcut && (
                    <kbd className="hidden sm:inline-flex shrink-0 items-center gap-0.5 rounded border border-line bg-surface-subtle px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between border-t border-line bg-surface-subtle/40 px-3.5 py-2 text-[11px] text-fg-subtle">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono text-[10px]">↑↓</kbd> to navigate
            </span>
            <span>
              <kbd className="font-mono text-[10px]">↵</kbd> to select
            </span>
          </div>
          <span>Agento Business OS</span>
        </div>
      </div>
    </div>
  );
};
