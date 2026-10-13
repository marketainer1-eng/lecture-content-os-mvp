import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const MEDIA_BUCKET = 'lecture-media'

// Lazily created so module import never throws during Next.js build
let _admin: SupabaseClient | null = null

function getAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    _admin = createClient(url, key)
  }
  return _admin
}

// Proxy so callers can use `supabaseAdmin.from(...)` without changes
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    const client = getAdmin()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (client as any)[prop]
    return typeof val === 'function' ? val.bind(client) : val
  },
})
