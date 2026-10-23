import { NextRequest, NextResponse } from "next/server";
import { parseFilters, searchIndex } from "@/lib/discovery/model";
import { getTreasuryIndex } from "@/lib/discovery/treasury";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  let filters;
  try {
    filters = parseFilters(request.nextUrl.searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid filters." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(searchIndex(await getTreasuryIndex(), filters), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "The official tender source is temporarily unavailable. Try again shortly. Your saved tenders are still available.",
      },
      { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "60" } },
    );
  }
}
