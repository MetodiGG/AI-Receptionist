'use client'
import { usePublicLocale } from '../hooks/use-public-locale'
import { MarketingNavigation } from './marketing-navigation'
import { SiteFooter } from './site-footer'
import { DiscoverySearch } from './discovery-search'

export function DiscoveryPage({ initialLocale = 'bg', identity = {}, preview = false }) {
  const { locale, setLocale } = usePublicLocale(initialLocale, true)
  return <main className="marketing-page platform-home discovery-page"><a className="skip-link" href="#ai-query">{locale === 'en' ? 'Skip to search' : 'Към търсенето'}</a><MarketingNavigation locale={locale} setLocale={setLocale}/><DiscoverySearch locale={locale} preview={preview}/><SiteFooter locale={locale} identity={identity}/></main>
}
