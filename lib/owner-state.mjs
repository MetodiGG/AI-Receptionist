// One controller per mounted dashboard layout, never a module-global private
// cache. Every database operation still uses the user's authenticated client/RLS.
export function createOwnerState({ client, configured = true, onChange, onSignedOut, now = Date.now }) {
  let state = { status: 'loading', session: null, business: null, error: '' }
  let active = true, version = 0, sessionVersion = 0, checkedAt = null
  const emit = next => { if (active) { state = next; onChange(next) } }
  const reset = session => { version++; sessionVersion++; checkedAt = null; emit({ status: 'loading', session, business: null, error: '' }) }
  return {
    isStale() { return checkedAt === null || now() - checkedAt >= 60000 },
    changeSession(session) {
      if (!active) return false
      if (!session || session.user.id !== state.session?.user.id) {
        reset(session)
        if (!session) onSignedOut()
        return Boolean(session)
      }
      sessionVersion++
      emit({ ...state, session })
      return false
    },
    async load() {
      if (!active) return
      const requestVersion = ++version
      if (!configured) { emit({ status: 'config', session: null, business: null, error: '' }); return }
      try {
        const { data, error: authError } = await client.auth.getSession()
        if (!active || requestVersion !== version) return
        if (authError) throw authError
        const session = data.session
        const authVersion = sessionVersion
        if (!session) { reset(null); onSignedOut(); return }
        if (session.user.id !== state.session?.user.id) emit({ status: 'loading', session, business: null, error: '' })
        const { data: business, error } = await client.from('businesses').select('*').eq('owner_id', session.user.id).order('created_at').limit(1).maybeSingle()
        if (!active || requestVersion !== version) return
        if (error) throw error
        checkedAt = now()
        // A token refresh may finish while the profile request is in flight.
        // Keep the newer session already delivered by the Auth listener.
        const latestSession = sessionVersion !== authVersion && state.session?.user.id === session.user.id ? state.session : session
        emit({ status: business ? 'ready' : 'setup', session: latestSession, business, error: '' })
      } catch (error) {
        if (active && requestVersion === version) emit({ ...state, status: 'error', business: null, error: error.message })
      }
    },
    dispose() { active = false; version++; state = { status: 'loading', session: null, business: null, error: '' } },
  }
}
