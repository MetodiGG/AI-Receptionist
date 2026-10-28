'use client'

import { DashboardShell } from '../../../components/dashboard-shell'
import { usePublicLocale } from '../../../hooks/use-public-locale'

export function HomeNavigationPreview() {
  const { locale, setLocale } = usePublicLocale()
  return <DashboardShell title="QA · Local business" email="qa@example.invalid" locale={locale} onLocaleChange={setLocale} onLogout={() => {}}>
    <main className="dashboard-content"><h2>LOCAL QA · navigation only</h2><p>Fictional account. No business, booking, email or sign-out actions.</p></main>
  </DashboardShell>
}
