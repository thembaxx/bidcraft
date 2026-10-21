import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || 'https://quora-bid-architect.app';
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/llm.txt', '/llms.txt'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
