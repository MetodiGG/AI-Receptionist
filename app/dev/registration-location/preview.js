'use client'

import { useEffect, useState } from 'react'
import { BusinessLocationFields } from '../../../components/business-location-fields'
import { BusinessCoordinatesFields } from '../../../components/business-coordinates-fields'
import { businessAddress, businessLocationFields, findCity } from '../../../lib/business-location.mjs'
import { editOnboardingBusinessDraft } from '../../../lib/onboarding-catalogue-draft.mjs'
import { registrationLocationConfirmed, registrationLocationFingerprint } from '../../../lib/business-registration-location.mjs'

// The real registration panel, with local-only state. No accounts, uploads,
// backend actions, notifications or fake success confirmations are possible.
export function RegistrationLocationPreview({ locale }) {
  const en = locale === 'en'
  const [state,setState]=useState({business:{name:'LOCAL QA',city_ekatte:'68134',neighborhood:'',address:'',public_profile:{latitude:null,longitude:null}},importedFields:{}})
  const [confirmation,setConfirmation]=useState('')
  const business=state.business, fingerprint=registrationLocationFingerprint(business)
  const confirmed=registrationLocationConfirmed(business,confirmation)
  useEffect(()=>{setConfirmation('')},[fingerprint])
  const edit=patch=>setState(current=>editOnboardingBusinessDraft(current,patch))
  return <main className="marketing-page business-onboarding">
    <p className="discovery-notice discovery-test">{en?'LOCAL UI TEST · No business registration, calls, uploads or email sending.':'ЛОКАЛЕН UI ТЕСТ · Без регистрация, обаждания, качване на снимки или изпращане на имейли.'}</p>
    <div className="setup-layout compact-business-setup"><section className="wizard-card">
      <header className="wizard-head"><h1>{en?'Business location review':'Проверка на бизнес локация'}</h1></header>
      <div className="wizard-body"><div className="form-grid">
        <div className="field full"><BusinessLocationFields required cityCode={business.city_ekatte} neighborhood={business.neighborhood} onChange={edit} locale={locale}/></div>
        <label className="field full">{en?'Address':'Адрес'}<input className="text-input" value={business.address} onChange={event=>edit({address:event.target.value})}/></label>
        <BusinessCoordinatesFields required locale={locale} latitude={business.public_profile.latitude} longitude={business.public_profile.longitude} confirmed={confirmed}
          address={findCity(business.city_ekatte)?businessAddress({...business,...businessLocationFields(business.city_ekatte,business.neighborhood)},locale):''} onConfirm={checked=>setConfirmation(checked?fingerprint:'')}
          onChange={point=>edit({public_profile:{latitude:point.latitude===''||point.latitude==null?null:Number(point.latitude),longitude:point.longitude===''||point.longitude==null?null:Number(point.longitude)}})}/>
      </div></div>
      <footer className="wizard-actions"><p role="status">{confirmed?(en?'Local check ready':'Локалната проверка е готова'):(en?'A checked address and pin are required':'Необходими са проверен адрес и точка')}</p><button className="primary-button" type="button" disabled={!confirmed}>{en?'Continue · local only':'Продължи · само локално'}</button></footer>
    </section></div>
  </main>
}
