'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState } from 'react'
import { BrandLogo } from './brand-logo'
import { HomeLink } from './home-link'
import { Icon } from './icon'
import { LanguageSwitch } from './language-switch'
import { AdminAccessLink } from './admin-access-link'
import { SUPPORT_EMAIL } from '../lib/product-config.mjs'
import { trackProductEvent } from '../lib/product-events-client'

export function MarketingNavigation({ locale, setLocale, business = false }) {
  const en = locale === 'en', [open, setOpen] = useState(false)
  const isHome = usePathname() === '/'
  const menuButton = useRef(null)
  return <nav className={`marketing-nav launch-navigation${isHome ? ' launch-navigation-home' : ''}`} aria-label={en ? 'Main navigation' : 'Основна навигация'} onKeyDown={event => { if (event.key === 'Escape' && open) { setOpen(false); menuButton.current?.focus() } }}>
    <Link className="launch-brand" href={`/?lang=${locale}`} aria-label="GoRez"><BrandLogo compact decorative eager/></Link>
    <div className="launch-nav-actions"><LanguageSwitch locale={locale} onChange={setLocale} compact/><AdminAccessLink locale={locale}/><Link className="nav-client-account" href={`/account?lang=${locale}`} aria-label={en ? 'My account' : 'Моят профил'}><Icon name="user"/></Link><button ref={menuButton} type="button" className="launch-menu-toggle" aria-expanded={open} aria-controls="launch-menu" aria-label={en ? 'Menu' : 'Меню'} onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? '×' : '☰'}</span></button></div>
    {!isHome && <HomeLink locale={locale} onClick={() => setOpen(false)}/>}
    <div id="launch-menu" className={`launch-menu ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)}><Link href={`/?lang=${locale}`} onClick={() => trackProductEvent('cta_find_appointment_click', business ? 'for-businesses' : 'home', locale)}>{en ? 'Find an appointment' : 'Намери час'}</Link><Link className="launch-menu-account" href={`/account?lang=${locale}`}>{en ? 'My bookings' : 'Моите резервации'}</Link><Link href={`/for-businesses?lang=${locale}`}>{en ? 'For businesses' : 'За бизнеса'}</Link>{business && <Link href="#how">{en ? 'How it works' : 'Как работи'}</Link>}<Link href={`/login?lang=${locale}`}>{en ? 'Business login' : 'Вход за бизнес'}</Link><a href={`mailto:${SUPPORT_EMAIL}`}>{en ? 'Contact us' : 'Контакт'}</a></div>
  </nav>
}
