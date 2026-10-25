'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from './icon'
import { usePublicLocale } from '../hooks/use-public-locale'
import { BookingStory } from './booking-story'
import { MarketingNavigation } from './marketing-navigation'
import { DirectoryFilters } from './directory-filters'
import { useDirectory } from '../hooks/use-directory'
import { EMPTY_DIRECTORY_FILTERS, directorySearchHref } from '../lib/directory.mjs'
import { SiteFooter } from './site-footer'
import { PRICING_COPY } from '../lib/product-config.mjs'
import { trackProductEvent } from '../lib/product-events-client'

export function HomePage({ initialLocale = 'bg', identity = {}, preview = null }) {
  const router = useRouter(), { locale, setLocale } = usePublicLocale(initialLocale, true), en = locale === 'en'
  const [filters,setFilters] = useState(EMPTY_DIRECTORY_FILTERS), [accountDeleted, setAccountDeleted] = useState(false)
  const directory = useDirectory(preview)
  useEffect(() => {
    const url = new URL(window.location.href)
    setAccountDeleted(url.searchParams.get('account') === 'deleted')
    // Hashes never reach the server. Preserve legacy business-login bookmarks.
    if (url.hash === '#business') router.replace(`/login${url.search || `?lang=${locale}`}`)
    if (url.hash === '#clients') router.replace(directorySearchHref(EMPTY_DIRECTORY_FILTERS, locale))
  }, [router, locale])
  return <main className="marketing-page platform-home launch-home">
    <a href="#find-appointment" className="skip-link">{en ? 'Skip to appointment search' : 'Към търсенето на час'}</a>
    {accountDeleted && <p className="account-deleted-notice" role="status">{en ? 'Your account has been deleted. You have been signed out.' : 'Акаунтът е изтрит. Излезе от профила си.'}</p>}
    <MarketingNavigation locale={locale} setLocale={setLocale}/>
    <section className="platform-hero client-first-hero" id="top"><div className="platform-hero-copy"><p className="marketing-kicker">{en ? 'Your time matters' : 'Твоето време е важно'}</p><h1>{en ? 'Your next' : 'Следващият'}<br/>{en ? 'appointment.' : 'ти час.'}<br/><em>{en ? 'One click away.' : 'На един клик.'}</em></h1><div className="client-finder" id="find-appointment"><DirectoryFilters rows={directory.businesses || []} filters={filters} onChange={setFilters} locale={locale} loading={directory.status === 'loading'} hero/><Link className="marketing-primary-cta" href={directorySearchHref(filters, locale)} onClick={() => trackProductEvent('cta_find_appointment_click','home',locale)}>{en ? 'Find an appointment' : 'Намери час'}<Icon name="arrow"/></Link></div><div className="marketing-trust-row"><span><Icon name="check"/>{en ? 'Book without an account' : 'Записване и без профил'}</span></div></div><BookingStory locale={locale}/></section>
    <section className="home-client-profile"><div className="home-client-symbol"><Icon name="calendar"/></div><div><h2>{en ? 'Your visits. One account.' : 'Твоите посещения. Един профил.'}</h2><p>{en ? 'Upcoming bookings, past visits and a quick way to book again.' : 'Предстоящи часове, минали посещения и бързо записване отново.'}</p></div><Link className="marketing-primary-cta" href={`/account?lang=${locale}&mode=signup`}>{en ? 'My GoRez' : 'Моят GoRez'}<Icon name="arrow"/></Link></section>
    <section className="platform-business launch-business-cta" id="business-start"><div className="platform-business-copy"><p className="marketing-kicker">{en ? 'For business owners' : 'За собственици на бизнес'}</p><h2>{en ? 'Your calendar. Less effort.' : 'Твоят график. По-лесно.'}</h2></div><div className="launch-business-offer"><strong>{PRICING_COPY[locale].trial}</strong><p>{PRICING_COPY[locale].summary}</p><Link className="marketing-primary-cta" href={`/for-businesses?lang=${locale}`} onClick={() => trackProductEvent('cta_add_business_click','home',locale)}>{en ? 'Add your business' : 'Добави бизнеса си'}<Icon name="plus"/></Link><Link className="launch-owner-login" href={`/login?lang=${locale}`}>{en ? 'Business sign-in' : 'Вход за бизнес'}</Link></div></section>
    <SiteFooter locale={locale} identity={identity}/>
  </main>
}
