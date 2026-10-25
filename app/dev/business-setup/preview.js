'use client'

import { useState } from 'react'
import { BusinessSetup } from '../../../components/business-setup'
import { LanguageSwitch } from '../../../components/language-switch'

export default function SetupPreview() {
  const [locale, setLocale] = useState('bg')
  const [result, setResult] = useState(null)
  return <main className="booking-setup-preview business-onboarding"><LanguageSwitch locale={locale} onChange={setLocale} compact /><p>{locale === 'en' ? 'Local QA only. Submitting does not create a business.' : 'Само локална проверка. Завършването не създава бизнес.'}</p><BusinessSetup application session={{ user: { id: 'local-qa', email: 'qa@example.com' } }} locale={locale} onComplete={setResult} preview />{result && <pre className="setup-preview-result">{JSON.stringify(result, null, 2)}</pre>}</main>
}
