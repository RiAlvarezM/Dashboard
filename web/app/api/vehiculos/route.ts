import { NextResponse } from "next/server";
import { getVehiculos, saveVehiculos } from "@/lib/data";
import type { Vehiculo } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(await getVehiculos());
  } catch (error) {
    return NextResponse.json({ error: "Failed to load vehiculos" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json() as Vehiculo[];
    await saveVehiculos(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save vehiculos" }, { status: 500 });
  }
}
