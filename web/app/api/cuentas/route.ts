import { NextRequest, NextResponse } from "next/server";
import { getCuentas, getPropiedades } from "@/lib/data";
import { getAuthenticatedClient } from "@/app/api/lib";
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
    console.log("Saving cuentas...", cuentas.length);
    const supabase = getAuthenticatedClient(req);
    const { error } = await supabase.from("config").upsert({
      key: "cuentas",
      value: cuentas,
    });
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    console.log("Cuentas saved successfully");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("ERROR in PUT /api/cuentas:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
