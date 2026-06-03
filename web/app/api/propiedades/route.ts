import { NextResponse } from "next/server";
import { getPropiedades } from "@/lib/data";
import { getAuthenticatedClient } from "@/app/api/lib";
import type { Propiedad } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(await getPropiedades());
  } catch (error) {
    return NextResponse.json({ error: "Failed to load propiedades" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json() as Propiedad[];
    const supabase = getAuthenticatedClient(request);
    const { error } = await supabase.from("config").upsert({
      key: "propiedades",
      value: data,
    });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to save propiedades";
    console.error("Error saving propiedades:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
