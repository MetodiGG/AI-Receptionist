'use client'

import { publicProse, businessDisplayAddress } from '../lib/locale/public-content.mjs'
import { useState } from 'react'
import { BusinessPhotoGallery } from './business-photo-gallery'
import { Icon } from './icon'
import { businessDirectionsUrl, businessMapUrl, businessWeeklyHours, groupBusinessServices, publicProfileDetails, businessLocationAttribution } from '../lib/business-profile.mjs'
import { getStaffPhoto } from '../lib/business-photos.mjs'
import { BusinessCoverPhoto } from './business-cover-photo'
import { renderServicePriceGrid } from './public-service-menu'
import { profileServicePrice, profileShareUrl, shareProfileLink } from '../lib/business-profile-ui.mjs'
import { PublicAction } from './public-action'

// The same folded map and action class used by the homepage business cards.
export function BusinessDirectionsLink({ business, locale = 'bg', address = false }) {
  const href = businessDirectionsUrl(business)
  const pending = locale === 'en' ? 'Location is being verified' : 'Локацията се уточнява'
  const label = locale === 'en' ? 'Directions' : 'Упътване'
  const accessibleLabel = locale === 'en' ? 'Get directions' : 'Упътване — как да стигна'
  if (!href && !business.address) return null
  if (address) {
    const addressText = businessDisplayAddress(business, locale), Address = href ? 'a' : 'span'
    const link = href ? { href, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `${accessibleLabel} · ${addressText}` } : { title: pending }
    return <Address className="business-profile-address profile-address-link" {...link}><span className="profile-map-icon"><Icon name="map" /></span><span>{addressText}</span></Address>
  }
  return href
    ? <PublicAction as="a" variant="secondary" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${accessibleLabel} · ${business.name}`}>{label}</PublicAction>
    : <PublicAction as="span" variant="secondary" role="link" aria-disabled="true" aria-label={`${label} · ${pending}`} title={pending}>{label}</PublicAction>
}

export function BusinessProfileHeader({ business, locale, shareUrl }) {
  const en = locale === 'en'
  const [shared, setShared] = useState(false)
  const [manualShare, setManualShare] = useState('')
  async function share() {
    const url = shareUrl || profileShareUrl(business.slug, locale)
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
    <h2 id="business-services-heading">{en ? 'Services & Prices' : 'Услуги и цени'}</h2>
    <div className="profile-service-groups">{groupBusinessServices(business.services, locale).map(group => <div className="profile-service-group" key={group.name}>
      {group.name !== (en ? 'Services' : 'Услуги') && <h3>{group.name}</h3>}
      {renderServicePriceGrid({ services: group.services, business, locale, selectedServiceId, profilePrice: profileServicePrice,
        renderBooking: (service, name) => <PublicAction iconOnly type="button" disabled={disabled} onClick={() => onChoose(service.id)} aria-label={`${en ? 'Book' : 'Резервирай'} · ${name}`} aria-pressed={selectedServiceId === service.id} aria-controls="booking-experience">{en ? 'Book' : 'Резервирай'}</PublicAction>,
      })}
    </div>)}</div>
    {!business.services?.length && <p className="profile-empty-services">{en ? 'Contact the business for its services.' : 'Свържи се с бизнеса за предлаганите услуги.'}</p>}
  </section>
}

export function BusinessProfileInformation({ business, locale }) {
  const en = locale === 'en', profile = publicProfileDetails(business), hours = businessWeeklyHours(business)
  const description = publicProse(profile.description, locale, business.presentationEn?.description)
  const [mapLoaded, setMapLoaded] = useState(false)
  const map = businessMapUrl(business), locationCredit = businessLocationAttribution(business)
  const weekdays = en ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] : ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя']
  const paymentNames = { cash: en ? 'Cash' : 'В брой', card: en ? 'Card' : 'С карта', bank: en ? 'Bank transfer' : 'Банков превод' }
  return <div className="business-profile-information">
    {business.staff?.length > 0 && <section className="business-profile-section" id="business-team" aria-labelledby="business-team-heading"><h2 id="business-team-heading">{en ? 'Our team' : 'Нашият екип'}</h2><div className="business-team-list">{business.staff.map(person => { const photo = getStaffPhoto(business, person.id); return <article key={person.id}>{photo ? <img className="business-team-photo" src={photo.src} alt={person.name} width="56" height="56" loading="lazy"/> : <span className="business-team-initial" aria-hidden="true">{person.name.slice(0, 1).toUpperCase()}</span>}<div><h3>{person.name}</h3>{person.bio && <p>{publicProse(person.bio, locale, person.bioEn)}</p>}</div></article> })}</div></section>}
    <section className="business-profile-section profile-contacts" id="business-location" aria-labelledby="business-location-heading">
      <h2 id="business-location-heading">{en ? 'Address & contacts' : 'Адрес и контакти'}</h2>
      {description && <p className="business-about-description">{description}</p>}
      {business.address && <BusinessDirectionsLink business={business} locale={locale} address/>}
      <div className="business-contact-links">{business.phone && <a href={`tel:${business.phone}`}><Icon name="phone" />{business.phone}</a>}{business.website_url && /^https?:\/\//i.test(business.website_url) && <a href={business.website_url} target="_blank" rel="noopener noreferrer"><Icon name="external" />{en ? 'Business website' : 'Сайт на бизнеса'}</a>}</div>
      {(business.opening_hours?.length === 7 || hours.some(day => day.periods.length)) && <details className="business-weekly-hours profile-hours"><summary><Icon name="clock"/><span>{en ? 'Working hours' : 'Работно време'}</span><Icon name="chevronDown"/></summary><dl>{hours.map(day => <div key={day.weekday}><dt>{weekdays[day.weekday - 1]}</dt><dd>{day.periods.length ? day.periods.map(period => <span key={period}>{period}</span>) : (en ? 'Closed' : 'Почивен ден')}</dd></div>)}</dl></details>}
      {profile.payments.length > 0 && <div className="business-payment-methods"><h3>{en ? 'Payment methods' : 'Начини на плащане'}</h3><div>{[...new Set(profile.payments)].map(method => <span key={method}>{paymentNames[method]}</span>)}</div></div>}
      {profile.brands.length > 0 && <div className="profile-contact-brands"><h3>{en ? 'Brands' : 'Марки'}</h3><p>{[...new Set(profile.brands)].join(' · ')}</p></div>}
      <div className="business-location-actions"><BusinessDirectionsLink business={business} locale={locale}/>{map && !mapLoaded && <button type="button" className="profile-map-toggle" onClick={() => setMapLoaded(true)}><Icon name="map"/>{en ? 'Show map' : 'Покажи карта'}</button>}</div>
      {locationCredit && <p className="site-location-credit"><a href={locationCredit.licenceUrl} target="_blank" rel="noopener noreferrer">{locationCredit.label} · ODbL</a><span aria-hidden="true"> · </span><a href={locationCredit.sourceUrl} target="_blank" rel="noopener noreferrer">{en ? 'Location source' : 'Източник на локацията'}</a></p>}
      {mapLoaded && map ? <iframe className="profile-map-frame" title={en ? `Map: ${business.name}` : `Карта: ${business.name}`} src={map} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /> : null}
    </section>
  </div>
}
