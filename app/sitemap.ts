import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  const url = getSiteUrl();
  if (!url) return [];
  return ['', '/about', '/tenders', '/today', '/legal', '/privacy', '/terms', '/data-sources', '/ai-disclosure'].map((path) => ({ url: new URL(path, url).href, changeFrequency: path === '/tenders' ? 'daily' : 'monthly', priority: path ? 0.7 : 1 }));
}
