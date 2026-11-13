'use client'

import { BrandLoading } from './brand-loading'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import { createOwnerState } from '../lib/owner-state.mjs'
import { usePublicLocale } from '../hooks/use-public-locale'
import { DashboardShell } from './dashboard-shell'
import { HomeLink } from './home-link'

const OwnerContext = createContext(null)

export function OwnerProvider({ children }) {
  const router = useRouter()
  const { locale, setLocale } = usePublicLocale()
  const en = locale === 'en'
  const [state, setState] = useState({ status: 'loading', session: null, business: null, error: '' })
  const controller = useRef(null)
  const load = useCallback(() => controller.current?.load(), [])

  useEffect(() => {
    const owner = createOwnerState({ client: supabase, configured: hasSupabaseConfig, onChange: setState, onSignedOut: () => router.replace('/') })
    controller.current = owner
    owner.load()
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION' && owner.changeSession(session)) {
        // Supabase Auth callbacks must finish before calling its async APIs.
        window.setTimeout(() => owner.load(), 0)
      }
    })
    const refreshVisible = () => { if (document.visibilityState === 'visible' && owner.isStale()) owner.load() }
    window.addEventListener('focus', refreshVisible)
    const timer = window.setInterval(refreshVisible, 60000)
    return () => {
      owner.dispose(); listener.subscription.unsubscribe()
      window.removeEventListener('focus', refreshVisible); window.clearInterval(timer)
    }
  }, [router])

  async function logout() {
    controller.current?.changeSession(null)
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (state.status === 'config') return <div className="config-warning"><div className="state-home-navigation"><HomeLink locale={locale}/></div><h2>{en ? 'Supabase configuration is missing' : 'Липсва Supabase конфигурация'}</h2></div>
  if (state.status === 'loading') return <div className="loading-screen"><div className="state-home-navigation"><HomeLink locale={locale}/></div><div className="loading-box"><BrandLoading locale={locale} size={48}/></div></div>

  return <OwnerContext.Provider value={{ ...state, refreshBusiness: load, locale, setLocale }}>
    <DashboardShell email={state.session?.user.email} title={state.business?.name || (en ? 'Business setup' : 'Настройка на бизнеса')} businessSlug={state.business?.slug} platformStatus={state.business?.platform_status} bookingMode={state.business?.booking_mode} onLogout={logout} locale={locale} onLocaleChange={setLocale}>
      {state.status === 'error' ? <main className="dashboard-content"><p className="form-message" role="alert">{state.error}</p><button className="secondary-button" type="button" onClick={load}>{en ? 'Try again' : 'Опитай отново'}</button></main> : children}
    </DashboardShell>
  </OwnerContext.Provider>
}

export function useOwner() {
  const owner = useContext(OwnerContext)
  if (!owner) throw new Error('OwnerProvider is required')
  return owner
}
