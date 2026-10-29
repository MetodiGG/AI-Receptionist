'use client'

import { usePublicLocale } from '../hooks/use-public-locale'
import { MarketingNavigation } from './marketing-navigation'
import { BusinessDirectory } from './business-directory'
import { SiteFooter } from './site-footer'

export function PartnersPage({ initialLocale = 'bg', identity = {} }) {
  const { locale, setLocale } = usePublicLocale(initialLocale, true)
  return <main className="marketing-page platform-home partners-page">
    <a href="#clients" className="skip-link">{locale === 'en' ? 'Skip to partners' : 'Към партньорите'}</a>
    <MarketingNavigation locale={locale} setLocale={setLocale}/>
    <BusinessDirectory locale={locale} partners showFilters={false}/>
    <SiteFooter locale={locale} identity={identity}/>
  </main>
}
