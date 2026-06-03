import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8").split("\n");
let url = "";
let key = "";
for (const line of env) {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) url = line.split("=")[1].trim();
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) key = line.split("=")[1].trim();
}

console.log("URL:", url);
console.log("Key length:", key.length);

const supabase = createClient(url, key);

async function run() {
  try {
    const { data, error } = await supabase.from("config").select("*").limit(1);
    if (error) {
      console.error("Supabase error:", error);
    } else {
      console.log("Supabase connected! Data:", data);
    }
  } catch(e) {
    console.error("Caught error:", e);
  }
}

run();
