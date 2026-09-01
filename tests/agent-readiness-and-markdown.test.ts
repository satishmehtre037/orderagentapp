import { describe, it, expect } from 'vitest';
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

describe('Is Agentic Readiness & acceptmarkdown.com Standards', () => {
  describe('Markdown Content Negotiation via Middleware', () => {
    it('should serve text/markdown with Vary: Accept, Accept-Encoding for homepage', async () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: {
          accept: 'text/markdown',
        },
      });

      const res = await middleware(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/markdown');
      expect(res.headers.get('vary')).toContain('Accept');
      const body = await res.text();
      expect(body).toContain('# Agento AI');
      expect(body).toContain('Hospital & Clinic OPD Automation');
    });

    it('should serve text/markdown for /about and /api-docs', async () => {
      const reqAbout = new NextRequest('http://localhost:3000/about', {
        headers: { accept: 'text/markdown' },
      });
      const resAbout = await middleware(reqAbout);
      expect(resAbout.status).toBe(200);
      expect(resAbout.headers.get('content-type')).toContain('text/markdown');
      expect(resAbout.headers.get('vary')).toContain('Accept');
      const bodyAbout = await resAbout.text();
      expect(bodyAbout).toContain('WebCore Studio');

      const reqDocs = new NextRequest('http://localhost:3000/api-docs', {
        headers: { accept: 'text/markdown' },
      });
      const resDocs = await middleware(reqDocs);
      expect(resDocs.status).toBe(200);
      expect(resDocs.headers.get('content-type')).toContain('text/markdown');
      expect(resDocs.headers.get('vary')).toContain('Accept');
    });

    it('should return real HTTP 404 with recovery markdown for nonexistent paths requesting markdown', async () => {
      const req404 = new NextRequest('http://localhost:3000/random-nonexistent-path-1234', {
        headers: { accept: 'text/markdown' },
      });
      const res404 = await middleware(req404);
      expect(res404.status).toBe(404);
      expect(res404.headers.get('content-type')).toContain('text/markdown');
      expect(res404.headers.get('vary')).toContain('Accept');
      const body404 = await res404.text();
      expect(body404).toContain('404 — Resource Not Found');
      expect(body404).toContain('Recovery Directory');
    });
  });

  describe('Machine-Readable Discovery Files', () => {
    it('should have a valid public/llms.txt with When To Use section', () => {
      const llmsPath = path.join(process.cwd(), 'public', 'llms.txt');
      expect(fs.existsSync(llmsPath)).toBe(true);
      const content = fs.readFileSync(llmsPath, 'utf-8');
      expect(content).toContain('## When To Use This');
      expect(content).toContain('Agento AI');
      expect(content).toContain('WebCore Studio');
    });

    it('should have a valid public/openapi.json schema', () => {
      const openApiPath = path.join(process.cwd(), 'public', 'openapi.json');
      expect(fs.existsSync(openApiPath)).toBe(true);
      const json = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
      expect(json.openapi).toBe('3.1.0');
      expect(json.info.title).toContain('Agento AI');
      expect(json.paths['/api/webhook']).toBeDefined();
      expect(json.paths['/api/hospital/appointments']).toBeDefined();
    });

    it('should have valid sitemap.xml and robots.txt', () => {
      const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
      expect(fs.existsSync(sitemapPath)).toBe(true);
      const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
      expect(sitemapContent).toContain('https://orderagentapp.webcorestudio.dev/');
      expect(sitemapContent).toContain('https://orderagentapp.webcorestudio.dev/about');

      const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
      expect(fs.existsSync(robotsPath)).toBe(true);
      const robotsContent = fs.readFileSync(robotsPath, 'utf-8');
      expect(robotsContent).toContain('GPTBot');
      expect(robotsContent).toContain('ClaudeBot');
      expect(robotsContent).toContain('Sitemap: https://orderagentapp.webcorestudio.dev/sitemap.xml');
    });
  });
});
