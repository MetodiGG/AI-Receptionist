'use client'

import { useRef, useState } from 'react'
import { DiscoveryHomeBusinesses } from '../../../components/discovery-home-browse'
import { DiscoveryHomeRail } from '../../../components/discovery-home-rail'
import { homeCategories, HOME_DISCOVERY_COPY } from '../../../lib/discovery/home.mjs'

// Local, fictional records only. The actual production cards and pagination
// boundary render here, with inert booking actions and no database/provider.
const directory = { businesses: [], status: 'ready' }
const filters = { cityCode: '68134', coordinates: null }
const pageSize = 6, total = 18
const menu = {
  nails: ['Маникюр', 'Педикюр'], barber: ['Подстригване на коса и брада и оформяне на вежди', 'Оформяне на брада'],
  consulting: ['Индивидуална счетоводна консултация с допълнителни условия и точно определен пакетен вариант', 'Годишна данъчна консултация'],
}

function record(index, category, locale) {
  const active = category || ['nails', 'barber', 'consulting'][index % 3]
  const services = (menu[active] || menu.nails).map((name, i) => ({ id: `local-${index}-${i}`, name, price: active === 'consulting' ? 800 : 30 + i * 6, priceKind: active === 'consulting' ? 'range' : 'fixed', priceMaximum: active === 'consulting' ? 1400 : null, currency: 'EUR', duration_min: 45 }))
  const partner = index % 3 === 0
  return {
    id: `local-grid-${category}-${index}`, slug: `local-grid-${index}`, source: partner ? 'gorez' : 'catalogue',
    name: `${locale === 'en' ? 'DEMO' : 'ДЕМО'} · ${index === 2 ? 'Измислен бизнес с умишлено дълго пълно име без съкращаване' : `Studio ${index + 1}`}`,
    category: active, businessCategory: active, industry: active === 'consulting' ? 'consulting' : 'beauty',
    address: 'Измислен локален тестов адрес · София', city_ekatte: '68134',
    coordinates: { latitude: 42.6977 + index * .002, longitude: 23.3219 },
    booking_mode: 'gorez', services, reviews: { summary: { count: 0 }, items: [] },
    booking: { kind: 'form', url: 'https://example.com/booking', verified: true, checkedOn: '2026-01-01', validUntil: '2099-01-01' },
  }
}

export function BusinessGridPreview({ locale, initialFail = false }) {
  const [category, setCategory] = useState(''), [count, setCount] = useState(pageSize)
  const [loading, setLoading] = useState(false), [failNext, setFailNext] = useState(initialFail), [error, setError] = useState('')
  const inFlight = useRef(false), generation = useRef(0)
  const copy = HOME_DISCOVERY_COPY[locale]
  function selectCategory(value) { generation.current++; inFlight.current = false; setCategory(value); setCount(pageSize); setLoading(false); setError('') }
  async function loadMore() {
    if (inFlight.current || count >= total) return
    const version = generation.current
    inFlight.current = true; setLoading(true); setError('')
    await new Promise(resolve => setTimeout(resolve, 180))
    if (version !== generation.current) return
    if (failNext) { setFailNext(false); setError('NETWORK_ERROR') }
    else setCount(value => Math.min(total, value + pageSize))
    inFlight.current = false; setLoading(false)
  }
  return <main className="marketing-page customer-home"><div className="discovery-home">
    <h1>{locale === 'en' ? 'Local vertical business review' : 'Локален преглед на вертикалните бизнеси'}</h1>
    <p role="note">{locale === 'en' ? 'FICTIONAL DATA · bookings disabled · 18 finite records' : 'ИЗМИСЛЕНИ ДАННИ · резервациите са изключени · 18 крайни записа'}</p>
    <label><input type="checkbox" checked={failNext} onChange={event => setFailNext(event.target.checked)}/>{locale === 'en' ? 'Fail the next local page' : 'Грешка при следващата локална страница'}</label>
    <p role="status" data-local-count={count}>{count} / {total}</p>
    <DiscoveryHomeRail title={copy.categories} locale={locale} kind="categories">
      {homeCategories(locale).map(item => <li key={item.id}><button type="button" className={`home-category${category === item.id ? ' is-selected' : ''}`} onClick={() => selectCategory(item.id)} aria-pressed={category === item.id}><img src={item.photo} width={80} height={80} alt=""/><span>{item.label}</span></button></li>)}
    </DiscoveryHomeRail>
    <DiscoveryHomeBusinesses locale={locale} filters={filters} preview data={directory} resultKey={category} result={{ externalStatus: 'catalogue', results: Array.from({ length: count }, (_, index) => record(index, category, locale)), cataloguePage: { nextOffset: count < total ? count : null } }} onLoadMore={loadMore} loadingMore={loading} moreError={error}/>
  </div></main>
}
