import { NextResponse } from "next/server";
import { getPuntosConfig, savePuntosConfig } from "@/lib/data";
import type { PuntosData } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(await getPuntosConfig());
  } catch (error) {
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json() as PuntosData;
    await savePuntosConfig(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
  }
}
