import { NextRequest, NextResponse } from "next/server";
import { getNetWorthDB, appendNetWorthRecord, deleteNetWorthRecord } from "@/lib/data";
import type { NetWorthRecord } from "@/types";

export async function GET() {
  try {
    const data = await getNetWorthDB();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Pick<NetWorthRecord, "Fecha" | "Ahorro" | "Inversion" | "Jubilacion" | "Deuda" | "Prestamo">;
    await appendNetWorthRecord(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { fecha } = await req.json() as { fecha: string };
    await deleteNetWorthRecord(fecha);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
