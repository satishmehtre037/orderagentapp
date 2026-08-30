'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Bot, QrCode, Phone, Sparkles } from 'lucide-react';
import { ThemeToggle } from '../../../components/ui/ThemeContext';
import { Button, Card, CardContent } from '../../../components/ui';

export default function OnboardingSuccessPage() {
  const [bizName, setBizName] = useState('Your Business');
  const [bizPhone, setBizPhone] = useState('+91 9876543210');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('biz_name');
      const storedPhone = localStorage.getItem('biz_phone');
      if (storedName) setBizName(storedName);
      if (storedPhone) setBizPhone(storedPhone);
    }
  }, []);

  return (
    <main className="min-h-[100dvh] bg-base flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-fg transition-colors duration-150 relative">
      {/* Top Floating Theme Switch */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 mb-6">
        <div className="inline-flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-success-subtle border border-success-border flex items-center justify-center text-success animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
          Your AI Staff is Live!
        </h1>
        <p className="text-xs sm:text-sm text-fg-muted max-w-sm mx-auto">
          Congratulations! <strong className="text-fg">{bizName}</strong> is now powered by 24/7 autonomous WhatsApp automation.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Live Bot Connection Status */}
            <div className="p-4 bg-surface-subtle border border-line rounded-lg space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-success">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Meta Webhook Active
                </span>
                <span className="font-mono text-fg-muted">{bizPhone}</span>
              </div>

              <div className="p-3 bg-surface border border-line rounded text-xs space-y-1">
                <div className="font-bold text-fg flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>How to test your bot:</span>
                </div>
                <p className="text-fg-muted text-[11px] leading-relaxed">
                  Send a WhatsApp message like <span className="font-semibold text-fg">"Hi, what is your menu?"</span> or <span className="font-semibold text-fg">"I want to book an appointment"</span> to {bizPhone}.
                </p>
              </div>
            </div>

            {/* Dashboard CTA */}
            <div className="space-y-3 pt-2">
              <Link href="/dashboard" className="w-full block">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Enter Owner Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
