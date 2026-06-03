import { NextResponse } from "next/server";
import { getPerfil, savePerfil } from "@/lib/data";
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
    await savePerfil(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save perfil" }, { status: 500 });
  }
}
