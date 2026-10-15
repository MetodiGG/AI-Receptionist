'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandLogo } from './brand-logo'
import { Icon } from './icon'
import { LanguageSwitch } from './language-switch'

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

export function DashboardShell({ email, title, businessSlug, children, onLogout, locale = 'bg', onLocaleChange }) {
  const pathname = usePathname()
  const en = locale === 'en'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo locale={locale} />
        <nav className="sidebar-nav" aria-label={en ? 'Main navigation' : 'Основна навигация'}>
          {NAV_ITEMS.map((item) => {
            const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)
            return <Link className={`nav-item ${active ? 'active' : ''}`} href={item.href} key={item.href} aria-current={active ? 'page' : undefined}><Icon name={item.icon} /><span>{item.label[locale]}</span></Link>
          })}
        </nav>
        <div className="sidebar-account">
          {businessSlug && <Link className="public-page-link" href={`/book/${businessSlug}?lang=${locale}`} target="_blank"><Icon name="external" /><span>{en ? 'Public page' : 'Публична страница'}</span></Link>}
          <p className="account-email">{email}</p>
          <button className="logout-button" type="button" onClick={onLogout}><Icon name="logout" /><span>{en ? 'Sign out' : 'Изход'}</span></button>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="topbar-actions">
            <LanguageSwitch locale={locale} onChange={onLocaleChange} compact />
            <button className="topbar-logout" type="button" onClick={onLogout} aria-label={en ? 'Sign out' : 'Изход'} title={en ? 'Sign out' : 'Изход'}><Icon name="logout" /></button>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
