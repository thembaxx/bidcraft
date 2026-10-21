import { NextResponse } from 'next/server';
import { getTreasuryDetail } from '@/lib/discovery/treasury';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d{0,9}$/.test(id)) return NextResponse.json({ error: 'Invalid tender reference.' }, { status: 400 });
  try {
    return NextResponse.json(await getTreasuryDetail(id), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'The official notice could not be loaded. Try again or open the source listing.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
