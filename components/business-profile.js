'use client'

import { useState } from 'react'
import { BusinessPhotoGallery } from './business-photo-gallery'
import { Icon } from './icon'
import { ReviewSummary } from './business-reviews'
import { businessDirectionsUrl, businessMapUrl, businessWeeklyHours, publicProfileDetails } from '../lib/business-profile.mjs'
import { getIndustryLabel } from '../lib/public-locale.mjs'
import { getStaffPhoto } from '../lib/business-photos.mjs'
import { BusinessCategoryIcon } from './business-category-icon'
import { isExternalBooking } from '../lib/booking-mode.mjs'
import { OutboundBookingButton } from './outbound-booking-button'

export function BusinessProfileHeader({ business, locale, reviews, onBook,preview=false }) {
  const en = locale === 'en', directions = businessDirectionsUrl(business)
  const [shared, setShared] = useState(false)
  async function share() {
    const url = new URL(`/book/${business.slug}?lang=${locale}`, window.location.origin).href
    try {
      if (navigator.share) await navigator.share({ title: business.name, url })
      else { await navigator.clipboard.writeText(url); setShared(true) }
    } catch { /* A cancelled share does not interrupt booking. */ }
  }
  return <section className="business-profile-hero" aria-labelledby="business-profile-name">
    {business.photos?.length ? <BusinessPhotoGallery photos={business.photos} businessName={business.name} locale={locale} key={business.id} /> : <div className="business-profile-no-photo" aria-hidden="true"><BusinessCategoryIcon business={business} size={140}/></div>}
    <div className="business-profile-identity">
      <div><p className="booking-eyebrow">{getIndustryLabel(business.industry, locale)}</p><h1 id="business-profile-name">{business.name}</h1>
        {business.address && <p className="business-profile-address"><Icon name="pin" /><span>{business.address}</span></p>}
        <a className="business-profile-rating-link" href="#business-reviews"><ReviewSummary summary={reviews.data?.summary} status={reviews.status} locale={locale} compact /></a>
      </div>
      <div className="business-profile-actions">{isExternalBooking(business)?<OutboundBookingButton business={business} locale={locale} disabled={preview}/>:<a className="primary-button" href="#booking-experience" onClick={onBook}><Icon name="calendar" />{en ? 'Book an appointment' : 'Запази час'}</a>}
        <div>{directions && <a className="secondary-button" href={directions} target="_blank" rel="noopener noreferrer"><Icon name="pin" />{en ? 'Directions' : 'Как да стигна'}</a>}
          <button type="button" className="secondary-button" onClick={share}><Icon name="external" />{shared ? (en ? 'Link copied' : 'Линкът е копиран') : (en ? 'Share' : 'Сподели')}</button></div>
      </div>
    </div>
    <nav className="business-profile-nav" aria-label={en ? 'Business information' : 'Информация за бизнеса'}>
      <a href="#booking-experience" onClick={onBook}>{en ? 'Services' : 'Услуги'}</a><a href="#business-info">{en ? 'Information' : 'Информация'}</a>{business.staff?.length>0&&<a href="#business-team">{en ? 'Team' : 'Екип'}</a>}<a href="#business-location">{en ? 'Location' : 'Местоположение'}</a><a href="#business-reviews">{en ? 'Reviews' : 'Отзиви'}</a>
    </nav>
  </section>
}

export function BusinessProfileInformation({ business, locale }) {
  const en = locale === 'en', profile = publicProfileDetails(business), hours = businessWeeklyHours(business)
  const description = profile.description[locale] || profile.description[en ? 'bg' : 'en']
  const [mapLoaded, setMapLoaded] = useState(false)
  const directions = businessDirectionsUrl(business), map = businessMapUrl(business)
  const weekdays = en ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] : ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя']
  const paymentNames = { cash: en ? 'Cash' : 'В брой', card: en ? 'Card' : 'С карта', bank: en ? 'Bank transfer' : 'Банков превод' }
  return <div className="business-profile-information">
    <section className="business-profile-section" id="business-info" aria-labelledby="business-info-heading">
      <div className="business-information-columns"><div><p className="booking-eyebrow">{en ? 'Get to know us' : 'Запознай се с нас'}</p><h2 id="business-info-heading">{en ? 'About' : 'За'} {business.name}</h2>
        {description && <p className="business-about-description">{description}</p>}
        <div className="business-contact-links">{business.phone && <a href={`tel:${business.phone}`}><Icon name="phone" />{business.phone}</a>}{business.website_url && /^https?:\/\//i.test(business.website_url) && <a href={business.website_url} target="_blank" rel="noopener noreferrer"><Icon name="external" />{en ? 'Business website' : 'Сайт на бизнеса'}</a>}</div>
        {profile.payments.length > 0 && <div className="business-payment-methods"><h3>{en ? 'Payment methods' : 'Начини на плащане'}</h3><div>{[...new Set(profile.payments)].map(method => <span key={method}>{paymentNames[method]}</span>)}</div></div>}
      </div>
      {(business.opening_hours?.length===7||hours.some(day => day.periods.length)) && <div className="business-weekly-hours"><h3><Icon name="clock" />{en ? 'Working hours' : 'Работно време'}</h3><dl>{hours.map(day => <div key={day.weekday}><dt>{weekdays[day.weekday - 1]}</dt><dd>{day.periods.length ? day.periods.map(period => <span key={period}>{period}</span>) : (en ? 'Closed' : 'Почивен ден')}</dd></div>)}</dl><small>{isExternalBooking(business)?(en?'Informational opening hours, not guaranteed appointment availability. Check the business booking site.':'Информационно работно време, не гарантирани свободни часове. Провери в сайта за резервации на бизнеса.'):(en ? 'Available appointments depend on each specialist’s schedule.' : 'Свободните часове зависят от графика на съответния специалист.')}</small></div>}
      </div>
    </section>
    {business.staff?.length>0&&<section className="business-profile-section" id="business-team" aria-labelledby="business-team-heading"><header className="business-section-heading"><div><p className="booking-eyebrow">{en ? 'Your specialists' : 'Твоите специалисти'}</p><h2 id="business-team-heading">{en ? 'Meet the team' : 'Нашият екип'}</h2></div></header><div className="business-team-list">{business.staff.map(person => { const photo = getStaffPhoto(business, person.id); return <article key={person.id}>{photo ? <img className="business-team-photo" src={photo.src} alt={person.name} width="80" height="80" loading="lazy"/> : <span className="business-team-initial" aria-hidden="true">{person.name.slice(0, 1).toUpperCase()}</span>}<div><h3>{person.name}</h3>{person.bio && <p>{person.bio}</p>}</div></article> })}</div></section>}
    {profile.brands.length > 0 && <section className="business-profile-section business-brands"><h2>{en ? 'Brands we work with' : 'Марките, с които работим'}</h2><div>{[...new Set(profile.brands)].map(brand => <span key={brand}>{brand}</span>)}</div></section>}
    <section className="business-profile-section" id="business-location" aria-labelledby="business-location-heading"><div className="business-location-layout"><div><p className="booking-eyebrow">{en ? 'Find us' : 'Открий ни'}</p><h2 id="business-location-heading">{en ? 'Location & contact' : 'Адрес и контакти'}</h2>{business.address && <p className="business-profile-address"><Icon name="pin" /><span>{business.address}</span></p>}<div className="business-location-actions">{directions && <a href={directions} className="primary-button" target="_blank" rel="noopener noreferrer"><Icon name="pin" />{en ? 'Get directions' : 'Упъти ме'}</a>}{business.phone && <a href={`tel:${business.phone}`} className="secondary-button"><Icon name="phone" />{en ? 'Call us' : 'Обади се'}</a>}</div></div>
      {map && <div className="business-map">{mapLoaded ? <iframe title={en ? `Map: ${business.name}` : `Карта: ${business.name}`} src={map} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /> : <button type="button" onClick={() => setMapLoaded(true)}><Icon name="pin" /><strong>{en ? 'Show map' : 'Покажи карта'}</strong><small>{en ? 'Loads OpenStreetMap' : 'Зарежда OpenStreetMap'}</small></button>}</div>}
    </div></section>
  </div>
}
