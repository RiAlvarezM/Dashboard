import { NextRequest, NextResponse } from "next/server";
import { getTarjetas, saveTarjetas } from "@/lib/data";
import type { TarjetasData } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(await getTarjetas());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json() as TarjetasData;
    await saveTarjetas(data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
