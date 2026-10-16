'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import { DashboardShell } from './dashboard-shell'
import { usePublicLocale } from '../hooks/use-public-locale'

export function OwnerPage({ title, children }) {
  const router = useRouter()
  const { locale, setLocale } = usePublicLocale()
  const en = locale === 'en'
  const [state, setState] = useState({ status: 'loading', session: null, business: null, error: '' })

  const load = useCallback(async () => {
    if (!hasSupabaseConfig) { setState((current) => ({ ...current, status: 'config' })); return }
    const { data: authData } = await supabase.auth.getSession()
    if (!authData.session) { router.replace('/'); return }

    const { data: business, error } = await supabase.from('businesses').select('*').eq('owner_id', authData.session.user.id).order('created_at').limit(1).maybeSingle()
    if (error) { setState({ status: 'error', session: authData.session, business: null, error: error.message }); return }
    setState({ status: business ? 'ready' : 'setup', session: authData.session, business, error: '' })
  }, [router])

  useEffect(() => {
    load()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (!session) router.replace('/') })
    return () => listener.subscription.unsubscribe()
  }, [load, router])

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (state.status === 'loading') return <div className="loading-screen"><div className="loading-box"><span className="button-spinner" /><span>{en ? 'Loading...' : 'Зареждаме...'}</span></div></div>
  if (state.status === 'config') return <div className="config-warning"><h2>{en ? 'Supabase configuration is missing' : 'Липсва Supabase конфигурация'}</h2></div>

  return (
    <DashboardShell email={state.session?.user.email} title={state.business?.name || (typeof title === 'string' ? title : title?.[locale])} businessSlug={state.business?.slug} platformStatus={state.business?.platform_status} onLogout={logout} locale={locale} onLocaleChange={setLocale}>
      {state.status === 'setup' && <main className="dashboard-content"><div className="empty-state"><h2>{en ? 'Complete the initial setup' : 'Завърши първоначалната настройка'}</h2><p>{en ? 'Add your business, services and working hours before using this section.' : 'Преди да използваш тази секция, добави бизнеса, услугите и работното време.'}</p><Link className="primary-button" href="/dashboard">{en ? 'Go to setup' : 'Към настройката'}</Link></div></main>}
      {state.status === 'error' && <main className="dashboard-content"><p className="form-message">{state.error}</p></main>}
      {state.status === 'ready' && children({ session: state.session, business: state.business, refreshBusiness: load, locale, setLocale })}
    </DashboardShell>
  )
}
