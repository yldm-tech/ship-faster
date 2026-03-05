import { type NextRequest, NextResponse } from 'next/server';

const STATUS_URL = process.env.OPENCLAW_STATUS_URL ?? 'https://stage.yldm.ai/status';

export const runtime = 'edge';
export const revalidate = 30;

export async function GET(_req: NextRequest) {
  try {
    const res = await fetch(STATUS_URL, {
      headers: { 'x-token': process.env.OPENCLAW_TOKEN ?? '' },
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
