import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    // Password recovery uses an isolated, in-memory client. An email callback
    // must not silently log the owner into the dashboard before choosing a password.
    auth: { detectSessionInUrl: (url, params) => url.pathname !== '/reset-password' && Boolean(params.access_token || params.error || params.error_description || params.error_code) },
  }
)

// A password check for a destructive action must not replace the app's saved
// session or store a second refresh token in the browser.
export function createReauthenticationClient() {
  return createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'gorez-account-reauth' },
  })
}
