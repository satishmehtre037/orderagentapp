import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://orderagentapp.webcorestudio.dev';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/admin/'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'Google-Extended', 'PerplexityBot', 'anthropic-ai', 'cohere-ai'],
        allow: ['/', '/about', '/contact', '/privacy', '/terms', '/api-docs', '/llms.txt', '/llms-full.txt', '/openapi.json'],
        disallow: ['/dashboard/', '/api/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
