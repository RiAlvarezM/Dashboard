import { NextResponse } from "next/server";
import { getVehiculos } from "@/lib/data";
import { getAuthenticatedClient } from "@/app/api/lib";
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
    const supabase = getAuthenticatedClient(request);
    const { error } = await supabase.from("config").upsert({
      key: "vehiculos",
      value: data,
    });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to save vehiculos";
    console.error("Error saving vehiculos:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
