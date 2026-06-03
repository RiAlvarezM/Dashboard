import { NextRequest, NextResponse } from "next/server";
import { getCuentas, saveCuentas, getPropiedades } from "@/lib/data";
import { calcularAutomoviles } from "@/lib/calculations";
import type { Cuenta } from "@/types";

export async function GET() {
  try {
    const cuentas = await getCuentas();
    const propiedades = await getPropiedades();
    const automoviles = calcularAutomoviles();
    return NextResponse.json({ cuentas, propiedades, automoviles });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cuentas = await req.json() as Cuenta[];
    await saveCuentas(cuentas);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
