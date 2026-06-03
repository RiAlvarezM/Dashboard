import { NextRequest, NextResponse } from "next/server";
import { getFlows, saveFlows } from "@/lib/data";
import type { Flow } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(await getFlows());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const flows = await req.json() as Flow[];
    await saveFlows(flows);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
