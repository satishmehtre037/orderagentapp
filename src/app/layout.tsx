import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'auto',
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: 'Agento AI | 24/7 Autonomous WhatsApp AI Staff & Business OS',
  description: 'Agento AI: The Autonomous WhatsApp AI Mobile App & Business OS for Clinics, Real Estate, Salons, Gyms, Cafes, Bakeries, Coaching, and Retail.',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/logo.png',
  },
};

import { ToastProvider } from '../components/ui/ToastContext';
import { ThemeProvider } from '../components/ui/ThemeContext';
import { Analytics } from '@vercel/analytics/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen antialiased selection:bg-slate-900 selection:text-white dark:selection:bg-slate-100 dark:selection:text-slate-900 font-sans transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
