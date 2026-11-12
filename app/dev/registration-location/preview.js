'use client'

import { useState } from 'react'
import { BusinessLocationFields } from '../../../components/business-location-fields'
import { findCity } from '../../../lib/business-location.mjs'

// Real address controls with local-only state. The automatic server location
// lookup is deliberately not invoked by this fixture; no registration occurs.
export function RegistrationLocationPreview({ locale }) {
  const en = locale === 'en'
  const [business,setBusiness]=useState({city_ekatte:'68134',neighborhood:'',address:''})
  const ready = Boolean(findCity(business.city_ekatte) && business.address.trim().length >= 2)
  const edit=patch=>setBusiness(current=>({...current,...patch}))
  return <main className="marketing-page business-onboarding">
    <p className="discovery-notice discovery-test">{en?'LOCAL UI TEST · No registration, geocoding, uploads or email sending.':'ЛОКАЛЕН UI ТЕСТ · Без регистрация, геокодиране, качване на снимки или изпращане на имейли.'}</p>
    <div className="setup-layout compact-business-setup"><section className="wizard-card">
      <header className="wizard-head"><h1>{en?'Business address':'Адрес на бизнеса'}</h1></header>
      <div className="wizard-body"><div className="form-grid">
        <div className="field full"><BusinessLocationFields required cityCode={business.city_ekatte} neighborhood={business.neighborhood} onChange={edit} locale={locale}/></div>
        <label className="field full">{en?'Street and number':'Улица и номер'} *<input className="text-input" required minLength={2} maxLength={250} autoComplete="street-address" placeholder={en?'e.g. Pirin 42':'напр. Пирин 42'} value={business.address} onChange={event=>edit({address:event.target.value})}/></label>
      </div></div>
      <footer className="wizard-actions"><p role="status">{en?'Local preview only — automatic location lookup is not run.':'Само локален преглед — автоматичното определяне на локацията не се изпълнява.'}</p><button className="primary-button" type="button" disabled={!ready}>{en?'Continue · local only':'Продължи · само локално'}</button></footer>
    </section></div>
  </main>
}
