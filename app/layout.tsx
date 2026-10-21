import type { Metadata, Viewport } from 'next';
import { Urbanist, JetBrains_Mono } from 'next/font/google';
import { getSiteUrl, site } from '@/lib/site';
import './globals.css';

const urbanist = Urbanist({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-urbanist', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-jetbrains', display: 'swap' });
const siteUrl = getSiteUrl();
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, viewportFit: 'cover', themeColor: '#101714' };
export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: siteUrl, alternates: { canonical: '/' } } : {}),
  title: { default: site.title, template: '%s — Bidcraft' },
  description: site.description,
  applicationName: site.name,
  manifest: '/manifest.webmanifest',
  keywords: ['tender management', 'RFP proposal software', 'AI bid writing', 'proposal compliance', 'proposal version control', 'Bidcraft'],
  appleWebApp: { capable: true, statusBarStyle: 'default', title: site.name },
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/brand/icon-32.png', sizes: '32x32', type: 'image/png' }], apple: '/brand/icon-180.png' },
  openGraph: { title: site.title, description: site.description, type: 'website', siteName: site.name, locale: 'en_GB', ...(siteUrl ? { url: siteUrl, images: [{ url: '/brand/social-card.png', width: 1200, height: 630, alt: 'Bidcraft — Make every bid count.' }] } : {}) },
  twitter: { card: 'summary_large_image', title: site.title, description: site.description, ...(siteUrl ? { images: ['/brand/social-card.png'] } : {}) },
  robots: { index: true, follow: true },
  category: 'business',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: site.name,
    applicationCategory: 'BusinessApplication', operatingSystem: 'Web', description: site.description,
    ...(siteUrl ? { url: siteUrl.href, image: new URL('/brand/social-card.png', siteUrl).href } : {}),
    featureList: ['South African tender discovery', 'Tender workspace', 'Evidence-backed AI proposal drafts', 'Clause comparison', 'Compliance review', 'Proposal version history', 'Local browser persistence'],
  };
  return <html lang="en" className={`${urbanist.variable} ${mono.variable}`} suppressHydrationWarning>
    <head>
      <link rel="alternate" type="text/plain" href="/llms.txt" title="Bidcraft information for AI readers" />
      <link rel="alternate" type="text/plain" href="/llm.txt" title="Bidcraft LLM context" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </head>
    <body className="min-h-dvh bg-[#F8F6EF] font-sans text-[#0D0F0E] antialiased selection:bg-[#DDFB82] selection:text-[#0D0F0E] dark:bg-[#0D0F0E] dark:text-[#F5F7F6]">
      <a href="#workspace" className="skip-link">Skip to workspace</a>
      {children}
    </body>
  </html>;
}
