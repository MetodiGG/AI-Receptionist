'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { hasSupabaseConfig, supabase } from '../../lib/supabase'
import { DashboardShell } from '../../components/dashboard-shell'
import { Icon } from '../../components/icon'
import { usePublicLocale } from '../../hooks/use-public-locale'
import { businessAddress } from '../../lib/business-location.mjs'
import { BusinessSetup } from '../../components/business-setup'

const WEEK = {
  bg: [
    { weekday: 1, label: 'Понеделник', short: 'Пон' }, { weekday: 2, label: 'Вторник', short: 'Вто' },
    { weekday: 3, label: 'Сряда', short: 'Сря' }, { weekday: 4, label: 'Четвъртък', short: 'Чет' },
    { weekday: 5, label: 'Петък', short: 'Пет' }, { weekday: 6, label: 'Събота', short: 'Съб' },
    { weekday: 7, label: 'Неделя', short: 'Нед' },
  ],
  en: [
    { weekday: 1, label: 'Monday', short: 'Mon' }, { weekday: 2, label: 'Tuesday', short: 'Tue' },
    { weekday: 3, label: 'Wednesday', short: 'Wed' }, { weekday: 4, label: 'Thursday', short: 'Thu' },
    { weekday: 5, label: 'Friday', short: 'Fri' }, { weekday: 6, label: 'Saturday', short: 'Sat' },
    { weekday: 7, label: 'Sunday', short: 'Sun' },
  ],
}

function formatPrice(value, locale) {
  return new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'bg-BG', { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
}

function getDatabaseErrorMessage(error, locale) {
  if (error?.code === '42501') {
    return locale === 'en' ? 'Database access is not configured yet. Contact support.' : 'Достъпът до базата данни още не е конфигуриран. Свържи се с поддръжката.'
  }

  return error?.message || (locale === 'en' ? 'An unexpected error occurred. Try again.' : 'Възникна неочаквана грешка. Опитай отново.')
}

function ReadyDashboard({ data, locale }) {
  const en = locale === 'en'
  const { business, services, staff, schedule, appointmentsCount = 0 } = data
  const openDays = schedule?.filter((day) => day.enabled).length || 0
  const stats = [
    ['calendar', en ? 'Bookings' : 'Резервации', appointmentsCount],
    ['briefcase', en ? 'Active services' : 'Активни услуги', services.length],
    ['users', en ? 'Team members' : 'Членове на екипа', staff.length],
    ['clock', en ? 'Working days' : 'Работни дни', openDays],
  ]
  return (
    <>
      <div className="stats-grid">
        {stats.map(([icon, label, value]) => <article className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon name={icon} /></span></div><p className="stat-value">{value}</p></article>)}
      </div>
      <div className="dashboard-grid">
        <section className="content-card">
          <div className="card-head"><h3>{en ? 'Your services' : 'Твоите услуги'}</h3></div>
          {services.length ? <div className="service-list">{services.map((service) => <div className="service-item" key={service.id || service.name}><span className="service-avatar">{service.name.slice(0, 1).toUpperCase()}</span><div><p className="service-name">{service.name}</p><p className="service-meta">{service.duration_min} {en ? 'minutes' : 'минути'}</p></div><span className="service-price">{formatPrice(service.price, locale)}</span></div>)}</div> : <div className="empty-state">{en ? 'No services have been added yet.' : 'Все още няма добавени услуги.'}</div>}
        </section>
        <section className="content-card">
          <div className="card-head"><h3>{en ? 'Business profile' : 'Бизнес профил'}</h3></div>
          <div className="business-summary">
            <div className="summary-row"><Icon name="store" /><span><strong>{business.name}</strong><br />/{business.slug}</span></div>
            {businessAddress(business, locale) && <div className="summary-row"><Icon name="pin" /><span>{businessAddress(business, locale)}</span></div>}
            {business.phone && <div className="summary-row"><Icon name="phone" /><span>{business.phone}</span></div>}
            <div className="summary-row"><Icon name="clock" /><span>{business.timezone}</span></div>
          </div>
        </section>
      </div>
    </>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { locale, setLocale } = usePublicLocale()
  const en = locale === 'en'
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('loading')
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')

  const loadBusiness = useCallback(async (activeSession) => {
    setStatus('loading')
    const { data: business, error } = await supabase.from('businesses').select('*').eq('owner_id', activeSession.user.id).order('created_at', { ascending: true }).limit(1).maybeSingle()
    if (error) { setLoadError(getDatabaseErrorMessage(error, locale)); setStatus('error'); return }
    if (!business) { setStatus('setup'); return }

    const [servicesResult, staffResult, hoursResult, appointmentsResult] = await Promise.all([
      supabase.from('services').select('*').eq('business_id', business.id).eq('active', true).order('name'),
      supabase.from('staff').select('*').eq('business_id', business.id).eq('active', true).order('name'),
      supabase.from('working_hours').select('*').eq('business_id', business.id).order('weekday'),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
    ])
    const firstError = [servicesResult, staffResult, hoursResult, appointmentsResult].find((result) => result.error)?.error
    if (firstError) { setLoadError(getDatabaseErrorMessage(firstError, locale)); setStatus('error'); return }

    const schedule = WEEK[locale].map((day) => {
      const hours = hoursResult.data.find((row) => row.weekday === day.weekday)
      return { ...day, enabled: Boolean(hours), open: hours?.open_time?.slice(0, 5) || '09:00', close: hours?.close_time?.slice(0, 5) || '18:00' }
    })
    setData({ business, services: servicesResult.data, staff: staffResult.data, schedule, appointmentsCount: appointmentsResult.count || 0 })
    setStatus('ready')
  }, [locale])

  useEffect(() => {
    if (!hasSupabaseConfig) { setStatus('config'); return }
    let mounted = true
    supabase.auth.getSession().then(({ data: authData }) => {
      if (!mounted) return
      if (!authData.session) { router.replace('/'); return }
      setSession(authData.session)
      loadBusiness(authData.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) router.replace('/')
    })
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [loadBusiness, router])

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return en ? 'Good morning' : 'Добро утро'
    if (hour < 18) return en ? 'Good afternoon' : 'Добър ден'
    return en ? 'Good evening' : 'Добър вечер'
  }, [en])

  if (status === 'config') return <div className="config-warning"><h2>{en ? 'Supabase configuration is missing' : 'Липсва Supabase конфигурация'}</h2><p>{en ? 'Add these values to a local .env.local file. Do not upload them to GitHub.' : 'Добави следните стойности в локален .env.local файл. Не ги качвай в GitHub.'}</p><code>NEXT_PUBLIC_SUPABASE_URL=...</code><code>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</code></div>
  if (status === 'loading' || !session) return <div className="loading-screen"><div className="loading-box"><span className="button-spinner" /><span>{en ? 'Preparing your dashboard...' : 'Подготвяме твоето табло...'}</span></div></div>

  return (
    <DashboardShell email={session.user.email} title={data?.business?.name || (en ? 'Business setup' : 'Настройка на бизнеса')} businessSlug={data?.business?.slug} platformStatus={data?.business?.platform_status} onLogout={logout} locale={locale} onLocaleChange={setLocale}>
      <main className="dashboard-content">
        <div className="page-intro">
          <div>
            <p className="auth-kicker">{status === 'ready' ? (en ? 'Your dashboard' : 'Твоето табло') : (en ? 'Initial setup' : 'Първоначална настройка')}</p>
            <h2>{status === 'ready' ? `${greeting}, ${data.business.name}` : (en ? 'Set up your GoRez booking page.' : 'Да настроим твоята GoRez страница.')}</h2>
            <p>{status === 'ready' ? (en ? 'Here is what is happening in your business right now.' : 'Ето какво се случва в бизнеса ти в момента.') : (en ? 'Add your services, team and schedule. Public booking starts after GoRez reviews and publishes your profile.' : 'Добави услуги, екип и график. Публичното записване започва след преглед и публикуване на профила от GoRez.')}</p>
          </div>
        </div>
        {status === 'error' && <div className="form-message"><strong>{en ? 'We could not load the data.' : 'Не успяхме да заредим данните.'}</strong><br />{loadError}</div>}
        {status === 'setup' && <BusinessSetup application session={session} locale={locale} onComplete={() => loadBusiness(session)} />}
        {status === 'ready' && <ReadyDashboard data={data} locale={locale} />}
      </main>
    </DashboardShell>
  )
}
