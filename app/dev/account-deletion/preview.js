'use client'

import { useState } from 'react'
import { AccountDeletionPanel } from '../../../components/account-deletion-panel'
import { LanguageSwitch } from '../../../components/language-switch'

const account = { email: 'qa@example.com', businesses: [{ id: 'local-qa', name: 'QA Barber', slug: 'qa-barber' }, { id: 'local-qa-2', name: 'QA Garage', slug: 'qa-garage' }], upcomingBookings: 3 }

export default function AccountDeletionPreview() {
  const [locale, setLocale] = useState('bg')
  const [result, setResult] = useState('')
  return <main className="booking-setup-preview"><LanguageSwitch locale={locale} onChange={setLocale} compact /><p>Local QA only — fictional data. No authentication, network requests or real deletions.</p><AccountDeletionPanel businessId="local-qa" locale={locale} loadAccount={async () => account} deleteAccount={async ({ password }) => { if (password !== 'qa-test-password') throw { code: 'REAUTH_FAILED' } }} onDeleted={async () => setResult('QA deletion completed — no real data changed')} onExport={() => setResult('QA export selected')} /><p role="status">{result}</p></main>
}
