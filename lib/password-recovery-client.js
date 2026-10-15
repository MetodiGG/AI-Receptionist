import { createClient } from '@supabase/supabase-js'
import { initializePasswordRecovery } from './password-recovery.mjs'

let recovery

export function getPasswordRecovery() {
  if (typeof window === 'undefined') throw new Error('Browser required')
  if (!recovery) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const replaceUrl = (path) => window.history.replaceState(window.history.state, '', path)
    if (!url || !key) {
      recovery = { auth: null, ready: initializePasswordRecovery({ setSession: async () => ({ error: true }) }, window.location.href, replaceUrl) }
      return recovery
    }
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'gorez-password-recovery' },
    })
    // Cache the initialization promise as well: Strict Mode and rerenders must
    // not consume the same callback twice after its tokens have been removed.
    recovery = { auth: client.auth, ready: initializePasswordRecovery(client.auth, window.location.href, replaceUrl) }
  }
  return recovery
}
