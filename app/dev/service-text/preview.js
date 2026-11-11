'use client'

import { useState } from 'react'
import { DiscoveryBusinessCard } from '../../../components/discovery-business-card'
import { BusinessServiceList } from '../../../components/business-profile'
import { BusinessDirectory } from '../../../components/business-directory'
import { ServiceThumbnail } from '../../../components/service-thumbnail'
import { Icon } from '../../../components/icon'
import { profileServicePrice } from '../../../lib/business-profile-ui.mjs'

export const SERVICE_TEXT_NAMES = {
  bg: ['Детско подстригване за момчета', 'Подстригване на коса и брада и оформяне на вежди', 'Кола маска за уши и нос'],
  en: ["Children's haircut for boys", 'Haircut and beard trim with eyebrow shaping', 'Ear and nose waxing'],
}

// Deliberately fictional fixtures, not catalogue facts or booking inputs.
export function serviceTextFixture(locale = 'bg', stress = false) {
  const en = locale === 'en'
  const services = SERVICE_TEXT_NAMES[locale].map((name, index) => ({
    id: `qa-service-text-${index + 1}`, name, category: 'barber', currency: 'EUR',
    price: (stress ? [10.23, 29.9, 0] : [12, 35, 5])[index],
    priceKind: stress ? ['range', 'from', 'fixed'][index] : 'fixed',
    ...(stress && index === 0 ? { priceMaximum: 15.34 } : {}),
    ...(stress ? { priceUnit: en ? 'per visit · fictional QA price, not an offer' : 'посещение · измислена QA цена, не оферта' } : {}),
    duration_min: (stress ? [30, 75, 15] : [15, 35, 10])[index],
  }))
  if (stress) services.push({
    id: 'qa-service-text-unbroken', name: (en ? 'W' : 'С').repeat(256), category: 'barber',
    currency: 'EUR', price: 999999.99, priceKind: 'range', priceMaximum: 1234567.89,
    priceUnit: (en ? 'qualification' : 'условие').repeat(en ? 7 : 14), duration_min: 90,
  })
  return {
    id: 'qa-service-text-fictional-business', slug: 'qa-service-text-no-booking',
    name: en ? 'FICTIONAL QA · Barber studio' : 'ИЗМИСЛЕН QA · Бръснарско студио',
    source: 'gorez', industry: 'beauty', category: 'barber', businessCategory: 'barber',
    address: null, coordinates: null, photos: [], staff: [], staffServices: [], services,
    reviews: { summary: { count: 0 }, items: [] },
    details: { services, hours: [] },
  }
}

function StaticGuidedLayouts({ business, locale }) {
  const en = locale === 'en', first = business.services.find(service => service.id === 'qa-service-text-unbroken') || business.services[1]
  return <>
    <section data-service-text-surface="guided-menu" className="booking-card chat-card guided-chat-card">
      <h2>{en ? 'Guided menu · static layout only' : 'Меню на асистента · само статично оформление'}</h2>
      <p>{en ? 'These are production CSS selectors, not a running conversation or booking state.' : 'Това са CSS селекторите на приложението, не активен разговор или резервация.'}</p>
      <div className="chat-messages"><div className="chat-message assistant"><ul className="guided-service-menu">{business.services.map(service => <li key={service.id}>
        <span className="service-photo-name"><ServiceThumbnail service={service} business={business} locale={locale} size={36}/><span>{service.name}<small>{service.duration_min} {en ? 'min' : 'мин.'}</small></span></span>
        <b>{profileServicePrice(service, locale)}</b>
      </li>)}</ul></div></div>
    </section>
    <section data-service-text-surface="guided-options" className="booking-card guided-chat-card">
      <h2>{en ? 'Guided options · static layout only' : 'Избор в асистента · само статично оформление'}</h2>
      <div className="guided-option-list">{business.services.map(service => <button type="button" key={service.id} disabled>
        <span className="service-photo-name"><ServiceThumbnail service={service} business={business} locale={locale} size={36}/><span><strong>{service.name}</strong><small>{service.duration_min} {en ? 'minutes' : 'минути'}</small></span></span>
        <b>{profileServicePrice(service, locale)}</b>
      </button>)}</div>
    </section>
    <section data-service-text-surface="selected-summary" className="booking-card profile-redesign">
      <h2>{en ? 'Selected service · static layout only' : 'Избрана услуга · само статично оформление'}</h2>
      <div className="profile-booking-heading"><Icon name="calendar"/><div><h2>{en ? 'Book an appointment' : 'Резервирай час'}</h2><p className="service-photo-name"><ServiceThumbnail service={first} business={business} locale={locale} size={36}/><span><strong>{first.name}</strong> · {profileServicePrice(first, locale)}</span></p></div></div>
      <div className="booking-summary"><span className="service-photo-name"><ServiceThumbnail service={first} business={business} locale={locale} size={36}/><span><small>{en ? 'Fictional selected time' : 'Измислен избран час'}</small><strong>QA · 14:00</strong><small>{first.name} · QA</small></span></span><b>{profileServicePrice(first, locale)}</b></div>
      <div className="profile-selected-service"><span className="service-photo-name"><ServiceThumbnail service={first} business={business} locale={locale} size={36}/><strong>{first.name}</strong></span><span>{profileServicePrice(first, locale)}</span></div>
      <div className="guided-booking-summary"><span><small>{en ? 'Service' : 'Услуга'}</small><strong>{first.name}</strong></span><span><small>{en ? 'Fictional time' : 'Измислен час'}</small><strong>QA · 14:00</strong></span><span><small>{en ? 'Fictional specialist' : 'Измислен специалист'}</small><strong>QA</strong></span><span><small>{en ? 'Fictional client' : 'Измислен клиент'}</small><strong>QA</strong></span></div>
    </section>
  </>
}

export function ServiceTextPreview({ locale = 'bg', stress = false }) {
  const en = locale === 'en', business = serviceTextFixture(locale, stress)
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const cards = business.services.map((service, index) => ({
    ...business, id: `qa-service-text-card-${index + 1}`, slug: `qa-service-text-no-booking-${index + 1}`,
    services: [service], details: { services: business.services, hours: [] },
  }))
  return <main className="marketing-page customer-home" style={{ maxWidth: 1100, marginInline: 'auto', padding: 16 }}>
    <h1>{en ? 'LOCAL QA · Service text wrapping' : 'ЛОКАЛЕН QA · Пренасяне на имена на услуги'}</h1>
    <p role="note">{en ? 'All businesses, IDs and prices are fictional. Booking, calls, provider requests and notifications are disabled. Static guided/summary samples test CSS only.' : 'Всички бизнеси, ID и цени са измислени. Няма резервации, обаждания, външни заявки или известия. Статичните примери на асистента и обобщението проверяват само CSS.'}</p>
    <section data-service-text-surface="home" className="discovery-home home-discovery-section home-businesses">
      <h2>{en ? 'Actual home cards · open Details to inspect the full menu' : 'Истински компоненти на картите · отвори детайлите за цялото меню'}</h2>
      <ul className="home-discovery-rail" aria-label={en ? 'Fictional service text cards' : 'Измислени карти за проверка на текста'}>{cards.map(row => <li key={row.id}><DiscoveryBusinessCard row={row} locale={locale} preview/></li>)}</ul>
    </section>
    <section data-service-text-surface="profile" className="profile-redesign"><BusinessServiceList business={business} locale={locale} selectedServiceId={selectedServiceId} onChoose={setSelectedServiceId}/></section>
    <section data-service-text-surface="directory"><BusinessDirectory locale={locale} preview={{ businesses: [business], status: 'ready' }} showFilters={false} bookingDisabled/></section>
    <StaticGuidedLayouts business={business} locale={locale}/>
  </main>
}
