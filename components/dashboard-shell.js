'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandLogo } from './brand-logo'
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

export function DashboardShell({ email, title, businessSlug, platformStatus = 'enabled', children, onLogout, locale = 'bg', onLocaleChange }) {
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
          <AdminAccessLink locale={locale}/>
        </nav>
        <div className="sidebar-account">
          {businessSlug && platformStatus === 'enabled' && <Link className="public-page-link" href={`/book/${businessSlug}?lang=${locale}`} target="_blank"><Icon name="external" /><span>{en ? 'Public page' : 'Публична страница'}</span></Link>}
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
        {platformStatus!=='enabled'&&<p className="owner-platform-notice" role="status">{platformStatus==='pending'?(en?'Awaiting approval. Prepare your services, team and schedule in Settings. Public booking opens after GoRez reviews and publishes your profile. Questions: info@gorez.co.':'Чака одобрение. Подготви услугите, екипа и графика в Настройки. Публичното записване започва след преглед и публикуване от GoRez. Въпроси: info@gorez.co.') : platformStatus==='archived'?(en?'This business is in the platform trash. Its public page and new bookings are disabled. Contact GoRez support.':'Този бизнес е в кошчето на платформата. Публичната страница и новите резервации са спрени. Свържи се с GoRez.'):(en?'This business is suspended by a platform administrator. Existing visits remain; new bookings are disabled.':'Този бизнес е спрян от администратор на платформата. Съществуващите часове остават; нови резервации не се приемат.')}</p>}
        {children}
      </div>
    </div>
  )
}
