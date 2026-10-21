import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Quora Bid Architect — AI Tender & RFP Studio',
    short_name: 'Quora Bid',
    description: 'Vertical AI Tender & RFP Architect with vector-indexed corporate vault, compliance cross-referencing, and automated proposal drafting.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F1F1F1',
    theme_color: '#F1F1F1',
    orientation: 'any',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/api/pwa-icon?size=192',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/api/pwa-icon?size=512',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/api/pwa-icon?size=512&maskable=true',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
