'use client'

import { useState } from 'react'
import { ServiceNameInput } from '../../../components/service-name-input'
import { PARTNER_CATEGORY_KEYS } from '../../../lib/partner-leads.mjs'
import { getIndustryLabel } from '../../../lib/public-locale.mjs'

// Only local, fictional editable text. No database, account, availability,
// booking, price inference or remote request is connected to this fixture.
export function ServiceSuggestionsPreview() {
  const [industry, setIndustry] = useState('beauty'), [locale, setLocale] = useState('bg'), [name, setName] = useState('')
  const en = locale === 'en'
  return <main className="business-onboarding" style={{ maxWidth: 720, margin: '24px auto', padding: 20 }}>
    <h1>{en ? 'Local QA · Service suggestions' : 'Локален QA · Предложения за услуги'}</h1>
    <p>{en ? 'Fictional local input only. No business, price, booking or account is changed.' : 'Само локално тестово поле. Няма промени по бизнеси, цени, резервации или профили.'}</p>
    <button type="button" className="secondary-button" onClick={() => setLocale(value => value === 'bg' ? 'en' : 'bg')}>BG / EN</button>
    <section className="wizard-card" style={{ marginTop: 20, padding: 20, minHeight: 480 }}>
      <div className="field"><label htmlFor="qa-service-industry">{en ? 'Business type' : 'Тип бизнес'}</label><select id="qa-service-industry" className="select-input" value={industry} onChange={event => setIndustry(event.target.value)}>{PARTNER_CATEGORY_KEYS.map(key => <option key={key} value={key}>{getIndustryLabel(key, locale)}</option>)}</select></div>
      <div className="service-name-field" style={{ marginTop: 20 }}><label htmlFor="qa-service-name">{en ? 'Service' : 'Услуга'}</label><ServiceNameInput id="qa-service-name" industry={industry} locale={locale} value={name} onChange={setName}/></div>
      <p role="status" style={{ marginTop: 320, overflowWrap: 'break-word' }}>{en ? 'Entered name' : 'Въведено име'}: <strong>{name || '—'}</strong></p>
    </section>
  </main>
}
