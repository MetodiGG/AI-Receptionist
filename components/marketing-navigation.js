'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { BrandLogo } from './brand-logo'
import { HomeLink } from './home-link'
import { LanguageSwitch } from './language-switch'
import { AdminAccessLink } from './admin-access-link'
import { SUPPORT_EMAIL } from '../lib/product-config.mjs'
import { trackProductEvent } from '../lib/product-events-client'

export function MarketingNavigation({ locale, setLocale, business = false }) {
  const en = locale === 'en', [open, setOpen] = useState(false)
  const isHome = usePathname() === '/'
  const menuButton = useRef(null), navigation = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = event => { if (!navigation.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])
  return <nav ref={navigation} className={`marketing-nav launch-navigation${isHome ? ' launch-navigation-home' : ''}`} aria-label={en ? 'Main navigation' : 'Основна навигация'} onKeyDown={event => { if (event.key === 'Escape' && open) { setOpen(false); menuButton.current?.focus() } }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <Link className="launch-brand" href={`/?lang=${locale}`} aria-label="GoRez"><BrandLogo compact decorative eager/></Link>
    <div className="launch-nav-actions"><LanguageSwitch locale={locale} onChange={setLocale} compact/><AdminAccessLink locale={locale}/><button ref={menuButton} type="button" className="launch-menu-toggle" aria-expanded={open} aria-controls="launch-menu" aria-label={en ? 'Menu' : 'Меню'} onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? '×' : '☰'}</span></button></div>
    {!isHome && <HomeLink locale={locale} onClick={() => setOpen(false)}/>}
    <div id="launch-menu" hidden={!open} className={`launch-menu ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)}><Link href={`/?lang=${locale}`} onClick={() => trackProductEvent('cta_find_appointment_click', business ? 'for-businesses' : 'home', locale)}>{en ? 'Find an appointment' : 'Намери час'}</Link><Link className="launch-menu-account" href={`/account?lang=${locale}`}>{en ? 'Client login' : 'Вход за клиенти'}</Link><Link href={`/for-businesses?lang=${locale}`}>{en ? 'For businesses' : 'За бизнеса'}</Link>{business && <Link href="#how">{en ? 'How it works' : 'Как работи'}</Link>}<Link href={`/login?lang=${locale}`}>{en ? 'Business login' : 'Вход за бизнес'}</Link><a href={`mailto:${SUPPORT_EMAIL}`}>{en ? 'Contact us' : 'Контакт'}</a></div>
  </nav>
}
