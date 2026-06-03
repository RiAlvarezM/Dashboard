import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PuntosData } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  const options: any = {};
  if (token) {
    options.global = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  return createClient(supabaseUrl, supabaseKey, options);
}

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from("config").select("value").eq("key", "puntos_config").single();
    if (error && error.code !== "PGRST116") throw error;
    if (!data) return NextResponse.json({ categorias: [], grupos: [] });
    return NextResponse.json(data.value);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json() as PuntosData;
    const supabase = getClient(request);

    const { error } = await supabase.from("config").upsert(
      { key: "puntos_config", value: data },
      { onConflict: "key" }
    );

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`${error.message} (${error.code})`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("PUT error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
