import { NextRequest, NextResponse } from "next/server";
import { getTarjetas } from "@/lib/data";
import { getAuthenticatedClient } from "@/app/api/lib";
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
    const supabase = getAuthenticatedClient(req);
    const { error } = await supabase.from("config").upsert({
      key: "tarjetas",
      value: data,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Error saving tarjetas:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
