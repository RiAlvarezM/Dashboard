import { NextRequest, NextResponse } from "next/server";
import { getBudget, saveBudget } from "@/lib/data";
import type { Budget } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(await getBudget());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const budget = await req.json() as Budget;
    await saveBudget(budget);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
