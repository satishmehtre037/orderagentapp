import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BizBot OS | WhatsApp AI Agent for Local Businesses',
  description: 'Self-serve WhatsApp AI Agent platform for bakeries, salons, and tuition centers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink min-h-screen antialiased selection:bg-teal-light selection:text-teal">
        {children}
      </body>
    </html>
  );
}
