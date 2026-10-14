'use client'

import { DateTime } from 'luxon'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { OwnerPage } from '../../../components/owner-page'
import { supabase } from '../../../lib/supabase'

const STATUS_LABELS = {
  bg: { booked: 'Записан', confirmed: 'Потвърден', cancelled: 'Отменен', no_show: 'Неявил се', done: 'Завършен' },
  en: { booked: 'Booked', confirmed: 'Confirmed', cancelled: 'Cancelled', no_show: 'No-show', done: 'Completed' },
}

function AppointmentsContent({ business, locale }) {
  const en = locale === 'en'
  const statusLabels = STATUS_LABELS[locale]
  const [appointments, setAppointments] = useState([])
  const [status, setStatus] = useState('loading')
  const [filter, setFilter] = useState('upcoming')
  const [error, setError] = useState('')
  const [services, setServices] = useState([])
  const [staff, setStaff] = useState([])
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual] = useState({ serviceId: '', staffId: '', date: '', startsAt: '', name: '', phone: '', email: '', notes: '' })
  const [slots, setSlots] = useState([])
  const [saving, setSaving] = useState(false)
  const [move, setMove] = useState(null)
  const [moveSlots, setMoveSlots] = useState([])

  const load = useCallback(async () => {
    setStatus('loading')
    const [appointmentsResult, servicesResult, staffResult] = await Promise.all([
      supabase.from('appointments').select('id,starts_at,ends_at,status,source,notes,created_at,service:services(id,name,duration_min,price,currency),staff:staff(id,name),customer:customers(name,phone,email)').eq('business_id', business.id).order('starts_at', { ascending: true }),
      supabase.from('services').select('id,name,duration_min').eq('business_id', business.id).eq('active', true).order('sort_order'),
      supabase.from('staff').select('id,name').eq('business_id', business.id).eq('active', true).order('sort_order'),
    ])
    const requestError = appointmentsResult.error || servicesResult.error || staffResult.error
    if (requestError) { setError(requestError.message); setStatus('error'); return }
    setAppointments(appointmentsResult.data || [])
    setServices(servicesResult.data || [])
    setStaff(staffResult.data || [])
    setStatus('ready')
  }, [business.id])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!manualOpen || !manual.serviceId || !manual.date) { setSlots([]); return }
    const query = new URLSearchParams({ service_id: manual.serviceId, date: manual.date })
    if (manual.staffId) query.set('staff_id', manual.staffId)
    fetch(`/api/public/${business.slug}/availability?${query}`).then((response) => response.json().then((body) => ({ response, body }))).then(({ response, body }) => {
      if (!response.ok) throw new Error(body.error?.message || (en ? 'We could not check availability.' : 'Неуспешна проверка на часовете.'))
      setSlots(body.slots || [])
    }).catch((requestError) => setError(requestError.message))
  }, [business.slug, en, manual.date, manual.serviceId, manual.staffId, manualOpen])
  useEffect(() => {
    if (!move?.date || !move.appointment?.service?.id) { setMoveSlots([]); return }
    const query = new URLSearchParams({ service_id: move.appointment.service.id, date: move.date })
    if (move.staffId) query.set('staff_id', move.staffId)
    fetch(`/api/public/${business.slug}/availability?${query}`).then((response) => response.json().then((body) => ({ response, body }))).then(({ response, body }) => {
      if (!response.ok) throw new Error(body.error?.message || (en ? 'We could not check availability.' : 'Неуспешна проверка на часовете.'))
      setMoveSlots(body.slots || [])
    }).catch((requestError) => setError(requestError.message))
  }, [business.slug, en, move?.appointment, move?.date, move?.staffId])

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

  async function createManualAppointment(event) {
    event.preventDefault()
    const slot = slots.find((item) => item.startsAt === manual.startsAt)
    if (!slot) { setError(en ? 'Choose an available time.' : 'Избери свободен час.'); return }
    setSaving(true); setError('')
    try {
      const response = await fetch(`/api/public/${business.slug}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceId: manual.serviceId, staffId: slot.staffId, startsAt: slot.startsAt, customer: { name: manual.name, phone: manual.phone, email: manual.email }, notes: manual.notes, consent: true, source: 'manual' }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error?.message || (en ? 'The booking could not be created.' : 'Резервацията не беше създадена.'))
      setManualOpen(false); setManual({ serviceId: '', staffId: '', date: '', startsAt: '', name: '', phone: '', email: '', notes: '' }); setSlots([])
      await load()
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }

  async function moveAppointment(event) {
    event.preventDefault()
    const slot = moveSlots.find((item) => item.startsAt === move.startsAt)
    if (!slot) { setError(en ? 'Choose a new available time.' : 'Избери нов свободен час.'); return }
    setSaving(true); setError('')
    const { error: updateError } = await supabase.from('appointments').update({ staff_id: slot.staffId, starts_at: slot.startsAt, ends_at: slot.endsAt, updated_at: new Date().toISOString() }).eq('id', move.appointment.id).eq('business_id', business.id)
    setSaving(false)
    if (updateError) { setError(updateError.code === '23P01' ? (en ? 'This time is no longer available.' : 'Този час вече е зает.') : updateError.message); return }
    setMove(null); setMoveSlots([]); await load()
  }

  return (
    <main className="dashboard-content admin-page">
      <div className="admin-page-head">
        <div><p className="auth-kicker">{en ? 'Calendar' : 'Календар'}</p><h2>{en ? 'Bookings' : 'Резервации'}</h2><p>{en ? 'Manage upcoming and past appointments.' : 'Управлявай предстоящите и миналите посещения.'}</p></div>
        <button className="primary-button" type="button" onClick={() => setManualOpen(true)}>+ {en ? 'New booking' : 'Нова резервация'}</button>
      </div>
      <div className="segmented-control" role="tablist">
        {[["upcoming", en ? 'Upcoming' : 'Предстоящи'], ['past', en ? 'Past' : 'Минали'], ['all', en ? 'All' : 'Всички']].map(([value, label]) => <button type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)} key={value}>{label}</button>)}
      </div>
      {error && <p className="form-message" role="alert">{error}</p>}
      {status === 'loading' && <div className="admin-loading"><span className="button-spinner" /> {en ? 'Loading bookings...' : 'Зареждаме резервациите...'}</div>}
      {status === 'ready' && visible.length === 0 && <div className="empty-state"><h3>{en ? 'No bookings yet' : 'Все още няма резервации'}</h3><p>{en ? 'Share your public page or create a booking manually.' : 'Сподели публичната страница или създай тестова резервация.'}</p></div>}
      {status === 'ready' && visible.length > 0 && <div className="appointment-list">
        {visible.map((item) => {
          const starts = DateTime.fromISO(item.starts_at).setZone(business.timezone).setLocale(locale)
          return <article className="appointment-row" key={item.id}>
            <div className="appointment-date"><strong>{starts.toFormat('dd')}</strong><span>{starts.toFormat('LLL')}</span><small>{starts.toFormat('HH:mm')}</small></div>
            <div className="appointment-main"><span className={`status-badge ${item.status}`}>{statusLabels[item.status]}</span><h3>{item.customer?.name || (en ? 'Client' : 'Клиент')}</h3><p>{item.service?.name} · {item.staff?.name}</p></div>
            <div className="appointment-contact"><span>{item.customer?.phone || (en ? 'No phone' : 'Без телефон')}</span><small>{item.customer?.email || (item.source === 'bot' ? (en ? 'Via assistant' : 'През AI чат') : (en ? 'Online' : 'Онлайн'))}</small></div>
            <div className="appointment-row-actions">{['booked', 'confirmed'].includes(item.status) && <button className="ghost-button" type="button" onClick={() => setMove({ appointment: item, date: '', staffId: item.staff?.id || '', startsAt: '' })}>{en ? 'Reschedule' : 'Премести'}</button>}<select aria-label={en ? 'Status' : 'Статус'} value={item.status} onChange={(event) => updateStatus(item.id, event.target.value)}>
              {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select></div>
          </article>
        })}
      </div>}
      {manualOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setManualOpen(false) }}><form className="admin-modal manual-booking-modal" role="dialog" aria-modal="true" aria-labelledby="manual-title" onSubmit={createManualAppointment}><div className="settings-panel-head"><h3 id="manual-title">{en ? 'New booking' : 'Нова резервация'}</h3><p>{en ? 'Add a phone or walk-in booking to the same calendar.' : 'Добави телефонна или присъствена резервация в същия календар.'}</p></div><div className="settings-form-grid"><label><span>{en ? 'Service' : 'Услуга'} *</span><select required value={manual.serviceId} onChange={(event) => setManual({ ...manual, serviceId: event.target.value, startsAt: '' })}><option value="">{en ? 'Choose' : 'Избери'}</option>{services.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label><span>{en ? 'Specialist' : 'Специалист'}</span><select value={manual.staffId} onChange={(event) => setManual({ ...manual, staffId: event.target.value, startsAt: '' })}><option value="">{en ? 'No preference' : 'Без предпочитание'}</option>{staff.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label><label><span>{en ? 'Date' : 'Дата'} *</span><input required type="date" min={DateTime.now().setZone(business.timezone).toISODate()} value={manual.date} onChange={(event) => setManual({ ...manual, date: event.target.value, startsAt: '' })} /></label><label><span>{en ? 'Available time' : 'Свободен час'} *</span><select required value={manual.startsAt} onChange={(event) => setManual({ ...manual, startsAt: event.target.value })}><option value="">{manual.date ? (en ? 'Choose a time' : 'Избери час') : (en ? 'Choose a date first' : 'Първо избери дата')}</option>{slots.map((slot) => <option value={slot.startsAt} key={`${slot.staffId}-${slot.startsAt}`}>{slot.localTime} · {slot.staffName}</option>)}</select></label><label><span>{en ? 'Name' : 'Име'} *</span><input required minLength={2} value={manual.name} onChange={(event) => setManual({ ...manual, name: event.target.value })} /></label><label><span>{en ? 'Phone' : 'Телефон'} *</span><input required minLength={6} type="tel" value={manual.phone} onChange={(event) => setManual({ ...manual, phone: event.target.value })} /></label><label className="full"><span>{en ? 'Email' : 'Имейл'}</span><input type="email" value={manual.email} onChange={(event) => setManual({ ...manual, email: event.target.value })} /></label><label className="full"><span>{en ? 'Note' : 'Бележка'}</span><textarea value={manual.notes} onChange={(event) => setManual({ ...manual, notes: event.target.value })} /></label></div><div className="settings-actions"><button className="secondary-button" type="button" onClick={() => setManualOpen(false)}>{en ? 'Cancel' : 'Отказ'}</button><button className="primary-button" type="submit" disabled={saving}>{saving ? (en ? 'Saving...' : 'Запазване...') : (en ? 'Create booking' : 'Създай резервация')}</button></div></form></div>}
      {move && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMove(null) }}><form className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="move-title" onSubmit={moveAppointment}><div className="settings-panel-head"><h3 id="move-title">{en ? 'Reschedule booking' : 'Премести резервацията'}</h3><p>{move.appointment.customer?.name} · {move.appointment.service?.name}</p></div><div className="settings-form-grid"><label><span>{en ? 'Specialist' : 'Специалист'}</span><select value={move.staffId} onChange={(event) => setMove({ ...move, staffId: event.target.value, startsAt: '' })}><option value="">{en ? 'No preference' : 'Без предпочитание'}</option>{staff.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label><label><span>{en ? 'New date' : 'Нова дата'} *</span><input required type="date" min={DateTime.now().setZone(business.timezone).toISODate()} value={move.date} onChange={(event) => setMove({ ...move, date: event.target.value, startsAt: '' })} /></label><label className="full"><span>{en ? 'New available time' : 'Нов свободен час'} *</span><select required value={move.startsAt} onChange={(event) => setMove({ ...move, startsAt: event.target.value })}><option value="">{move.date ? (en ? 'Choose a time' : 'Избери час') : (en ? 'Choose a date first' : 'Първо избери дата')}</option>{moveSlots.map((slot) => <option value={slot.startsAt} key={`${slot.staffId}-${slot.startsAt}`}>{slot.localTime} · {slot.staffName}</option>)}</select></label></div><p className="security-note">{en ? 'The change appears in the calendar immediately. If the client has an email address, let them know about the new time.' : 'Промяната се отразява веднага в календара. Ако клиентът има имейл, уведоми го за новия час.'}</p><div className="settings-actions"><button className="secondary-button" type="button" onClick={() => setMove(null)}>{en ? 'Cancel' : 'Отказ'}</button><button className="primary-button" type="submit" disabled={saving}>{saving ? (en ? 'Rescheduling...' : 'Преместване...') : (en ? 'Reschedule' : 'Премести часа')}</button></div></form></div>}
    </main>
  )
}

export default function AppointmentsPage() {
  return <OwnerPage title={{ bg: 'Резервации', en: 'Bookings' }}>{(props) => <AppointmentsContent {...props} />}</OwnerPage>
}
