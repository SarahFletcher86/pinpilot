// api/_supabase.ts
import { createClient } from '@supabase/supabase-js'

export function admin() {
  const url = process.env.SUPABASE_URL as string
  const key = process.env.SUPABASE_SERVICE_ROLE as string
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE')
  return createClient(url, key, { auth: { persistSession: false } })
}