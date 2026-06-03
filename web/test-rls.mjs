import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8").split("\n");
let url = "", key = "";
for (const line of env) {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) url = line.split("=").slice(1).join("=").trim();
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) key = line.split("=").slice(1).join("=").trim();
}

const supabase = createClient(url, key);
const tables = ["networth", "cuentas", "flows", "puntos", "propiedades", "config"];

for (const table of tables) {
  const { data, error } = await supabase.from(table).select("*").limit(1);
  if (error) {
    console.log("FAIL " + table + ": " + error.code + " - " + error.message);
  } else {
    console.log("OK " + table + ": " + data.length + " rows");
  }
}
