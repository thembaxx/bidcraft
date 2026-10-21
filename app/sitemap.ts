import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  const url = getSiteUrl();
  if (!url) return [];
  return ['', '/about'].map((path) => ({ url: new URL(path, url).href, changeFrequency: 'monthly', priority: path ? 0.7 : 1 }));
}
