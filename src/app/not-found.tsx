import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home, BookOpen, Compass, Mail, ShieldAlert } from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui';

export const metadata = {
  title: '404 - Resource Not Found | Agento AI by WebCore Studio',
  description:
    'The requested URL does not exist on this server. Refer to our sitemap, llms.txt, or API documentation to locate the correct endpoint.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-base text-fg font-sans antialiased transition-colors duration-150 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-line sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-fg hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Agento AI" className="w-5 h-5 rounded-md object-contain" />
              <span className="text-xs font-semibold text-fg">Agento AI</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-8 w-full">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive mx-auto flex items-center justify-center border border-destructive/20 mb-4">
            <FileQuestion className="w-7 h-7" />
          </div>
          <span className="text-xs font-mono font-bold text-destructive uppercase tracking-wider">
            HTTP 404 — Not Found
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">
            Page or Endpoint Not Found
          </h1>
          <p className="text-sm text-fg-muted max-w-md mx-auto leading-relaxed">
            The resource you requested could not be located. If you are an AI crawler or automated agent, consult the recovery directory below.
          </p>
        </div>

        {/* Machine & Human Navigation Recovery Directory */}
        <Card className="border-line bg-surface">
          <CardHeader>
            <div className="flex items-center gap-2 text-accent">
              <Compass className="w-4 h-4" />
              <CardTitle className="text-sm font-bold">Agent & User Navigation Directory</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Direct access to all verified sitemaps, machine-readable specifications, and platform pages:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                href="/"
                className="p-3 rounded-lg border border-line bg-surface-subtle hover:border-accent transition-colors flex items-center gap-2.5"
              >
                <Home className="w-4 h-4 text-accent" />
                <div>
                  <div className="font-bold text-fg">Homepage</div>
                  <div className="text-[11px] text-fg-muted font-mono">/</div>
                </div>
              </Link>

              <a
                href="/llms.txt"
                className="p-3 rounded-lg border border-line bg-surface-subtle hover:border-accent transition-colors flex items-center gap-2.5"
              >
                <BookOpen className="w-4 h-4 text-accent" />
                <div>
                  <div className="font-bold text-fg">LLM Index</div>
                  <div className="text-[11px] text-fg-muted font-mono">/llms.txt</div>
                </div>
              </a>

              <a
                href="/sitemap.xml"
                className="p-3 rounded-lg border border-line bg-surface-subtle hover:border-accent transition-colors flex items-center gap-2.5"
              >
                <Compass className="w-4 h-4 text-accent" />
                <div>
                  <div className="font-bold text-fg">XML Sitemap</div>
                  <div className="text-[11px] text-fg-muted font-mono">/sitemap.xml</div>
                </div>
              </a>

              <Link
                href="/api-docs"
                className="p-3 rounded-lg border border-line bg-surface-subtle hover:border-accent transition-colors flex items-center gap-2.5"
              >
                <BookOpen className="w-4 h-4 text-accent" />
                <div>
                  <div className="font-bold text-fg">API Documentation</div>
                  <div className="text-[11px] text-fg-muted font-mono">/api-docs</div>
                </div>
              </Link>

              <Link
                href="/about"
                className="p-3 rounded-lg border border-line bg-surface-subtle hover:border-accent transition-colors flex items-center gap-2.5"
              >
                <ShieldAlert className="w-4 h-4 text-accent" />
                <div>
                  <div className="font-bold text-fg">About Us</div>
                  <div className="text-[11px] text-fg-muted font-mono">/about</div>
                </div>
              </Link>

              <Link
                href="/contact"
                className="p-3 rounded-lg border border-line bg-surface-subtle hover:border-accent transition-colors flex items-center gap-2.5"
              >
                <Mail className="w-4 h-4 text-accent" />
                <div>
                  <div className="font-bold text-fg">Support Helpdesk</div>
                  <div className="text-[11px] text-fg-muted font-mono">/contact</div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-6 text-center text-xs text-fg-muted">
        <p>&copy; {new Date().getFullYear()} WebCore Studio. All rights reserved.</p>
      </footer>
    </div>
  );
}
