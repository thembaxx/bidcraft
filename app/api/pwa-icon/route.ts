import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const size = parseInt(searchParams.get('size') || '512', 10);
  const maskable = searchParams.get('maskable') === 'true';

  const rx = maskable ? 0 : Math.round(size * 0.23);
  const scale = maskable ? 0.82 : 1;
  const offset = maskable ? Math.round((size * (1 - scale)) / 2) : 0;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
    <defs>
      <radialGradient id="coreGlow" cx="50%" cy="42%" r="58%">
        <stop offset="0%" stop-color="#309F92" stop-opacity="0.38" />
        <stop offset="55%" stop-color="#1A2623" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#0D0F0E" stop-opacity="1" />
      </radialGradient>
      <linearGradient id="goldFacet" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#EDFF8C" />
        <stop offset="52%" stop-color="#309F92" />
        <stop offset="100%" stop-color="#185C54" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="${rx}" fill="#0D0F0E" />
    <g transform="translate(${offset}, ${offset}) scale(${scale})">
      <circle cx="256" cy="256" r="176" fill="none" stroke="#309F92" stroke-width="3" stroke-dasharray="8 6" opacity="0.65" />
      <polygon points="256,88 378,158 378,354 256,424 134,354 134,158" fill="#121A18" stroke="url(#goldFacet)" stroke-width="6" stroke-linejoin="round" />
      <polygon points="256,88 378,158 256,256" fill="#309F92" fill-opacity="0.32" stroke="#EDFF8C" stroke-width="2.5" />
      <polygon points="134,158 256,88 256,256" fill="#EDFF8C" fill-opacity="0.28" stroke="#EDFF8C" stroke-width="2.5" />
      <circle cx="206" cy="206" r="10" fill="#FFFFFF" />
      <circle cx="256" cy="206" r="10" fill="#FFFFFF" />
      <circle cx="306" cy="206" r="12" fill="#EDFF8C" />
      <circle cx="206" cy="256" r="10" fill="#FFFFFF" />
      <circle cx="256" cy="256" r="18" fill="#EDFF8C" stroke="#0D0F0E" stroke-width="4" />
      <circle cx="306" cy="256" r="10" fill="#FFFFFF" />
      <circle cx="206" cy="306" r="10" fill="#FFFFFF" />
      <circle cx="256" cy="306" r="10" fill="#FFFFFF" />
      <circle cx="306" cy="306" r="10" fill="#309F92" />
    </g>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
