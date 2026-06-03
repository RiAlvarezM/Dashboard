import { NextResponse } from "next/server";
import { getPrestamos, savePrestamos } from "@/lib/data";
import type { PrestamosData } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(await getPrestamos());
  } catch (error) {
    return NextResponse.json({ error: "Failed to load prestamos" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json() as PrestamosData;
    await savePrestamos(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update prestamos" }, { status: 500 });
  }
}
