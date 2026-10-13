'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { OwnerPage } from '../../../components/owner-page'
import { supabase } from '../../../lib/supabase'

function AnalyticsContent({ business }) {
  const [events, setEvents] = useState([])
  const [appointments, setAppointments] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const since = DateTime.now().minus({ days: 30 }).toISO()
    const [eventsResult, appointmentsResult] = await Promise.all([
      supabase.from('analytics_events').select('event_type,source,created_at').eq('business_id', business.id).gte('created_at', since),
      supabase.from('appointments').select('id,status,source,starts_at,created_at,service:services(name)').eq('business_id', business.id).gte('created_at', since),
    ])
    const requestError = eventsResult.error || appointmentsResult.error
    if (requestError) { setError(requestError.message); setStatus('error'); return }
    setEvents(eventsResult.data || []); setAppointments(appointmentsResult.data || []); setStatus('ready')
  }, [business.id])

  useEffect(() => { load() }, [load])
  const stats = useMemo(() => {
    const pageViews = events.filter((event) => event.event_type === 'page_view').length
    const bookings = appointments.length
    const cancelled = appointments.filter((item) => item.status === 'cancelled').length
    const guidedConversations = events.filter((event) => event.event_type === 'chat_started').length
    const guidedMessages = events.filter((event) => event.event_type === 'chat_message').length
    return { pageViews, bookings, cancelled, conversion: pageViews ? Math.min(100, (bookings / pageViews) * 100) : 0, guidedConversations, guidedMessages }
  }, [appointments, events])

  const services = useMemo(() => Object.entries(appointments.reduce((acc, item) => { const name = item.service?.name || 'Друга'; acc[name] = (acc[name] || 0) + 1; return acc }, {})).sort((a, b) => b[1] - a[1]), [appointments])

  return <main className="dashboard-content admin-page analytics-page"><div className="admin-page-head"><div><p className="auth-kicker">Последни 30 дни</p><h2>Резултати</h2><p>Виж как клиентският трафик се превръща в реални резервации.</p></div><span className="analytics-period">Обновено сега</span></div>{error && <p className="form-message">{error}</p>}{status === 'loading' ? <div className="admin-loading"><span className="button-spinner" /> Зареждаме резултатите...</div> : <><div className="analytics-kpis"><article><small>Посещения</small><strong>{stats.pageViews}</strong><span>на страницата</span></article><article><small>Нови резервации</small><strong>{stats.bookings}</strong><span>за 30 дни</span></article><article><small>Конверсия</small><strong>{stats.conversion.toFixed(1)}%</strong><span>посетител → час</span></article><article><small>Отменени</small><strong>{stats.cancelled}</strong><span>резервации</span></article></div><div className="analytics-grid"><section className="settings-panel"><div className="settings-panel-head"><h3>Най-търсени услуги</h3><p>На база създадените резервации.</p></div>{services.length ? <div className="service-bars">{services.map(([name, count]) => <div key={name}><span><strong>{name}</strong><b>{count}</b></span><i><b style={{ width: `${Math.max(8, count / Math.max(...services.map((row) => row[1])) * 100)}%` }} /></i></div>)}</div> : <p className="analytics-empty">Още няма достатъчно данни.</p>}</section><section className="settings-panel guided-insights-card"><div className="settings-panel-head"><h3>Безплатен асистент</h3><p>Работи само с проверени бизнес данни и без платен AI API.</p></div><div className="guided-insight-stats"><span><strong>{stats.guidedConversations}</strong><small>започнати разговора</small></span><span><strong>{stats.guidedMessages}</strong><small>действия в чата</small></span></div><p>Асистентът насочва клиента през услугите, екипа, датата и реално свободните часове.</p></section></div></>}</main>
}

export default function AnalyticsPage() {
  return <OwnerPage title="Резултати">{(props) => <AnalyticsContent {...props} />}</OwnerPage>
}

