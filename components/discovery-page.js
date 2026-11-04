'use client'
import { usePublicLocale } from '../hooks/use-public-locale'
import { MarketingNavigation } from './marketing-navigation'
import { SiteFooter } from './site-footer'
import { DiscoverySearch } from './discovery-search'
import { DiscoveryHomeBottom } from './discovery-home-browse'
import { HOME_DISCOVERY_COPY } from '../lib/discovery/home.mjs'

export function DiscoveryPage({ initialLocale = 'bg', identity = {}, preview = false, enabled = true, accountDeleted = false, locationProvider, home = false, directoryData }) {
  const { locale, setLocale } = usePublicLocale(initialLocale, true)
  return <main className={`marketing-page platform-home discovery-page${home ? ' customer-home' : ''}`}><a className="skip-link" href="#ai-query">{locale === 'en' ? 'Skip to search' : 'Към търсенето'}</a><MarketingNavigation locale={locale} setLocale={setLocale} homeDiscovery={home}/>{accountDeleted && <p className="account-deleted-notice" role="status">{locale === 'en' ? 'Your account has been deleted. You have been signed out.' : 'Акаунтът е изтрит. Излезе от профила си.'}</p>}{enabled ? <DiscoverySearch locale={locale} preview={preview} locationProvider={locationProvider} home={home} directoryData={directoryData}/> : <section className="discovery-search"><h1>{home ? HOME_DISCOVERY_COPY[locale].title : 'GoRez AI Search'}</h1><p className="discovery-notice" role="status">{locale === 'en' ? 'Search is temporarily unavailable. Please try again later.' : 'Търсенето временно не е достъпно. Моля, опитай по-късно.'}</p>{home && <DiscoveryHomeBottom locale={locale}/>}</section>}<SiteFooter locale={locale} identity={identity} compact={home}/></main>
}
