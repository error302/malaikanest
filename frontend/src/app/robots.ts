import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-config';

const BASE_URL = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/admin/', '/cart', '/checkout', '/account', '/wishlist', '/login', '/register'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/admin/'],
      },
      // AI/LLM-friendly: explicitly grant access for all major bot crawlers used
      // by ChatGPT, Perplexity, Claude, Gemini, Copilot, etc.
      { userAgent: 'GPTBot',           allow: '/', disallow: ['/admin', '/admin/'] },
      { userAgent: 'PerplexityBot',    allow: '/', disallow: ['/admin', '/admin/'] },
      { userAgent: 'ClaudeBot',        allow: '/', disallow: ['/admin', '/admin/'] },
      { userAgent: 'Claude-Web',       allow: '/', disallow: ['/admin', '/admin/'] },
      { userAgent: 'Google-Extended',  allow: '/', disallow: ['/admin', '/admin/'] },
      { userAgent: 'CCBot',            allow: '/', disallow: ['/admin', '/admin/'] },
      { userAgent: 'Applebot-Extended',allow: '/', disallow: ['/admin', '/admin/'] },
      { userAgent: 'OAI-SearchBot',    allow: '/', disallow: ['/admin', '/admin/'] },
      { userAgent: 'cohere-ai',        allow: '/', disallow: ['/admin', '/admin/'] },
      { userAgent: 'DuckAssistBot',    allow: '/', disallow: ['/admin', '/admin/'] },
      { userAgent: 'Meta-ExternalAgent', allow: '/', disallow: ['/admin', '/admin/'] },
      { userAgent: 'anthropic-ai',     allow: '/', disallow: ['/admin', '/admin/'] },
      { userAgent: 'Bytespider',       allow: '/', disallow: ['/admin', '/admin/'] },
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/llms.txt`,
      `${BASE_URL}/llms-full.txt`,
    ],
    host: BASE_URL,
  };
}
