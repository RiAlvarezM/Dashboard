import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PuntosData } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getAuthenticatedClient(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  const client = createClient(supabaseUrl, supabaseKey);
  if (token) {
    client.auth.setSession({ access_token: token, refresh_token: "" });
  }
  return client;
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
    const supabase = getAuthenticatedClient(request);

    const { error } = await supabase.from("config").upsert({
      key: "puntos_config",
      value: data,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Error saving puntos config:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
