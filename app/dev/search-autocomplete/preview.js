'use client'

import { useCallback, useState } from 'react'
import { DiscoveryAutocomplete } from '../../../components/discovery-autocomplete'
import { BrandLogo } from '../../../components/brand-logo'

export function SearchAutocompletePreview() {
  const [locale, setLocale] = useState('bg'), [value, setValue] = useState(''), [selected, setSelected] = useState(''), [mode, setMode] = useState('normal')
  const en = locale === 'en'
  const fetcher = useCallback(async (_url, init) => {
    const input = JSON.parse(init.body), query = input.query.toLowerCase()
    if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 1400))
    if (mode === 'error') return { ok: false }
    const groups = mode === 'empty' || query.includes('xyz') ? [] : [
      { kind: 'service', label: en ? 'Services' : 'Услуги', items: [
        { id: 'manicure', kind: 'service', label: en ? 'Manicure' : 'Маникюр', query: 'Маникюр', cityCode: '68134', neighborhood: 'Манастирски ливади' },
        { id: 'long-service', kind: 'service', label: en ? 'Manicure with strengthening and French decoration' : 'Маникюр с укрепване и френска декорация', query: 'Маникюр с укрепване и френска декорация', cityCode: '68134' },
      ] },
      { kind: 'business', label: en ? 'Businesses' : 'Бизнеси', items: [
        { id: 'fictional-partner', kind: 'business', label: en ? 'QA fictional manicure studio with a deliberately long name' : 'QA измислено студио за маникюр с дълго име', detail: en ? 'Manastirski Livadi' : 'Манастирски ливади', source: 'gorez', partner: true, href: '/book/qa-fictional?lang=bg' },
        { id: 'sofia-qa-fictional', kind: 'business', label: 'QA fictional external salon', detail: en ? 'Sofia' : 'София', source: 'catalogue', partner: false, href: '/businesses/catalogue/sofia-qa-fictional?lang=bg' },
      ] },
      { kind: 'category', label: en ? 'Categories' : 'Категории', items: [{ id: 'nails', kind: 'category', category: 'nails', label: en ? 'Nails' : 'Маникюр', cityCode: '68134' }] },
    ]
    return { ok: true, json: async () => ({ groups, total: groups.reduce((sum, group) => sum + group.items.length, 0), alternatives: [], partial: false }) }
  }, [mode, en])
  return <main className="marketing-page customer-home" style={{ minHeight: '100svh', padding: '20px 0' }}>
    <div style={{ width: 'min(1080px, calc(100% - 32px))', margin: '0 auto' }}><BrandLogo/><p>LOCAL QA · fictional suggestions only. No database, providers, bookings or notifications.</p><div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}><button type="button" onClick={() => { setLocale(en ? 'bg' : 'en'); setSelected('') }}>{en ? 'Български' : 'English'}</button><label>{en ? 'Test response' : 'Тестов отговор'} <select value={mode} onChange={event => setMode(event.target.value)}><option value="normal">Normal</option><option value="slow">Slow</option><option value="empty">Empty</option><option value="error">Error</option></select></label></div></div>
    <section className="discovery-search discovery-home" style={{ marginTop: 0 }}><div className="home-search-panel"><header className="home-discovery-heading"><h1>{en ? 'Find a service. Book a time.' : 'Намери услуга. Запази час.'}</h1></header><form className="discovery-form" onSubmit={event => { event.preventDefault(); setSelected(`all: ${value}`) }}><div className="discovery-query"><label className="sr-only" htmlFor="qa-search">{en ? 'Search' : 'Търсене'}</label><DiscoveryAutocomplete id="qa-search" value={value} onChange={setValue} onSelect={item => setSelected(`${item.kind}: ${item.label}`)} onAll={() => setSelected(`all: ${value}`)} locale={locale} placeholder={en ? 'Type at least 2 characters…' : 'Напиши поне 2 символа…'} fetcher={fetcher}/><button type="submit" className="home-search-trigger" aria-label={en ? 'Search' : 'Търси'}>→</button></div></form></div><output style={{ display: 'block', marginTop: 30, overflowWrap: 'anywhere' }}>{selected}</output></section>
  </main>
}
