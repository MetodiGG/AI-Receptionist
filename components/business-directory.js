'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Icon } from './icon'
import { DirectoryFilters } from './directory-filters'
import { BusinessPhotoGallery } from './business-photo-gallery'
import { BusinessCategoryIcon } from './business-category-icon'
import { useDirectory } from '../hooks/use-directory'
import { getIndustryLabel } from '../lib/public-locale.mjs'
import { EMPTY_DIRECTORY_FILTERS, filterDirectory } from '../lib/directory.mjs'
import { trackProductEvent } from '../lib/product-events-client'

export function BusinessDirectory({ locale, preview = null, data = null, filters: externalFilters = null, onFiltersChange, showFilters = true, partners = false, bookingDisabled = false }) {
  const en = locale === 'en', resource = useDirectory(preview,data)
  const { businesses = [], status } = resource
  const [localFilters,setLocalFilters] = useState(EMPTY_DIRECTORY_FILTERS)
  const filters = externalFilters || localFilters, setFilters = onFiltersChange || setLocalFilters
  const filtered = filterDirectory(businesses,filters)
  return <section className="business-directory" id="clients" aria-labelledby="directory-title">
    <div className="directory-heading">{!partners && <p className="marketing-kicker dark">{en ? 'Find your next appointment' : 'Намери следващия си час'}</p>}<h1 id="directory-title">{partners ? (en ? 'GoRez partners' : 'GoRez партньори') : (en ? 'Choose a business. Book online.' : 'Избери бизнес. Запази час.')}</h1>{partners && <p>{en ? 'Explore businesses on GoRez. View their services and check appointment times.' : 'Открий бизнесите в GoRez. Виж услугите им и провери свободните часове.'}</p>}</div>
    {showFilters && <DirectoryFilters rows={businesses} filters={filters} onChange={setFilters} locale={locale} loading={status === 'loading'}/>}
    {status === 'loading' ? <div className="directory-skeleton" role="status" aria-label={en ? 'Loading businesses' : 'Зареждане на бизнесите'}><span className="sr-only">{en ? 'Loading businesses…' : 'Зареждане на бизнесите…'}</span>{[1,2].map(value => <div key={value} aria-hidden="true"><i/><i/><i/><b/></div>)}</div> : status === 'error' ? <div className="directory-empty" role="alert"><Icon name="store"/><h3>{en ? 'We could not load the businesses.' : 'Не успяхме да заредим бизнесите.'}</h3><p>{en ? 'Please try again. Direct business booking links still work.' : 'Опитай отново. Директните линкове за записване остават достъпни.'}</p><button className="secondary-button" type="button" onClick={resource.retry}>{en ? 'Try again' : 'Опитай отново'}</button></div> : !businesses.length ? <div className="directory-empty"><Icon name="store"/><h3>{en ? 'Our first businesses are on their way.' : 'Първите бизнеси идват скоро.'}</h3><p>{en ? 'Available businesses will appear here.' : 'Тук ще се появят наличните бизнеси.'}</p></div> : <>
      <p className="directory-result-count" role="status">{filtered.length} {en ? (filtered.length === 1 ? 'business' : 'businesses') : (filtered.length === 1 ? 'бизнес' : 'бизнеса')}</p>
      <div className="directory-results-grid">{filtered.map(row => <article className="directory-business-card" key={row.id}>
        {row.photos?.length > 0 && <BusinessPhotoGallery photos={row.photos} businessName={row.name} locale={locale} variant="directory" />}
        <div className="directory-business-head"><span className="directory-business-icon"><BusinessCategoryIcon business={row} size={72}/></span><div><small>{getIndustryLabel(row.industry,locale)}</small><h3>{row.name}</h3>{row.address && <p>{row.address}</p>}</div></div>
        <div className="directory-services"><small>{en ? 'Services' : 'Услуги'}</small><div>{row.services.slice(0,4).map(service => <span key={service.id}><span>{service.name}<small>{service.duration_min} {en ? 'min' : 'мин'}</small></span>{service.price != null && <b>{new Intl.NumberFormat(en ? 'en-IE' : 'bg-BG',{style:'currency',currency:service.currency || 'EUR'}).format(service.price)}</b>}</span>)}</div></div>
        {bookingDisabled ? <span className="directory-book-button" aria-disabled="true">{en ? 'Design preview · booking disabled' : 'Дизайнерски преглед · без резервация'}</span> : <Link className="directory-book-button" href={`/book/${row.slug}?lang=${locale}`} onClick={() => trackProductEvent('booking_started','book',locale)}>{en ? 'Book an appointment' : 'Запази час'}<Icon name="arrow"/></Link>}
      </article>)}</div>
      {!filtered.length && <div className="directory-empty"><h3>{en ? 'No businesses match these choices yet.' : 'Все още няма бизнеси по тези критерии.'}</h3><button className="secondary-button" type="button" onClick={() => setFilters(EMPTY_DIRECTORY_FILTERS)}>{en ? 'Show all businesses' : 'Покажи всички бизнеси'}</button></div>}
    </>}
  </section>
}
