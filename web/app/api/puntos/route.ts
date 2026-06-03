import { NextRequest, NextResponse } from "next/server";
import { getPuntos, appendPuntosRecord } from "@/lib/data";
import type { PuntosRecord } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(await getPuntos());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const record = await req.json() as PuntosRecord;
    await appendPuntosRecord(record);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
