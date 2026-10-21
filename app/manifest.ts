import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/', name: 'Bidcraft — AI Tender & Proposal Workspace', short_name: 'Bidcraft',
    description: 'Make every bid count. Evidence, compliance, and proposal drafts in one workspace.',
    start_url: '/#workspace', scope: '/', display: 'standalone', background_color: '#F8F6EF', theme_color: '#101714',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
