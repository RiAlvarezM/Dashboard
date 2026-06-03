import { NextResponse } from "next/server";
import { getPropiedades, savePropiedades } from "@/lib/data";
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
    await savePropiedades(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save propiedades" }, { status: 500 });
  }
}
