'use client'

import Link from 'next/link'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { OwnerPage } from '../../../components/owner-page'
import { supabase } from '../../../lib/supabase'

const STATUS_LABELS = { booked: 'Записан', confirmed: 'Потвърден', cancelled: 'Отменен', no_show: 'Неявил се', done: 'Завършен' }

function AppointmentsContent({ business }) {
  const [appointments, setAppointments] = useState([])
  const [status, setStatus] = useState('loading')
  const [filter, setFilter] = useState('upcoming')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    const { data, error: requestError } = await supabase
      .from('appointments')
      .select('id,starts_at,ends_at,status,source,notes,created_at,service:services(name,duration_min,price,currency),staff:staff(name),customer:customers(name,phone,email)')
      .eq('business_id', business.id)
      .order('starts_at', { ascending: true })
    if (requestError) { setError(requestError.message); setStatus('error'); return }
    setAppointments(data || [])
    setStatus('ready')
  }, [business.id])

  useEffect(() => { load() }, [load])

  const visible = useMemo(() => {
    const now = Date.now()
    if (filter === 'upcoming') return appointments.filter((item) => new Date(item.ends_at).getTime() >= now && !['cancelled', 'done'].includes(item.status))
    if (filter === 'past') return appointments.filter((item) => new Date(item.ends_at).getTime() < now || ['cancelled', 'done', 'no_show'].includes(item.status))
    return appointments
  }, [appointments, filter])

  async function updateStatus(id, nextStatus) {
    setError('')
    const changes = { status: nextStatus, updated_at: new Date().toISOString(), ...(nextStatus === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {}) }
    const { error: updateError } = await supabase.from('appointments').update(changes).eq('id', id).eq('business_id', business.id)
    if (updateError) { setError(updateError.message); return }
    setAppointments((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item))
  }

  return (
    <main className="dashboard-content admin-page">
      <div className="admin-page-head">
        <div><p className="auth-kicker">Календар</p><h2>Резервации</h2><p>Управлявай предстоящите и миналите посещения.</p></div>
        <Link className="primary-button" href={`/book/${business.slug}`} target="_blank">Нова резервация ↗</Link>
      </div>
      <div className="segmented-control" role="tablist">
        {[['upcoming', 'Предстоящи'], ['past', 'Минали'], ['all', 'Всички']].map(([value, label]) => <button type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)} key={value}>{label}</button>)}
      </div>
      {error && <p className="form-message" role="alert">{error}</p>}
      {status === 'loading' && <div className="admin-loading"><span className="button-spinner" /> Зареждаме резервациите...</div>}
      {status === 'ready' && visible.length === 0 && <div className="empty-state"><h3>Все още няма резервации</h3><p>Сподели публичната страница или създай тестова резервация.</p></div>}
      {status === 'ready' && visible.length > 0 && <div className="appointment-list">
        {visible.map((item) => {
          const starts = DateTime.fromISO(item.starts_at).setZone(business.timezone).setLocale('bg')
          return <article className="appointment-row" key={item.id}>
            <div className="appointment-date"><strong>{starts.toFormat('dd')}</strong><span>{starts.toFormat('LLL')}</span><small>{starts.toFormat('HH:mm')}</small></div>
            <div className="appointment-main"><span className={`status-badge ${item.status}`}>{STATUS_LABELS[item.status]}</span><h3>{item.customer?.name || 'Клиент'}</h3><p>{item.service?.name} · {item.staff?.name}</p></div>
            <div className="appointment-contact"><span>{item.customer?.phone || 'Без телефон'}</span><small>{item.customer?.email || (item.source === 'bot' ? 'През AI чат' : 'Онлайн')}</small></div>
            <select aria-label="Статус" value={item.status} onChange={(event) => updateStatus(item.id, event.target.value)}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </article>
        })}
      </div>}
    </main>
  )
}

export default function AppointmentsPage() {
  return <OwnerPage title="Резервации">{(props) => <AppointmentsContent {...props} />}</OwnerPage>
}
