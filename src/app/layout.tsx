import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '../components/ui/ToastContext';
import { ThemeProvider } from '../components/ui/ThemeContext';

/**
 * Self-hosted via next/font instead of a render-blocking @import in
 * globals.css. Exposed as CSS variables that tailwind.config.ts reads.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // 'cover' is required for env(safe-area-inset-*) to report real values.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0c0e' },
  ],
};

export const metadata: Metadata = {
  title: 'Agento AI | 24/7 Autonomous WhatsApp AI Staff & Business OS',
  description:
    'Agento AI: The Autonomous WhatsApp AI Mobile App & Business OS for Clinics, Real Estate, Salons, Gyms, Cafes, Bakeries, Coaching, and Retail.',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/logo.png',
  },
};

/**
 * Applies the persisted theme before first paint.
 *
 * ThemeContext used to be the only place this happened, but it runs inside
 * useEffect — after hydration — which flashed a white screen at dark-mode
 * users on every navigation. This must stay behaviourally identical to
 * ThemeContext's resolution order (stored value, else OS preference) or the
 * flash comes back for whichever case diverges.
 */
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('agento_theme');
    var dark = stored === 'dark' ||
      (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-base font-sans text-fg antialiased selection:bg-accent selection:text-accent-fg">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
