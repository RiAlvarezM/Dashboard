import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getAuthenticatedClient(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  const client = createClient(supabaseUrl, supabaseKey);
  if (token) {
    client.auth.setSession({ access_token: token, refresh_token: "" });
  }
  return client;
}
