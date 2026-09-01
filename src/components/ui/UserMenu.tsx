'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { ThemeToggle } from './ThemeContext';
import {
  ChevronDown,
  LogOut,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Building,
  Check,
} from 'lucide-react';

export interface UserMenuProps {
  businessName: string;
  email: string;
  category?: string;
  plan?: string;
  isAiActive?: boolean;
  onToggleAi?: () => void;
  onSignOut: () => void;
  onNavigateTab?: (tabKey: string) => void;
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  businessName,
  email,
  category,
  plan,
  isAiActive = true,
  onToggleAi,
  onSignOut,
  onNavigateTab,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          'flex items-center gap-2 rounded-lg border border-line bg-surface p-1.5 pr-2.5 transition-all duration-150',
          'hover:border-line-strong hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent',
          isOpen && 'border-line-strong bg-surface-hover ring-1 ring-accent/20'
        )}
      >
        <Avatar name={businessName || 'Business'} size="sm" status={isAiActive ? 'online' : 'offline'} />
        <div className="hidden text-left sm:block">
          <p className="text-xs font-semibold text-fg leading-tight truncate max-w-[120px]">
            {businessName || 'My Business'}
          </p>
          <p className="text-[10px] text-fg-subtle capitalize leading-tight">
            {category || 'Account'}
          </p>
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 text-fg-subtle transition-transform duration-150', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-xl border border-line bg-surface-elevated p-1.5 shadow-lg backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Business Info Header */}
          <div className="border-b border-line px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-fg truncate">{businessName}</span>
              {plan && (
                <Badge tone="accent" className="text-[10px] uppercase font-mono tracking-wider">
                  {plan}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-fg-muted font-mono truncate">{email}</p>
          </div>

          {/* Quick Actions */}
          <div className="py-1">
            {onToggleAi && (
              <button
                type="button"
                onClick={() => {
                  onToggleAi();
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-fg hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span>24/7 AI Automation</span>
                </div>
                <Badge tone={isAiActive ? 'success' : 'neutral'} dot className="text-[10px]">
                  {isAiActive ? 'Active' : 'Paused'}
                </Badge>
              </button>
            )}

            {onNavigateTab && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('billing');
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-fg hover:bg-surface-hover transition-colors"
                >
                  <CreditCard className="h-3.5 w-3.5 text-fg-subtle" />
                  <span>Subscription & Billing</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('business-info');
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-fg hover:bg-surface-hover transition-colors"
                >
                  <Building className="h-3.5 w-3.5 text-fg-subtle" />
                  <span>Business Settings</span>
                </button>
              </>
            )}

            <a
              href="https://web.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-fg hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-fg-subtle" />
                <span>Open WhatsApp Web</span>
              </div>
            </a>
          </div>

          {/* Theme & Sign Out Footer */}
          <div className="border-t border-line pt-1.5 mt-1 flex items-center justify-between px-2.5 py-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-fg-muted">Theme</span>
              <ThemeToggle />
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-danger hover:bg-danger-subtle transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
