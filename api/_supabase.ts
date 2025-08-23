// Server-only Supabase client
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE!; // service role (server secret)

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env vars");
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});