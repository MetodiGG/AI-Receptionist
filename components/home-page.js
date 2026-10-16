'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from './icon'
import { usePublicLocale } from '../hooks/use-public-locale'
import { BookingStory } from './booking-story'
import { MarketingNavigation } from './marketing-navigation'
import { BusinessDirectory } from './business-directory'
import { SiteFooter } from './site-footer'
import { PRICING_COPY } from '../lib/product-config.mjs'
import { trackProductEvent } from '../lib/product-events-client'

export function HomePage({ initialLocale = 'bg', identity = {} }) {
  const router = useRouter(), { locale, setLocale } = usePublicLocale(initialLocale, true), en = locale === 'en'
  const [industry, setIndustry] = useState('all'), [accountDeleted, setAccountDeleted] = useState(false)
  useEffect(() => {
    const url = new URL(window.location.href)
    setAccountDeleted(url.searchParams.get('account') === 'deleted')
    // Hashes never reach the server. Preserve legacy business-login bookmarks.
    if (url.hash === '#business') router.replace(`/login${url.search || `?lang=${locale}`}`)
  }, [router, locale])
  return <main className="marketing-page platform-home launch-home">
    <a href="#clients" className="skip-link">{en ? 'Skip to businesses' : 'Към бизнесите'}</a>
    {accountDeleted && <p className="account-deleted-notice" role="status">{en ? 'Your account has been deleted. You have been signed out.' : 'Акаунтът е изтрит. Излезе от профила си.'}</p>}
    <MarketingNavigation locale={locale} setLocale={setLocale}/>
    <section className="platform-hero" id="top"><div className="platform-hero-copy"><p className="marketing-kicker">{en ? 'One place for every appointment' : 'Едно място за всеки час'}</p><h1>{en ? 'Your next' : 'Следващият'}<br/>{en ? 'appointment.' : 'ти час.'}<br/><em>{en ? 'One click away.' : 'На един клик.'}</em></h1><p>{en ? 'For you. For your car. For everything on your calendar.' : 'За теб. За колата. За всичко в графика ти.'}</p><div className="marketing-hero-actions"><a className="marketing-primary-cta" href="#clients" onClick={() => trackProductEvent('cta_find_appointment_click','home',locale)}>{en ? 'Find an appointment' : 'Намери час'}<Icon name="arrow"/></a><Link className="launch-secondary-cta" href={`/for-businesses?lang=${locale}`} onClick={() => trackProductEvent('cta_add_business_click','home',locale)}>{en ? 'Add your business' : 'Добави бизнеса си'}<Icon name="plus"/></Link></div><div className="marketing-trust-row"><span><Icon name="check"/>{en ? 'Book without an account' : 'Записване и без профил'}</span><span><Icon name="check"/>{en ? 'Live availability' : 'Реални свободни часове'}</span></div></div><BookingStory locale={locale} onExplore={key => { setIndustry(key); document.getElementById('clients')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}) }}/></section>
    <BusinessDirectory locale={locale} industry={industry} setIndustry={setIndustry}/>
    <section className="home-client-profile"><div className="home-client-symbol"><Icon name="calendar"/></div><div><h2>{en ? 'Your visits. One account.' : 'Твоите посещения. Един профил.'}</h2><p>{en ? 'Upcoming bookings, past visits and a quick way to book again.' : 'Предстоящи часове, минали посещения и бързо записване отново.'}</p></div><Link className="marketing-primary-cta" href={`/account?lang=${locale}&mode=signup`}>{en ? 'My GoRez' : 'Моят GoRez'}<Icon name="arrow"/></Link></section>
    <section className="platform-business launch-business-cta" id="business-start"><div className="platform-business-copy"><p className="marketing-kicker">{en ? 'For your business' : 'За твоя бизнес'}</p><h2>{en ? 'More time for clients.' : 'Повече време за клиентите.'}</h2><p>{en ? 'Your calendar, services and online booking — together. No website needed.' : 'Календар, услуги и онлайн записване — на едно място. Без нужда от собствен сайт.'}</p></div><div className="launch-business-offer"><strong>{PRICING_COPY[locale].trial}</strong><p>{PRICING_COPY[locale].summary}</p><Link className="marketing-primary-cta" href={`/for-businesses?lang=${locale}#join`} onClick={() => trackProductEvent('cta_add_business_click','home',locale)}>{en ? 'Add your business for free' : 'Добави бизнеса си безплатно'}<Icon name="arrow"/></Link><Link className="launch-owner-login" href={`/login?lang=${locale}`}>{en ? 'Already have a business? Sign in' : 'Вече имаш бизнес? Влез в профила'}</Link></div></section>
    <SiteFooter locale={locale} identity={identity}/>
  </main>
}
