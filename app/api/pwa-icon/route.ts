import { NextRequest, NextResponse } from 'next/server';
export function GET(req: NextRequest) {
  const size = req.nextUrl.searchParams.get('size') || '512';
  if (!['32', '180', '192', '512'].includes(size)) return NextResponse.json({ error: 'Supported icon sizes: 32, 180, 192, 512.' }, { status: 400 });
  return NextResponse.redirect(new URL(`/brand/icon-${size}.png`, req.url));
}
