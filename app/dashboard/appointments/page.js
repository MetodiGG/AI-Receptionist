'use client'

import { DateTime } from 'luxon'
import { DateMenu } from '../../../components/date-menu'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { OwnerPage } from '../../../components/owner-page'
import { AppointmentCalendar } from '../../../components/appointment-calendar'
import { OwnerManualBookingDialog } from '../../../components/owner-manual-booking-dialog'
import { supabase } from '../../../lib/supabase'
import { bookingSlotKey } from '../../../lib/booking-safety.mjs'
import { scheduleWriteError } from '../../../lib/business-schedule.mjs'

function AppointmentsContent({ business, locale }) {
  const en = locale === 'en'
  const [appointments, setAppointments] = useState([])
  const [status, setStatus] = useState('loading')
  const [updatingId, setUpdatingId] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [services, setServices] = useState([])
  const [staff, setStaff] = useState([])
  const [manualContext, setManualContext] = useState(null)
  const [saving, setSaving] = useState(false)
  const [move, setMove] = useState(null)
  const [moveSlots, setMoveSlots] = useState([])
  const [moveSlotsLoading, setMoveSlotsLoading] = useState(false)

  const load = useCallback(async () => {
    setStatus((current) => current === 'ready' ? current : 'loading')
    setRefreshing(true)
    setError('')
    const [appointmentsResult, servicesResult, staffResult] = await Promise.all([
      supabase.from('appointments').select('id,starts_at,ends_at,status,source,notes,created_at,service:services(id,name,duration_min,price,currency),staff:staff(id,name),customer:customers(name,phone,email)').eq('business_id', business.id).order('starts_at', { ascending: true }),
      supabase.from('services').select('id,name,duration_min').eq('business_id', business.id).eq('active', true).order('sort_order'),
      supabase.from('staff').select('id,name').eq('business_id', business.id).eq('active', true).order('sort_order'),
    ])
    const requestError = appointmentsResult.error || servicesResult.error || staffResult.error
    setRefreshing(false)
    if (requestError) { setError(requestError.message); setStatus((current) => current === 'ready' ? current : 'error'); return }
    setAppointments(appointmentsResult.data || [])
    setServices(servicesResult.data || [])
    setStaff(staffResult.data || [])
    setStatus('ready')
  }, [business.id])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const refreshVisible = () => { if (document.visibilityState === 'visible') load() }
    window.addEventListener('focus', refreshVisible)
    const timer = window.setInterval(refreshVisible, 60000)
    return () => { window.removeEventListener('focus', refreshVisible); window.clearInterval(timer) }
  }, [load])
  useEffect(() => {
    if (!move?.date || !move.appointment?.service?.id) { setMoveSlots([]); setMoveSlotsLoading(false); return }
    const controller = new AbortController()
    setMoveSlots([]); setMoveSlotsLoading(true)
    const query = new URLSearchParams({ service_id: move.appointment.service.id, date: move.date })
    query.set('business_id',business.id);query.set('appointment_id',move.appointment.id)
    if (move.staffId) query.set('staff_id', move.staffId)
    supabase.auth.getSession().then(({data})=>{if(!data.session)throw new Error(en?'Please sign in again.':'Влез отново.');return fetch(`/api/owner/appointment-availability?${query}`,{headers:{Authorization:`Bearer ${data.session.access_token}`},signal:controller.signal})}).then((response) => response.json().then((body) => ({ response, body }))).then(({ response, body }) => {
      if (!response.ok) throw new Error(body.error?.message || (en ? 'We could not check availability.' : 'Неуспешна проверка на часовете.'))
      if (!controller.signal.aborted) setMoveSlots(body.slots || [])
    }).catch((requestError) => { if (!controller.signal.aborted) setError(requestError.message) }).finally(() => { if (!controller.signal.aborted) setMoveSlotsLoading(false) })
    return () => controller.abort()
  }, [business.slug, en, move?.appointment, move?.date, move?.staffId])

  async function updateStatus(id, nextStatus) {
    setError(''); setUpdatingId(id)
    const changes = { status: nextStatus, updated_at: new Date().toISOString(), ...(nextStatus === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {}) }
    const { data, error: updateError } = await supabase.from('appointments').update(changes).eq('id', id).eq('business_id', business.id).select('id').maybeSingle()
    setUpdatingId('')
    if (updateError || !data) { setError(updateError?.code === '23P01' ? (en ? 'This time overlaps another booking.' : 'Този час се застъпва с друга резервация.') : updateError ? scheduleWriteError(updateError, locale) : (en ? 'The booking was not updated. Refresh and try again.' : 'Резервацията не е обновена. Презареди и опитай отново.')); return }
    setAppointments((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item))
  }

  function openManualBooking({ date = '', staffId = '' } = {}) {
    if(['external','phone'].includes(business.booking_mode)){setError(en?'New appointments are arranged outside the GoRez calendar. Existing GoRez visits remain below.':'Новите резервации се уговарят извън календара на GoRez. Съществуващите GoRez посещения остават отдолу.');return}
    if(status !== 'ready' || !services.length){setError(en?'Add an active service before creating a booking.':'Добави активна услуга, преди да създадеш резервация.');return}
    setError('')
    setManualContext({ date, staffId })
  }

  async function moveAppointment(event) {
    event.preventDefault()
    const slot = moveSlots.find((item) => bookingSlotKey(item) === move.startsAt)
    if (!slot) { setError(en ? 'Choose a new available time.' : 'Избери нов свободен час.'); return }
    setSaving(true); setError('')
    const { data, error: updateError } = await supabase.from('appointments').update({ staff_id: slot.staffId, starts_at: slot.startsAt, ends_at: slot.endsAt, updated_at: new Date().toISOString() }).eq('id', move.appointment.id).eq('business_id', business.id).in('status', ['booked', 'confirmed']).select('id').maybeSingle()
    setSaving(false)
    if (updateError || !data) { setError(updateError?.code === '23P01' ? (en ? 'This time is no longer available.' : 'Този час вече е зает.') : updateError ? scheduleWriteError(updateError, locale) : (en ? 'The booking changed. Refresh before trying again.' : 'Резервацията е променена. Обнови преди нов опит.')); return }
    setMove(null); setMoveSlots([]); await load()
  }

  return (
    <main className="dashboard-content admin-page">
      <div className="admin-page-head">
        <div><p className="auth-kicker">{en ? 'Calendar' : 'Календар'}</p><h2>{en ? 'Bookings' : 'Резервации'}</h2><p>{en ? 'Manage upcoming and past appointments.' : 'Управлявай предстоящите и миналите посещения.'}</p></div>
        <div className="booking-owner-actions"><Link className="secondary-button" href="/dashboard/settings?section=timeoff">{en ? 'Block time / break' : 'Блокирай време / почивка'}</Link><button className="primary-button" type="button" disabled={['external','phone'].includes(business.booking_mode) || status !== 'ready'} onClick={() => openManualBooking()}>+ {en ? 'New booking' : 'Нова резервация'}</button></div>
      </div>
      {error && <p className="form-message" role="alert">{error}</p>}
      {status === 'loading' && <div className="admin-loading"><span className="button-spinner" /> {en ? 'Loading bookings...' : 'Зареждаме резервациите...'}</div>}
      {status === 'ready' && <AppointmentCalendar appointments={appointments} staff={staff} timezone={business.timezone} locale={locale} updatingId={updatingId} actionError={error} refreshing={refreshing} onStatusChange={updateStatus} onReschedule={(item) => setMove({ appointment: item, date: '', staffId: item.staff?.id || '', startsAt: '' })} onCreateBooking={openManualBooking} onRefresh={load} />}
      {manualContext && <OwnerManualBookingDialog key={business.id} business={business} locale={locale} services={services} staff={staff} initialDate={manualContext.date} initialStaffId={manualContext.staffId} onClose={() => setManualContext(null)} onCreated={async () => { setManualContext(null); await load() }}/>}
      {move && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMove(null) }}>
        <form className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="move-title" onSubmit={moveAppointment}>
          <div className="settings-panel-head"><h3 id="move-title">{en ? 'Reschedule booking' : 'Премести резервацията'}</h3><p>{move.appointment.customer?.name} · {move.appointment.service?.name}</p></div>
          <div className="settings-form-grid">
            <label><span>{en ? 'Specialist' : 'Специалист'}</span><select value={move.staffId} onChange={(event) => setMove({ ...move, staffId: event.target.value, startsAt: '' })}><option value="">{en ? 'No preference' : 'Без предпочитание'}</option>{staff.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label>
            <div className="calendar-form-date"><span>{en ? 'New date' : 'Нова дата'} *</span><DateMenu locale={locale} timezone={business.timezone} minDate={DateTime.now().setZone(business.timezone).toISODate()} value={move.date} onChange={date => setMove({ ...move, date, startsAt: '' })}/></div>
            <label className="full"><span>{en ? 'New available time' : 'Нов свободен час'} *</span><select required disabled={moveSlotsLoading} value={move.startsAt} onChange={(event) => setMove({ ...move, startsAt: event.target.value })}><option value="">{moveSlotsLoading ? (en ? 'Checking availability…' : 'Проверяваме часовете…') : move.date ? (en ? 'Choose a time' : 'Избери час') : (en ? 'Choose a date first' : 'Първо избери дата')}</option>{moveSlots.map((slot) => <option value={bookingSlotKey(slot)} key={bookingSlotKey(slot)}>{slot.localTime}–{slot.localEndTime} · {slot.staffName}</option>)}</select></label>
          </div>
          <p className="security-note">{en ? 'The calendar updates immediately. When booking emails are enabled, a change email is queued for bookings created with email notifications. Contact the client directly if delivery is not confirmed.' : 'Календарът се обновява веднага. При включени имейл известия се планира съобщение за резервациите, създадени с имейл известяване. Свържи се директно с клиента, ако доставката не е потвърдена.'}</p>
          {error && <p className="form-message" role="alert">{error}</p>}
          <div className="settings-actions"><button className="secondary-button" type="button" onClick={() => setMove(null)}>{en ? 'Cancel' : 'Отказ'}</button><button className="primary-button" type="submit" disabled={saving || moveSlotsLoading || !move.startsAt}>{saving ? (en ? 'Rescheduling...' : 'Преместване...') : (en ? 'Reschedule' : 'Премести часа')}</button></div>
        </form>
      </div>}
    </main>
  )
}

export default function AppointmentsPage() {
  return <OwnerPage title={{ bg: 'Резервации', en: 'Bookings' }}>{(props) => <AppointmentsContent {...props} />}</OwnerPage>
}
