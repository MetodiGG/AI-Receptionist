'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { OwnerPage } from '../../../components/owner-page'
import { supabase } from '../../../lib/supabase'

function AnalyticsContent({ business }) {
  const [events, setEvents] = useState([])
  const [usage, setUsage] = useState([])
  const [appointments, setAppointments] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const since = DateTime.now().minus({ days: 30 }).toISO()
    const [eventsResult, usageResult, appointmentsResult] = await Promise.all([
      supabase.from('analytics_events').select('event_type,source,created_at').eq('business_id', business.id).gte('created_at', since),
      supabase.from('ai_usage_events').select('input_tokens,output_tokens,estimated_cost_microusd,created_at').eq('business_id', business.id).gte('created_at', DateTime.now().startOf('month').toISO()),
      supabase.from('appointments').select('id,status,source,starts_at,created_at,service:services(name)').eq('business_id', business.id).gte('created_at', since),
    ])
    const requestError = eventsResult.error || usageResult.error || appointmentsResult.error
    if (requestError) { setError(requestError.message); setStatus('error'); return }
    setEvents(eventsResult.data || []); setUsage(usageResult.data || []); setAppointments(appointmentsResult.data || []); setStatus('ready')
  }, [business.id])

  useEffect(() => { load() }, [load])
  const stats = useMemo(() => {
    const pageViews = events.filter((event) => event.event_type === 'page_view').length
    const bookings = appointments.length
    const cancelled = appointments.filter((item) => item.status === 'cancelled').length
    const aiCostUsd = usage.reduce((sum, item) => sum + Number(item.estimated_cost_microusd || 0), 0) / 1_000_000
    return { pageViews, bookings, cancelled, conversion: pageViews ? Math.min(100, (bookings / pageViews) * 100) : 0, aiCostUsd }
  }, [appointments, events, usage])

  const services = useMemo(() => Object.entries(appointments.reduce((acc, item) => { const name = item.service?.name || 'Друга'; acc[name] = (acc[name] || 0) + 1; return acc }, {})).sort((a, b) => b[1] - a[1]), [appointments])

  return <main className="dashboard-content admin-page analytics-page"><div className="admin-page-head"><div><p className="auth-kicker">Последни 30 дни</p><h2>Резултати</h2><p>Виж как клиентският трафик се превръща в реални резервации.</p></div><span className="analytics-period">Обновено сега</span></div>{error && <p className="form-message">{error}</p>}{status === 'loading' ? <div className="admin-loading"><span className="button-spinner" /> Зареждаме резултатите...</div> : <><div className="analytics-kpis"><article><small>Посещения</small><strong>{stats.pageViews}</strong><span>на страницата</span></article><article><small>Нови резервации</small><strong>{stats.bookings}</strong><span>за 30 дни</span></article><article><small>Конверсия</small><strong>{stats.conversion.toFixed(1)}%</strong><span>посетител → час</span></article><article><small>Отменени</small><strong>{stats.cancelled}</strong><span>резервации</span></article></div><div className="analytics-grid"><section className="settings-panel"><div className="settings-panel-head"><h3>Най-търсени услуги</h3><p>На база създадените резервации.</p></div>{services.length ? <div className="service-bars">{services.map(([name, count]) => <div key={name}><span><strong>{name}</strong><b>{count}</b></span><i><b style={{ width: `${Math.max(8, count / Math.max(...services.map((row) => row[1])) * 100)}%` }} /></i></div>)}</div> : <p className="analytics-empty">Още няма достатъчно данни.</p>}</section><section className="settings-panel ai-budget-card"><div className="settings-panel-head"><h3>AI бюджет</h3><p>Този месец · плаща се само при включен AI режим.</p></div><strong>${stats.aiCostUsd.toFixed(4)}</strong><span>от ${(Number(business.ai_monthly_budget_cents || 0) / 100).toFixed(2)} лимит</span><div className="budget-track"><i style={{ width: `${Math.min(100, (stats.aiCostUsd / Math.max(0.01, Number(business.ai_monthly_budget_cents || 0) / 100)) * 100)}%` }} /></div><p>{business.ai_enabled ? 'AI режимът е включен. При лимит системата автоматично минава към безплатния guided асистент.' : 'В момента работи безплатният guided асистент.'}</p></section></div></>}</main>
}

export default function AnalyticsPage() {
  return <OwnerPage title="Резултати">{(props) => <AnalyticsContent {...props} />}</OwnerPage>
}

