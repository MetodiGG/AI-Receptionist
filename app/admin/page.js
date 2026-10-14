'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandLogo } from '../../components/brand-logo'
import { PARTNER_STATUS_KEYS, PARTNER_STATUS_LABELS } from '../../lib/partner-leads.mjs'
import { getIndustryLabel } from '../../lib/public-locale.mjs'
import { supabase } from '../../lib/supabase'

export default function PlatformAdminPage() {
  const router = useRouter()
  const [overview, setOverview] = useState(null)
  const [leads, setLeads] = useState([])
  const [filter, setFilter] = useState('all')
  const [savingId, setSavingId] = useState('')
  const [savedId, setSavedId] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getSession()
    if (!auth.session) { router.replace('/'); return }
    const headers = { Authorization: `Bearer ${auth.session.access_token}` }
    const [overviewResponse, leadsResponse] = await Promise.all([
      fetch('/api/admin/overview', { headers }),
      fetch('/api/admin/partner-leads', { headers }),
    ])
    const [overviewBody, leadsBody] = await Promise.all([overviewResponse.json(), leadsResponse.json()])
    if (!overviewResponse.ok) {
      setError(overviewBody.error?.message || 'Достъпът е отказан.')
      return
    }
    setOverview(overviewBody)
    if (leadsResponse.ok) setLeads(leadsBody.leads || [])
    else setError(leadsBody.error?.message || 'Заявките за партньори още не са конфигурирани.')
  }, [router])

  useEffect(() => { load() }, [load])

  const visibleLeads = useMemo(() => filter === 'all' ? leads : leads.filter((lead) => lead.status === filter), [filter, leads])
  const newLeadCount = leads.filter((lead) => lead.status === 'new').length

  function updateLocal(id, field, value) {
    setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, [field]: value } : lead))
  }

  async function saveLead(lead) {
    setSavingId(lead.id); setSavedId(''); setError('')
    const { data: auth } = await supabase.auth.getSession()
    const response = await fetch('/api/admin/partner-leads', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${auth.session?.access_token || ''}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, status: lead.status, notes: lead.notes || '' }),
    })
    const body = await response.json()
    setSavingId('')
    if (!response.ok) { setError(body.error?.message || 'Промяната не беше запазена.'); return }
    setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, ...body.lead } : item))
    setSavedId(lead.id)
    window.setTimeout(() => setSavedId(''), 1800)
  }

  return <main className="platform-admin partner-admin-page">
    <header><div><Link className="admin-brand" href="/"><BrandLogo eager /></Link><p className="auth-kicker">Операторски център</p><h1>Партньори и платформа</h1></div><Link className="secondary-button" href="/dashboard">Към таблото</Link></header>
    {error && <p className="form-message">{error}</p>}
    {!overview && !error ? <div className="admin-loading"><span className="button-spinner" /> Проверка на достъпа...</div> : overview && <>
      <div className="analytics-kpis admin-summary-grid"><article><small>Нови заявки</small><strong>{newLeadCount}</strong><span>за контакт</span></article><article><small>Всички бизнеси</small><strong>{overview.totals.businesses}</strong><span>регистрирани</span></article><article><small>Активни</small><strong>{overview.totals.active}</strong><span>публични профили</span></article><article><small>Резервации / 30 дни</small><strong>{overview.totals.bookings30d}</strong><span>реални записи</span></article></div>

      <section className="partner-pipeline-section">
        <div className="partner-pipeline-head"><div><p className="auth-kicker">Business pipeline</p><h2>Заявки за присъединяване</h2><p>Лични контакти и статус на onboarding-а. Тази информация е достъпна само за оторизирани администратори.</p></div><div className="pipeline-filter"><label htmlFor="lead-status-filter">Статус</label><select id="lead-status-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Всички ({leads.length})</option>{PARTNER_STATUS_KEYS.map((status) => <option value={status} key={status}>{PARTNER_STATUS_LABELS[status].bg}</option>)}</select></div></div>
        {visibleLeads.length === 0 ? <div className="empty-state"><h3>Няма заявки с този статус</h3><p>Новите заявки от страницата за бизнеса ще се появят тук.</p></div> : <div className="partner-lead-list">{visibleLeads.map((lead) => <article className="partner-lead-card" key={lead.id}>
          <div className="partner-lead-main"><div><span className={`lead-status-dot ${lead.status}`} /><small>{PARTNER_STATUS_LABELS[lead.status]?.bg}</small><h3>{lead.business_name}</h3><p>{getIndustryLabel(lead.category, 'bg')} · {lead.city}</p></div><time dateTime={lead.created_at}>{new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lead.created_at))}</time></div>
          <div className="partner-lead-contact"><span><b>{lead.contact_name}</b><a href={`tel:${lead.phone}`}>{lead.phone}</a></span><span><a href={`mailto:${lead.email}`}>{lead.email}</a>{lead.website_url && <a href={lead.website_url} target="_blank" rel="noreferrer">Уебсайт / Instagram ↗</a>}</span></div>
          <div className="partner-lead-controls"><label><span>Статус</span><select value={lead.status} onChange={(event) => updateLocal(lead.id, 'status', event.target.value)}>{PARTNER_STATUS_KEYS.map((status) => <option value={status} key={status}>{PARTNER_STATUS_LABELS[status].bg}</option>)}</select></label><label className="notes"><span>Вътрешни бележки</span><textarea value={lead.notes || ''} onChange={(event) => updateLocal(lead.id, 'notes', event.target.value)} maxLength="3000" placeholder="Следваща стъпка, уговорено обаждане, нужди…" /></label><button className="primary-button" type="button" onClick={() => saveLead(lead)} disabled={savingId === lead.id}>{savingId === lead.id ? 'Запазване…' : savedId === lead.id ? 'Запазено ✓' : 'Запази'}</button></div>
        </article>)}</div>}
      </section>

      <section className="admin-business-section"><div className="partner-pipeline-head"><div><p className="auth-kicker">Активни профили</p><h2>Състояние на платформата</h2></div></div><div className="admin-business-table"><div className="admin-business-head"><span>Бизнес</span><span>Тип</span><span>Резервации</span><span>Известия</span><span>Статус</span></div>{overview.businesses.map((business) => <article key={business.id}><span><strong>{business.name}</strong><small>/{business.slug}</small></span><span>{getIndustryLabel(business.industry, 'bg')}</span><span>{business.bookings30d}</span><span className={business.failedNotifications30d ? 'has-error' : ''}>{business.failedNotifications30d}</span><span>{business.active ? 'Активен' : 'Спрян'}</span></article>)}</div></section>
    </>}
  </main>
}
