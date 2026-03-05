import { type NextRequest, NextResponse } from 'next/server';

const STATUS_URL = process.env.OPENCLAW_STATUS_URL ?? 'https://stage.yldm.tech/status';

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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'unavailable', detail: msg, url: STATUS_URL }, { status: 503 });
  }
}
