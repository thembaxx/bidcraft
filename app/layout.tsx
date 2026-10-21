import type { Metadata, Viewport } from 'next';
import { Urbanist, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-urbanist',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F1F1F1' },
    { media: '(prefers-color-scheme: dark)', color: '#0D0F0E' },
  ],
};

export const metadata: Metadata = {
  title: 'Quora Bid Architect — Vertical AI Tender & RFP Studio',
  description:
    'Win government and corporate tenders with AI compliance cross-referencing, vector-indexed corporate memory, Vision OCR, and proposal version control.',
  manifest: '/manifest.webmanifest',
  keywords: [
    'AI Tender Architect',
    'RFP Automation',
    'Bid Compliance Checker',
    'Proposal Version Control',
    'Vector Database RFP',
    'Document Comparison Tool',
    'Quora Bid Architect',
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Quora Bid',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/api/pwa-icon?size=192',
  },
  openGraph: {
    title: 'Quora Bid Architect — Vertical AI Tender & RFP Studio',
    description:
      'Win government and corporate tenders with AI compliance cross-referencing, vector-indexed corporate memory, Vision OCR, and proposal version control.',
    type: 'website',
    siteName: 'Quora Bid Architect',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quora Bid Architect — Vertical AI Tender & RFP Studio',
    description:
      'Win government and corporate tenders with AI compliance cross-referencing, vector-indexed corporate memory, Vision OCR, and proposal version control.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Quora Bid Architect',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android, Desktop PWA',
    description:
      'Vertical AI Tender & RFP Architect that ingests tender documents, cross-references past winning bids and legal certificates via vector embeddings, compares drafts side-by-side, and tracks full proposal version history.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'GBP',
    },
    featureList: [
      'AI Compliance Checking & Discrepancy Remediation',
      '50/50 Side-by-Side & Overlay Document Comparison Studio',
      'Immutable Proposal Version Control & Snapshot Restoration',
      'Vision OCR Scanned Tender Clause Extraction',
      'Vector Embeddings Corporate Memory Vault',
    ],
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${urbanist.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="alternate" type="text/plain" href="/llm.txt" title="LLM Context Specification" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-dvh bg-[#F1F1F1] text-[#0D0F0E] dark:bg-[#0D0F0E] dark:text-[#F5F7F6] font-sans antialiased selection:bg-[#EDFF8C] selection:text-[#0D0F0E] transition-colors duration-200"
      >
        {children}
      </body>
    </html>
  );
}
