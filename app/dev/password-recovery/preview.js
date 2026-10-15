'use client'

import { PasswordRecovery } from '../../../components/password-recovery'

// Local UI fixture only. No Supabase identity, credential or network change.
const initializeRecovery = () => ({ ready: Promise.resolve(true), auth: { updateUser: async () => ({ error: null }), signOut: async () => ({ error: null }) } })
const clearLogin = async () => {}

export default function PasswordRecoveryPreview() {
  return <><p role="note">LOCAL UI TEST ONLY — no account or real password is changed.</p><PasswordRecovery mode="reset" initializeRecovery={initializeRecovery} clearLogin={clearLogin} /></>
}
