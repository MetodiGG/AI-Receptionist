'use client'

import { useEffect, useState } from 'react'
import { usePublicLocale } from '../hooks/use-public-locale'
import { BusinessDirectory } from './business-directory'
import { MarketingNavigation } from './marketing-navigation'
import { SiteFooter } from './site-footer'
import { directorySearchFilters, directorySearchHref } from '../lib/directory.mjs'
import Link from 'next/link'

export function BusinessSearchPage({ initialLocale = 'bg', initialFilters = {}, identity = {}, discoveryEnabled = false }) {
  const { locale, setLocale } = usePublicLocale(initialLocale, true)
  const [filters, setFilters] = useState(() => directorySearchFilters(initialFilters))
  useEffect(() => { setFilters(directorySearchFilters(initialFilters)) }, [initialFilters.service, initialFilters.city, initialFilters.neighborhood])
  const updateFilters = next => {
    setFilters(next)
    window.history.replaceState(null, '', directorySearchHref(next, locale))
  }
  return <main className="marketing-page platform-home search-results-page">
    <a href="#clients" className="skip-link">{locale === 'en' ? 'Skip to results' : 'Към резултатите'}</a>
    <MarketingNavigation locale={locale} setLocale={setLocale}/>
    {discoveryEnabled && <div className="discovery-search"><Link className="discovery-home-link" href={`/search?lang=${locale}`}>{locale === 'en' ? 'Describe what you need · GoRez AI Search' : 'Опиши какво търсиш · GoRez AI Search'}</Link></div>}
    <BusinessDirectory locale={locale} filters={filters} onFiltersChange={updateFilters}/>
    <SiteFooter locale={locale} identity={identity}/>
  </main>
}
