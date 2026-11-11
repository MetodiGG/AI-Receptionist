'use client'

import { useState } from 'react'
import { BusinessPhotoGallery } from './business-photo-gallery'
import { Icon } from './icon'
import { businessDirectionsUrl, businessMapUrl, businessWeeklyHours, groupBusinessServices, publicProfileDetails } from '../lib/business-profile.mjs'
import { getStaffPhoto } from '../lib/business-photos.mjs'
import { BusinessCoverPhoto } from './business-cover-photo'
import { ServiceThumbnail } from './service-thumbnail'
import { profileServicePrice, profileShareUrl, shareProfileLink } from '../lib/business-profile-ui.mjs'
import { servicePresentation } from '../lib/discovery/service-presentation.mjs'

// The same folded map and action class used by the homepage business cards.
export function BusinessDirectionsLink({ business, locale = 'bg', address = false }) {
  const href = businessDirectionsUrl(business)
  if (!href) return null
  const label = locale === 'en' ? 'Get directions' : 'Как да стигна'
  return <a className={address ? 'business-profile-address profile-address-link' : 'home-directions profile-directions'} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} · ${address ? business.address : business.name}`}>
    <span className="profile-map-icon"><Icon name="map" /></span><span>{address ? business.address : label}</span>
  </a>
}

export function BusinessProfileHeader({ business, locale }) {
  const en = locale === 'en'
  const [shared, setShared] = useState(false)
  const [manualShare, setManualShare] = useState('')
  async function share() {
    const url = profileShareUrl(business.slug, locale)
    const result = await shareProfileLink({ title: business.name, url }, navigator)
    if (result === 'copied') { setShared(true); setManualShare('') }
    else if (result === 'manual') setManualShare(url)
  }
  return <section className="business-profile-hero" aria-labelledby="business-profile-name">
    <BusinessPhotoGallery photos={business.photos} businessName={business.name} locale={locale} key={business.id}
      fallback={<BusinessCoverPhoto business={business} locale={locale} className="business-profile-no-photo" eager/>}/>
    <div className="business-profile-identity">
      <div className="business-profile-name-row"><h1 id="business-profile-name">{business.name}</h1><button type="button" className="profile-share-button" aria-label={shared ? (en ? 'Link copied' : 'Линкът е копиран') : (en ? 'Share' : 'Сподели')} onClick={share}><Icon name="external" /><span role="status">{shared ? (en ? 'Copied' : 'Копирано') : (en ? 'Share' : 'Сподели')}</span></button></div>
      {business.address && <BusinessDirectionsLink business={business} locale={locale} address/>}
      {manualShare && <label className="profile-share-fallback"><span>{en ? 'Copy this link' : 'Копирай този линк'}</span><input readOnly value={manualShare} onFocus={event => event.currentTarget.select()}/></label>}
    </div>
  </section>
}

export function BusinessServiceList({ business, locale = 'bg', selectedServiceId = '', onChoose, disabled = false }) {
  const en = locale === 'en'
  return <section className="profile-services business-profile-section" id="business-services" aria-labelledby="business-services-heading">
    <h2 id="business-services-heading">{en ? 'Services' : 'Услуги'}</h2>
    <div className="profile-service-groups">{groupBusinessServices(business.services, locale).map(group => <div className="profile-service-group" key={group.name}>
      {group.name !== (en ? 'Services' : 'Услуги') && <h3>{group.name}</h3>}
      <ul className="profile-service-list">{group.services.map(service => { const { description, conditions } = servicePresentation(service, locale); return <li key={service.id} className={`profile-service-row${selectedServiceId === service.id ? ' is-selected' : ''}`}>
        <ServiceThumbnail service={service} business={business} locale={locale} size={60}/>
        <div className="profile-service-copy"><strong>{service.name}</strong>{Number(service.duration_min) > 0 && <span>{service.duration_min} {en ? 'min' : 'мин'}</span>}{(description || conditions.length > 0) && <details className="profile-service-description"><summary>{en ? 'Details' : 'Детайли'}</summary><p>{[...conditions, description].filter(Boolean).join('\n')}</p></details>}</div>
        <div className="profile-service-actions"><strong className="profile-service-price">{profileServicePrice(service, locale)}</strong><button className="profile-service-book" type="button" disabled={disabled} onClick={() => onChoose(service.id)} aria-label={`${en ? 'Book' : 'Резервирай'} · ${service.name}`} aria-pressed={selectedServiceId === service.id} aria-controls="booking-experience"><Icon name="calendar"/></button></div>
      </li>})}</ul>
    </div>)}</div>
    {!business.services?.length && <p className="profile-empty-services">{en ? 'Contact the business for its services.' : 'Свържи се с бизнеса за предлаганите услуги.'}</p>}
  </section>
}

export function BusinessProfileInformation({ business, locale }) {
  const en = locale === 'en', profile = publicProfileDetails(business), hours = businessWeeklyHours(business)
  const description = profile.description[locale] || profile.description[en ? 'bg' : 'en']
  const [mapLoaded, setMapLoaded] = useState(false)
  const map = businessMapUrl(business)
  const weekdays = en ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] : ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя']
  const paymentNames = { cash: en ? 'Cash' : 'В брой', card: en ? 'Card' : 'С карта', bank: en ? 'Bank transfer' : 'Банков превод' }
  return <div className="business-profile-information">
    {business.staff?.length > 0 && <section className="business-profile-section" id="business-team" aria-labelledby="business-team-heading"><h2 id="business-team-heading">{en ? 'Our team' : 'Нашият екип'}</h2><div className="business-team-list">{business.staff.map(person => { const photo = getStaffPhoto(business, person.id); return <article key={person.id}>{photo ? <img className="business-team-photo" src={photo.src} alt={person.name} width="56" height="56" loading="lazy"/> : <span className="business-team-initial" aria-hidden="true">{person.name.slice(0, 1).toUpperCase()}</span>}<div><h3>{person.name}</h3>{person.bio && <p>{person.bio}</p>}</div></article> })}</div></section>}
    <section className="business-profile-section profile-contacts" id="business-location" aria-labelledby="business-location-heading">
      <h2 id="business-location-heading">{en ? 'Address & contacts' : 'Адрес и контакти'}</h2>
      {description && <p className="business-about-description">{description}</p>}
      {business.address && <BusinessDirectionsLink business={business} locale={locale} address/>}
      <div className="business-contact-links">{business.phone && <a href={`tel:${business.phone}`}><Icon name="phone" />{business.phone}</a>}{business.website_url && /^https?:\/\//i.test(business.website_url) && <a href={business.website_url} target="_blank" rel="noopener noreferrer"><Icon name="external" />{en ? 'Business website' : 'Сайт на бизнеса'}</a>}</div>
      {(business.opening_hours?.length === 7 || hours.some(day => day.periods.length)) && <details className="business-weekly-hours profile-hours"><summary><Icon name="clock"/><span>{en ? 'Working hours' : 'Работно време'}</span><Icon name="chevronDown"/></summary><dl>{hours.map(day => <div key={day.weekday}><dt>{weekdays[day.weekday - 1]}</dt><dd>{day.periods.length ? day.periods.map(period => <span key={period}>{period}</span>) : (en ? 'Closed' : 'Почивен ден')}</dd></div>)}</dl></details>}
      {profile.payments.length > 0 && <div className="business-payment-methods"><h3>{en ? 'Payment methods' : 'Начини на плащане'}</h3><div>{[...new Set(profile.payments)].map(method => <span key={method}>{paymentNames[method]}</span>)}</div></div>}
      {profile.brands.length > 0 && <div className="profile-contact-brands"><h3>{en ? 'Brands' : 'Марки'}</h3><p>{[...new Set(profile.brands)].join(' · ')}</p></div>}
      <div className="business-location-actions"><BusinessDirectionsLink business={business} locale={locale}/>{map && !mapLoaded && <button type="button" className="profile-map-toggle" onClick={() => setMapLoaded(true)}><Icon name="map"/>{en ? 'Show map' : 'Покажи карта'}</button>}</div>
      {mapLoaded ? <iframe className="profile-map-frame" title={en ? `Map: ${business.name}` : `Карта: ${business.name}`} src={map} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /> : null}
    </section>
  </div>
}
