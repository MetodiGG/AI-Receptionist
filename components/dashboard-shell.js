'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from './icon'

const NAV_ITEMS = [
  { icon: 'grid', label: 'Начало', href: '/dashboard' },
  { icon: 'calendar', label: 'Резервации', href: '/dashboard/appointments' },
  { icon: 'users', label: 'Клиенти', href: '/dashboard/customers' },
  { icon: 'chat', label: 'AI асистент', href: '/dashboard/assistant' },
  { icon: 'settings', label: 'Настройки', href: '/dashboard/settings' },
]

function Logo() {
  return <Link className="app-logo" href="/dashboard"><span className="logo-mark"><Icon name="spark" /></span><span>AI Рецепционист</span></Link>
}

export function DashboardShell({ email, title, businessSlug, children, onLogout }) {
  const pathname = usePathname()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo />
        <nav className="sidebar-nav" aria-label="Основна навигация">
          {NAV_ITEMS.map((item) => {
            const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)
            return <Link className={`nav-item ${active ? 'active' : ''}`} href={item.href} key={item.href} aria-current={active ? 'page' : undefined}><Icon name={item.icon} /><span>{item.label}</span></Link>
          })}
        </nav>
        <div className="sidebar-account">
          {businessSlug && <Link className="public-page-link" href={`/book/${businessSlug}`} target="_blank"><Icon name="external" /><span>Публична страница</span></Link>}
          <p className="account-email">{email}</p>
          <button className="logout-button" type="button" onClick={onLogout}><Icon name="logout" /><span>Изход</span></button>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="topbar-actions">
            <span className="status-chip"><span className="online-dot" /> Системата е активна</span>
            <button className="topbar-logout" type="button" onClick={onLogout} aria-label="Изход" title="Изход"><Icon name="logout" /></button>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
