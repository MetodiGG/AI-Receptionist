'use client'

import { DateTime } from 'luxon'
import { useEffect, useRef, useState } from 'react'
import { DateMenu } from './date-menu'
import { Icon } from './icon'
import { BookingIntakeFields } from './booking-intake-fields'
import { supabase } from '../lib/supabase'
import { bookingSlotKey } from '../lib/booking-safety.mjs'
import { localizedApiMessage } from '../lib/localized-api-message.mjs'
import { containDialogTab } from '../lib/dialog-focus.mjs'

// This dialog owns its input/availability state: typing must not recalculate
// the owner's day/week/month calendar behind the modal.
export function OwnerManualBookingDialog({ business, locale = 'bg', services, staff, initialDate = '', initialStaffId = '', onClose, onCreated, preview = false, previewAvailabilityLoader }) {
  const en = locale === 'en'
  const [manual, setManual] = useState(() => ({ serviceId: '', staffId: staff.some(person => person.id === initialStaffId) ? initialStaffId : '', date: initialDate, startsAt: '', name: '', phone: '', email: '', notes: '' }))
  const [intake, setIntake] = useState({})
  const [availability, setAvailability] = useState({ key: '', status: 'idle', slots: [], error: '' })
  const [attempt, setAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dialog = useRef(null), savingRef = useRef(false), mounted = useRef(false), request = useRef(null)
  const key = JSON.stringify([business.id, business.slug, manual.serviceId, manual.staffId, manual.date])
  const currentKey = useRef(key)
  currentKey.current = key
  const validContext = services.some(service => service.id === manual.serviceId) && Boolean(manual.date) && (!manual.staffId || staff.some(person => person.id === manual.staffId))
  const current = availability.key === key ? availability : { status: 'idle', slots: [], error: '' }
  const slots = current.status === 'ready' ? current.slots : []
  const selectedSlot = slots.find(slot => bookingSlotKey(slot) === manual.startsAt)

  useEffect(() => {
    const node = dialog.current, previous = document.activeElement, overflow = document.body.style.overflow
    mounted.current = true
    node.showModal(); document.body.style.overflow = 'hidden'
    node.querySelector('.owner-appointment-dialog-close')?.focus()
    return () => {
      mounted.current = false; request.current?.abort()
      node.close(); document.body.style.overflow = overflow
      if (previous?.isConnected) previous.focus()
    }
  }, [])

  useEffect(() => {
    if (!validContext || business.booking_mode === 'external') {
      setAvailability({ key, status: 'idle', slots: [], error: '' })
      return
    }
    const controller = new AbortController()
    request.current = controller
    let active = true
    const isCurrent = () => active && !controller.signal.aborted && currentKey.current === key
    setAvailability({ key, status: 'loading', slots: [], error: '' })
    async function load() {
      try {
        let body
        if (preview) {
          if (typeof previewAvailabilityLoader !== 'function') throw Error('PREVIEW_AVAILABILITY_REQUIRED')
          body = await previewAvailabilityLoader({ business, serviceId: manual.serviceId, staffId: manual.staffId, date: manual.date, signal: controller.signal })
        } else {
          const query = new URLSearchParams({ service_id: manual.serviceId, date: manual.date })
          if (manual.staffId) query.set('staff_id', manual.staffId)
          const response = await fetch(`/api/public/${encodeURIComponent(business.slug)}/availability?${query}`, { signal: controller.signal, cache: 'no-store' })
          body = await response.json()
          if (!response.ok) throw Error(localizedApiMessage(body.error, locale))
        }
        if (!Array.isArray(body?.slots)) throw Error('INVALID_AVAILABILITY')
        if (isCurrent()) {
          setAvailability({ key, status: 'ready', slots: body.slots, error: '' })
          setManual(value => value.startsAt && !body.slots.some(slot => bookingSlotKey(slot) === value.startsAt) ? { ...value, startsAt: '' } : value)
        }
      } catch (failure) {
        if (isCurrent()) setAvailability({ key, status: 'error', slots: [], error: en ? 'We could not load available times. Try again.' : 'Не успяхме да заредим свободните часове. Опитай отново.' })
      }
    }
    load()
    return () => { active = false; controller.abort() }
  }, [business.id, business.slug, business.booking_mode, manual.serviceId, manual.staffId, manual.date, validContext, key, locale, en, preview, previewAvailabilityLoader, attempt])

  function close() { if (!savingRef.current) onClose() }
  function changeContext(patch) {
    if (savingRef.current) return
    request.current?.abort()
    setManual(value => ({ ...value, ...patch, startsAt: '' }))
    setAvailability({ key: '', status: 'idle', slots: [], error: '' }); setError('')
  }
  function changeCustomer(field, value) { if (!savingRef.current) setManual(current => ({ ...current, [field]: value })) }
  function refreshAvailability() {
    if (savingRef.current) return
    request.current?.abort()
    setManual(value => ({ ...value, startsAt: '' }))
    setAvailability({ key: '', status: 'idle', slots: [], error: '' })
    setAttempt(value => value + 1)
  }

  async function submit(event) {
    event.preventDefault()
    // A ref closes the gap before React commits the disabled button state.
    if (savingRef.current || preview) return
    if (business.booking_mode === 'external') { setError(localizedApiMessage({ code: 'EXTERNAL_BOOKING', message: 'Резервациите се управляват от външната система на бизнеса.' }, locale)); return }
    if (!validContext || !selectedSlot) { setError(en ? 'Choose an available time.' : 'Избери свободен час.'); return }
    if (event.currentTarget?.checkValidity && !event.currentTarget.checkValidity()) { event.currentTarget.reportValidity?.(); return }
    savingRef.current = true; setSaving(true); setError('')
    let confirmed = false
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) throw Error(en ? 'Please sign in again.' : 'Влез отново в профила си.')
      if (!mounted.current) return
      const response = await fetch(`/api/public/${encodeURIComponent(business.slug)}/bookings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ serviceId: manual.serviceId, staffId: selectedSlot.staffId, startsAt: selectedSlot.startsAt, customer: { name: manual.name, phone: manual.phone, email: manual.email }, notes: manual.notes, intake, locale, consent: true, source: 'manual' }),
      })
      const body = await response.json()
      if (!response.ok) {
        const failure = Error(localizedApiMessage(body.error, locale))
        failure.conflict = response.status === 409 || body.error?.code === 'SLOT_UNAVAILABLE'
        throw failure
      }
      if (!body.booking?.appointment?.id) throw Error(en ? 'The booking confirmation could not be read. Refresh the calendar before trying again.' : 'Не успяхме да прочетем потвърждението. Обнови календара, преди да опиташ отново.')
      confirmed = true
      if (mounted.current) {
        setManual(value => ({ ...value, startsAt: '' }))
        setAvailability({ key: '', status: 'idle', slots: [], error: '' })
        await onCreated?.(body.booking)
      }
    } catch (failure) {
      if (mounted.current) {
        setError(confirmed ? (en ? 'Booking created. Refresh the calendar to see it.' : 'Резервацията е създадена. Обнови календара, за да я видиш.') : failure.message || (en ? 'We could not create the booking. Try again.' : 'Не успяхме да създадем резервацията. Опитай отново.'))
        if (failure.conflict) {
          request.current?.abort()
          setManual(value => ({ ...value, startsAt: '' }))
          setAvailability({ key: '', status: 'idle', slots: [], error: '' })
          setAttempt(value => value + 1)
        }
      }
    } finally { savingRef.current = false; if (mounted.current) setSaving(false) }
  }

  const timePrompt = current.status === 'loading' ? (en ? 'Checking availability…' : 'Проверяваме часовете…')
    : current.status === 'error' ? (en ? 'Could not load times' : 'Часовете не са заредени')
    : !manual.serviceId ? (en ? 'Choose a service first' : 'Първо избери услуга')
    : !manual.date ? (en ? 'Choose a date first' : 'Първо избери дата')
    : current.status === 'ready' && !slots.length ? (en ? 'No available times' : 'Няма свободни часове')
    : (en ? 'Choose a time' : 'Избери час')

  return <dialog ref={dialog} className="admin-modal owner-appointment-dialog manual-booking-modal" aria-labelledby="manual-title" aria-busy={saving} onCancel={event => { event.preventDefault(); close() }} onKeyDown={event => containDialogTab(event, dialog.current)} onClick={event => {
    if (event.target !== event.currentTarget) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close()
  }}><form onSubmit={submit}>
    <header className="owner-appointment-dialog-head"><div><h3 id="manual-title">{en ? 'New booking' : 'Нова резервация'}</h3><p>{en ? 'Add a booking to your calendar.' : 'Добави резервация в календара си.'}</p></div><button type="button" className="owner-appointment-dialog-close" disabled={saving} onClick={close} aria-label={en ? 'Close new booking' : 'Затвори новата резервация'}><Icon name="close"/></button></header>
    <fieldset className="owner-manual-fields" disabled={saving}>
      <div className="settings-form-grid">
        <label><span>{en ? 'Service' : 'Услуга'} *</span><select name="serviceId" required value={manual.serviceId} onChange={event => changeContext({ serviceId: event.target.value })}><option value="">{en ? 'Choose' : 'Избери'}</option>{services.map(service => <option value={service.id} key={service.id}>{service.name}</option>)}</select></label>
        <label><span>{en ? 'Specialist' : 'Специалист'}</span><select name="staffId" value={manual.staffId} onChange={event => changeContext({ staffId: event.target.value })}><option value="">{en ? 'No preference' : 'Без предпочитание'}</option>{staff.map(person => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label>
        <div className="calendar-form-date"><span>{en ? 'Date' : 'Дата'} *</span><DateMenu locale={locale} timezone={business.timezone} required minDate={DateTime.now().setZone(business.timezone || 'Europe/Sofia').toISODate()} value={manual.date} onChange={date => changeContext({ date })}/></div>
        <label><span>{en ? 'Available time' : 'Свободен час'} *</span><select name="startsAt" required disabled={saving || current.status !== 'ready' || !slots.length} value={manual.startsAt} onChange={event => {
          if (!savingRef.current) setManual(value => ({ ...value, startsAt: slots.some(slot => bookingSlotKey(slot) === event.target.value) ? event.target.value : '' }))
        }}><option value="">{timePrompt}</option>{slots.map(slot => <option value={bookingSlotKey(slot)} key={bookingSlotKey(slot)}>{slot.localTime}–{slot.localEndTime} · {slot.staffName}</option>)}</select></label>
        <label><span>{en ? 'Name' : 'Име'} *</span><input name="customerName" required minLength={2} autoComplete="name" value={manual.name} onChange={event => changeCustomer('name', event.target.value)}/></label>
        <label><span>{en ? 'Phone' : 'Телефон'} *</span><input name="customerPhone" required minLength={6} type="tel" autoComplete="tel" value={manual.phone} onChange={event => changeCustomer('phone', event.target.value)}/></label>
        <label className="full"><span>{en ? 'Email' : 'Имейл'} *</span><input name="customerEmail" required type="email" autoComplete="email" inputMode="email" maxLength={180} value={manual.email} onChange={event => changeCustomer('email', event.target.value)}/></label>
        <label className="full"><span>{en ? 'Note' : 'Бележка'}</span><textarea name="notes" value={manual.notes} onChange={event => changeCustomer('notes', event.target.value)} maxLength={600} rows={2}/></label>
      </div>
      <BookingIntakeFields industry={business.industry} locale={locale} value={intake} onChange={value => { if (!savingRef.current) setIntake(value) }}/>
    </fieldset>
    {current.status === 'loading' && <p className="owner-manual-availability-feedback" role="status">{en ? 'Checking available times…' : 'Проверяваме свободните часове…'}</p>}
    {current.status === 'error' && <div className="owner-manual-availability-feedback" role="alert"><p>{current.error}</p><button type="button" className="secondary-button" disabled={saving} onClick={refreshAvailability}>{en ? 'Try again' : 'Опитай отново'}</button></div>}
    {error && <p className="form-message owner-manual-submit-error" role="alert">{error}</p>}
    {preview && <p className="owner-manual-preview-note">{en ? 'Fictional preview · creating bookings is disabled.' : 'Измислен преглед · създаването на резервации е изключено.'}</p>}
    <footer className="settings-actions"><button className="secondary-button" type="button" disabled={saving} onClick={close}>{en ? 'Cancel' : 'Отказ'}</button><button className="primary-button" type="submit" disabled={preview || saving || !validContext || !selectedSlot}>{saving ? (en ? 'Saving…' : 'Запазване…') : (en ? 'Create booking' : 'Създай резервация')}</button></footer>
  </form></dialog>
}
