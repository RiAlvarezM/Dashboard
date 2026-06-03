import { NextResponse } from "next/server";
import { getPerfil } from "@/lib/data";
import { getAuthenticatedClient } from "@/app/api/lib";
import type { PerfilConfig } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(await getPerfil());
  } catch (error) {
    return NextResponse.json({ error: "Failed to load perfil" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json() as PerfilConfig;
    const supabase = getAuthenticatedClient(request);
    const { error } = await supabase.from("config").upsert({
      key: "perfil",
      value: data,
    });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to save perfil";
    console.error("Error saving perfil:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
