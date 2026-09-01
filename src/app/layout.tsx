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
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#090b0e' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://orderagentapp.webcorestudio.dev'),
  title: 'Agento AI | 24/7 Autonomous WhatsApp AI Staff & Business OS',
  description:
    'Agento AI by WebCore Studio: Autonomous WhatsApp AI agents for Hospital OPD appointments, CA Firm compliance, E-commerce ordering, and Customer Support.',
  keywords: [
    'Agento AI',
    'WebCore Studio',
    'WhatsApp AI Agent',
    'WhatsApp Business API',
    'Hospital OPD Booking AI',
    'CA Firm WhatsApp Automation',
    'Autonomous Business OS',
  ],
  authors: [{ name: 'WebCore Studio', url: 'https://orderagentapp.webcorestudio.dev' }],
  creator: 'WebCore Studio',
  publisher: 'WebCore Studio',
  alternates: {
    canonical: 'https://orderagentapp.webcorestudio.dev',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://orderagentapp.webcorestudio.dev',
    siteName: 'Agento AI by WebCore Studio',
    title: 'Agento AI | 24/7 Autonomous WhatsApp AI Staff & Business OS',
    description:
      'Deploy autonomous WhatsApp AI staff for appointments, customer care, lead follow-ups, and live orders in 60 seconds.',
    images: [
      {
        url: 'https://orderagentapp.webcorestudio.dev/logo.png',
        width: 512,
        height: 512,
        alt: 'Agento AI by WebCore Studio Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agento AI | 24/7 Autonomous WhatsApp AI Staff & Business OS',
    description:
      'Deploy autonomous WhatsApp AI staff for appointments, customer care, lead follow-ups, and live orders in 60 seconds.',
    images: ['https://orderagentapp.webcorestudio.dev/logo.png'],
    creator: '@webcorestudio',
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/logo.png',
  },
};

const jsonLdOrg = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'WebCore Studio',
  alternateName: ['Agento AI', 'WebCore Studios', 'OrderAgentAPP'],
  url: 'https://orderagentapp.webcorestudio.dev',
  logo: 'https://orderagentapp.webcorestudio.dev/logo.png',
  sameAs: [
    'https://github.com/satishmehtre037/orderagentapp',
    'https://webcorestudios.in',
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+91-8779841346',
      contactType: 'customer support',
      email: 'support@webcorestudios.in',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
  ],
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'WebCore Studio Tech Hub',
    addressLocality: 'Mumbai',
    addressRegion: 'Maharashtra',
    postalCode: '400001',
    addressCountry: 'IN',
  },
};

const jsonLdSoftware = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Agento AI',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, Android, iOS, WhatsApp Cloud API',
  url: 'https://orderagentapp.webcorestudio.dev',
  description:
    'Autonomous 24/7 WhatsApp AI Business OS for automated clinic appointment scheduling, CA compliance tracking, catalog order processing, and voice support.',
  offers: {
    '@type': 'Offer',
    price: '999',
    priceCurrency: 'INR',
    priceValidUntil: '2027-12-31',
    availability: 'https://schema.org/InStock',
  },
  author: {
    '@type': 'Organization',
    name: 'WebCore Studio',
    url: 'https://orderagentapp.webcorestudio.dev',
  },
};

const jsonLdBrand = {
  '@context': 'https://schema.org',
  '@type': 'Brand',
  name: 'Agento AI by WebCore Studio',
  alternateName: ['Agento AI', 'WebCore Studio Agento', 'OrderAgentAPP'],
  url: 'https://orderagentapp.webcorestudio.dev',
  logo: 'https://orderagentapp.webcorestudio.dev/logo.png',
  slogan: '24/7 Autonomous WhatsApp AI Staff & Business Operating System',
  description: 'Enterprise WhatsApp AI agents for clinics, hospitals, CA firms, salons, and retail commerce.',
};

const jsonLdWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Agento AI by WebCore Studio',
  alternateName: 'Agento AI',
  url: 'https://orderagentapp.webcorestudio.dev',
  publisher: {
    '@type': 'Organization',
    name: 'WebCore Studio',
    url: 'https://orderagentapp.webcorestudio.dev',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBrand) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
      </head>
      <body className="min-h-screen bg-base font-sans text-fg antialiased selection:bg-accent selection:text-accent-fg">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
