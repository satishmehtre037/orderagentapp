import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BizBot OS | Autonomous WhatsApp AI Commerce Platform',
  description: 'Self-serve WhatsApp AI commerce agent for bakeries, cafes, salons, gyms, and tuition centers.',
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
