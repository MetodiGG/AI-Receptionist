'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Icon } from './icon'
import { getIndustryLabel, INDUSTRY_KEYS, INDUSTRY_META } from '../lib/public-locale.mjs'
import { directoryCategories, fetchDirectory } from '../lib/directory.mjs'
import { trackProductEvent } from '../lib/product-events-client'

export function BusinessDirectory({ locale, industry = 'all', setIndustry = () => {}, preview = null }) {
  const en = locale === 'en'
  const [businesses, setBusinesses] = useState(preview?.businesses || [])
  const [status, setStatus] = useState(preview?.status || 'loading')
  const [search, setSearch] = useState(''), [city, setCity] = useState(''), [reload, setReload] = useState(0)
  useEffect(() => {
    if (preview) return
    const controller = new AbortController()
    setStatus('loading')
    fetchDirectory({ signal: controller.signal }).then(rows => { if (!controller.signal.aborted) { setBusinesses(rows); setStatus('ready') } }).catch(() => { if (!controller.signal.aborted) setStatus('error') })
    return () => controller.abort()
  }, [reload, preview])
  const categories = directoryCategories(businesses)
  const selectedIndustry = categories.includes(industry) ? industry : 'all'
  const cities = [...new Set(businesses.map(row => row.city).filter(Boolean))].sort((a,b) => a.localeCompare(b, locale))
  const filtered = useMemo(() => businesses.filter(row => (selectedIndustry === 'all' || row.industry === selectedIndustry) && (!city || row.city === city) && `${row.name} ${row.city || ''} ${row.address || ''}`.toLocaleLowerCase(locale).includes(search.trim().toLocaleLowerCase(locale))), [businesses, selectedIndustry, city, search, locale])
  return <section className="business-directory" id="clients" aria-labelledby="directory-title">
    <div className="directory-heading"><p className="marketing-kicker dark">{en ? 'Find your next appointment' : 'Намери следващия си час'}</p><h2 id="directory-title">{en ? 'Choose a business. Book online.' : 'Избери бизнес. Запази час.'}</h2><p>{en ? 'Services, prices and available times — directly from the business.' : 'Услуги, цени и свободни часове — директно от бизнеса.'}</p></div>
    {status === 'loading' ? <div className="directory-skeleton" role="status" aria-label={en ? 'Loading businesses' : 'Зареждане на бизнесите'}><span className="sr-only">{en ? 'Loading businesses…' : 'Зареждане на бизнесите…'}</span>{[1,2].map(value => <div key={value} aria-hidden="true"><i/><i/><i/><b/></div>)}</div> : status === 'error' ? <div className="directory-empty" role="alert"><Icon name="store"/><h3>{en ? 'We could not load the businesses.' : 'Не успяхме да заредим бизнесите.'}</h3><p>{en ? 'Please try again. You can still open a direct business booking link.' : 'Опитай отново. Можеш да използваш и директния линк на бизнеса.'}</p><button className="secondary-button" type="button" onClick={() => setReload(value => value+1)}>{en ? 'Try again' : 'Опитай отново'}</button></div> : !businesses.length ? <div className="directory-empty"><Icon name="store"/><h3>{en ? 'Our first businesses are on their way.' : 'Първите бизнеси идват скоро.'}</h3><p>{en ? 'Soon you will find businesses here where you can book online.' : 'Съвсем скоро тук ще откриваш бизнеси, при които можеш да запазиш час онлайн.'}</p><Link className="marketing-primary-cta" href={`/for-businesses?lang=${locale}`}>{en ? 'Have a business? Join GoRez.' : 'Имаш бизнес? Присъедини се към GoRez.'}<Icon name="arrow"/></Link></div> : <>
      <div className="directory-tools"><label>{en ? 'Search businesses' : 'Търси бизнес'}<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={en ? 'Name or city' : 'Име или град'}/></label><label>{en ? 'Category' : 'Категория'}<select value={selectedIndustry} onChange={event => setIndustry(event.target.value)}><option value="all">{en ? 'All categories' : 'Всички категории'}</option>{INDUSTRY_KEYS.filter(key => categories.includes(key)).map(key => <option key={key} value={key}>{getIndustryLabel(key, locale)}</option>)}</select></label>{cities.length > 1 && <label>{en ? 'City' : 'Град'}<select value={city} onChange={event => setCity(event.target.value)}><option value="">{en ? 'All cities' : 'Всички градове'}</option>{cities.map(value => <option key={value}>{value}</option>)}</select></label>}</div>
      <div className="directory-category-buttons" role="group" aria-label={en ? 'Available categories' : 'Налични категории'}>{INDUSTRY_KEYS.filter(key => categories.includes(key)).map(key => <button type="button" key={key} aria-pressed={selectedIndustry === key} onClick={() => setIndustry(selectedIndustry === key ? 'all' : key)}><Icon name={INDUSTRY_META[key].icon}/>{getIndustryLabel(key, locale)}</button>)}</div>
      <div className="directory-results-grid" aria-live="polite">{filtered.map(row => <article className="directory-business-card" key={row.id}>
        <div className="directory-business-head"><span className="directory-business-icon"><Icon name={(INDUSTRY_META[row.industry] || INDUSTRY_META.other).icon}/></span><div><small>{getIndustryLabel(row.industry, locale)}</small><h3>{row.name}</h3>{row.address && <p>{row.address}</p>}</div></div>
        <div className="directory-services"><small>{en ? 'Services' : 'Услуги'}</small><div>{(row.services || []).slice(0,4).map(service => <span key={service.id}><span>{service.name}<small>{service.duration_min} {en ? 'min' : 'мин'}</small></span>{service.price != null && <b>{new Intl.NumberFormat(en ? 'en-IE' : 'bg-BG',{style:'currency',currency:service.currency || 'EUR'}).format(service.price)}</b>}</span>)}</div></div>
        <Link className="directory-book-button" href={`/book/${row.slug}?lang=${locale}`} onClick={() => trackProductEvent('booking_started','book',locale)}>{en ? 'View services and times' : 'Виж услуги и часове'}<Icon name="arrow"/></Link>
      </article>)}</div>
      {!filtered.length && <div className="directory-empty"><h3>{en ? 'No matches for this search.' : 'Няма резултати за това търсене.'}</h3><button className="secondary-button" type="button" onClick={() => { setSearch(''); setCity(''); setIndustry('all') }}>{en ? 'Clear filters' : 'Изчисти филтрите'}</button></div>}
    </>}
  </section>
}
