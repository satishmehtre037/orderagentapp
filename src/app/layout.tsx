import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-slate-900 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
