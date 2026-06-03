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
    console.log("Saving puntos config:", JSON.stringify(data).slice(0, 200));
    await savePuntosConfig(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Error saving puntos config:", errorMsg, error);
    return NextResponse.json({
      error: errorMsg
    }, { status: 500 });
  }
}
