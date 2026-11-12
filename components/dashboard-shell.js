'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect,useRef } from 'react'
import { BrandLogo } from './brand-logo'
import { HomeLink } from './home-link'
import { Icon } from './icon'
import { LanguageSwitch } from './language-switch'
import { AdminAccessLink } from './admin-access-link'

const NAV_ITEMS = [
  { icon: 'grid', label: { bg: 'Начало', en: 'Home' }, href: '/dashboard' },
  { icon: 'calendar', label: { bg: 'Резервации', en: 'Bookings' }, href: '/dashboard/appointments' },
  { icon: 'users', label: { bg: 'Клиенти', en: 'Clients' }, href: '/dashboard/customers' },
  { icon: 'chat', label: { bg: 'Асистент', en: 'Assistant' }, href: '/dashboard/assistant' },
  { icon: 'chart', label: { bg: 'Резултати', en: 'Results' }, href: '/dashboard/analytics' },
  { icon: 'external', label: { bg: 'Споделяне', en: 'Share' }, href: '/dashboard/share' },
  { icon: 'settings', label: { bg: 'Настройки', en: 'Settings' }, href: '/dashboard/settings' },
]

function Logo({ locale }) {
  return <Link className="app-logo" href="/dashboard" aria-label={`GoRez · ${locale === 'en' ? 'Home' : 'Начало'}`}><BrandLogo compact decorative eager /></Link>
}

export function DashboardShell({ email, title, businessSlug, platformStatus = 'enabled', bookingMode = 'gorez', children, onLogout, locale = 'bg', onLocaleChange }) {
  const pathname = usePathname()
  const en = locale === 'en'
  const more = useRef(null)
  const shell=useRef(null),sidebar=useRef(null)
  useEffect(()=>{if(!sidebar.current||!window.ResizeObserver)return;const observer=new ResizeObserver(()=>{if(!shell.current||!sidebar.current)return;const fixed=getComputedStyle(sidebar.current).position==='fixed';shell.current.style.setProperty('--dashboard-nav-space',fixed?`${sidebar.current.getBoundingClientRect().height+20}px`:'0px')});observer.observe(sidebar.current);return()=>observer.disconnect()},[])
  const primary = ['/dashboard', '/dashboard/appointments', '/dashboard/analytics']

  return (
    <div className="app-shell" ref={shell}>
      <aside className="sidebar" ref={sidebar}>
        <Logo locale={locale} />
        <nav className="sidebar-nav" aria-label={en ? 'Main navigation' : 'Основна навигация'}>
          {NAV_ITEMS.map((item) => {
            const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)
            return <Link className={`nav-item ${primary.includes(item.href) ? 'mobile-primary' : 'mobile-secondary'} ${active ? 'active' : ''}`} href={item.href} key={item.href} aria-label={item.label[locale]} title={item.label[locale]} aria-current={active ? 'page' : undefined}><Icon name={item.icon} /><span>{item.label[locale]}</span></Link>
          })}
          <button className="nav-item dashboard-more-button" type="button" onClick={()=>more.current?.showModal()} aria-haspopup="dialog"><Icon name="grid"/><span>{en?'More':'Още'}</span></button>
          <Link className="nav-item mobile-secondary" href={`/faq?lang=${locale}`}><Icon name="chat"/><span>{en?'Help & FAQ':'Помощ и въпроси'}</span></Link>
          <AdminAccessLink locale={locale}/>
        </nav>
        <div className="sidebar-account">
          {businessSlug && platformStatus === 'enabled' && <Link className="public-page-link" href={`/book/${businessSlug}?lang=${locale}`} target="_blank"><Icon name="external" /><span>{en ? 'Public page' : 'Публична страница'}</span></Link>}
          <p className="account-email">{email}</p>
          <button className="logout-button" type="button" data-discard-navigation onClick={onLogout}><Icon name="logout" /><span>{en ? 'Sign out' : 'Изход'}</span></button>
        </div>
      </aside>
      <dialog ref={more} className="dashboard-more-sheet" aria-labelledby="dashboard-more-title" onClick={event=>{if(event.target===more.current)more.current.close()}}>
        <header><h2 id="dashboard-more-title">{en?'More from GoRez':'Още от GoRez'}</h2><button type="button" className="secondary-button" onClick={()=>more.current.close()}>{en?'Close':'Затвори'} ×</button></header>
        <nav aria-label={en?'All dashboard sections':'Всички секции на таблото'}>{NAV_ITEMS.filter(item=>!primary.includes(item.href)).map(item=><Link key={item.href} href={item.href} onClick={()=>more.current.close()}><Icon name={item.icon}/>{item.label[locale]}</Link>)}<Link href={`/faq?lang=${locale}`} onClick={()=>more.current.close()}>{en?'Help & FAQ':'Помощ и въпроси'}</Link><Link href="/dashboard/settings?section=account" onClick={()=>more.current.close()}>{en?'Account':'Акаунт'}</Link><button type="button" data-discard-navigation onClick={onLogout}>{en?'Sign out':'Изход'}</button></nav>
      </dialog>
      <div className="main-area">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="topbar-actions">
            <LanguageSwitch locale={locale} onChange={onLocaleChange} compact />
            <button className="topbar-logout" type="button" data-discard-navigation onClick={onLogout} aria-label={en ? 'Sign out' : 'Изход'} title={en ? 'Sign out' : 'Изход'}><Icon name="logout" /></button>
            <HomeLink locale={locale}/>
          </div>
        </header>
        {businessSlug && <section className="owner-summary" aria-label={en?'Business overview':'Преглед на бизнеса'}><div><strong>{title}</strong><span>{platformStatus==='enabled'?(en?'Published':'Публикуван'):platformStatus==='pending'?(en?'Awaiting approval':'Чака одобрение'):platformStatus==='archived'?(en?'Archived':'Архивиран'):(en?'Suspended':'Спрян')} · {bookingMode==='phone'?(en?'Phone appointments':'Резервации по телефон'):bookingMode==='external'?(en?'External booking':'Външни резервации'):(en?'GoRez calendar':'GoRez календар')}</span></div>{platformStatus==='enabled'?<Link href={`/book/${businessSlug}?lang=${locale}`}>{en?'View profile':'Виж профила'} ↗</Link>:<Link href="/dashboard/settings">{en?'Prepare profile':'Подготви профила'} →</Link>}</section>}
        {platformStatus!=='enabled'&&<p className="owner-platform-notice" role="status">{platformStatus==='pending'?(en?'Awaiting approval. Prepare your services and the settings for your chosen booking mode. Public booking opens after GoRez reviews and publishes your profile. Questions: info@gorez.co.':'Чака одобрение. Подготви услугите и настройките за избрания начин на резервации. Публичното записване започва след преглед и публикуване от GoRez. Въпроси: info@gorez.co.') : platformStatus==='archived'?(en?'This business is in the platform trash. Its public page and new bookings are disabled. Contact GoRez support.':'Този бизнес е в кошчето на платформата. Публичната страница и новите резервации са спрени. Свържи се с GoRez.'):(en?'This business is suspended by a platform administrator. Existing visits remain; new bookings are disabled.':'Този бизнес е спрян от администратор на платформата. Съществуващите часове остават; нови резервации не се приемат.')}</p>}
        {children}
      </div>
    </div>
  )
}
