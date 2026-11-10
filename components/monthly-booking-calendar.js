'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { DateTime } from 'luxon'
import { availabilityClock, bookingCalendarWindow, bookingMonthGrid, calendarMonthTitle, calendarWeekdays, createMonthAvailabilityCache, filterMonthlyAvailability, monthAvailabilityKey, monthlyAvailabilityDaySignature, shiftCalendarMonth, validateMonthlyAvailability } from '../lib/monthly-booking-calendar.mjs'

export function MonthlyBookingCalendarView({ month, timezone, locale = 'bg', calendar, status = 'loading', selectedDate, canPrevious, canNext, onPrevious, onNext, onSelectDate, onRetry, disabled = false, headingId = 'booking-month-title' }) {
  const en = locale === 'en'
  const weekdays = calendarWeekdays(locale)
  const rows = Array.from({ length: calendar.length / 7 }, (_, index) => calendar.slice(index * 7, index * 7 + 7))
  return <section className="monthly-booking-calendar" aria-label={en ? 'Booking calendar' : 'Календар за резервация'} aria-busy={status === 'loading'}>
    <div className="monthly-calendar-heading">
      <button type="button" className="monthly-calendar-nav" aria-label={en ? 'Previous month' : 'Предишен месец'} disabled={disabled || !canPrevious} onClick={onPrevious}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg></button>
      <h3 id={headingId} aria-live="polite">{calendarMonthTitle(month, timezone, locale)}</h3>
      <button type="button" className="monthly-calendar-nav" aria-label={en ? 'Next month' : 'Следващ месец'} disabled={disabled || !canNext} onClick={onNext}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg></button>
    </div>
    <table className="monthly-calendar-table" aria-labelledby={headingId}>
      <thead><tr>{weekdays.map(day => <th key={day.full} scope="col" abbr={day.full}>{day.short}</th>)}</tr></thead>
      <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((day, column) => <td key={day?.date || `blank-${column}`}>
        {day && <button type="button" className={`monthly-calendar-day is-${day.state}${day.date === selectedDate && day.state === 'available' ? ' is-selected' : ''}${day.today ? ' is-today' : ''}`} disabled={disabled || day.state !== 'available'} aria-current={day.today ? 'date' : undefined} aria-pressed={day.date === selectedDate && day.state === 'available'} aria-label={`${DateTime.fromISO(day.date, { zone: timezone }).setLocale(en ? 'en' : 'bg').toFormat('cccc, d LLLL yyyy')}, ${day.state === 'available' ? (en ? 'available' : 'има свободни часове') : day.state === 'unknown' ? (en ? 'availability not loaded' : 'наличността не е заредена') : (en ? 'unavailable' : 'няма свободни часове')}`} onClick={() => onSelectDate?.(day.date, day.slots)}><span>{day.day}</span>{day.today && <i aria-hidden="true" />}</button>}
      </td>)}</tr>)}</tbody>
    </table>
    <div className="monthly-calendar-footer">
      {status === 'error' ? <p className="monthly-calendar-error" role="status"><span>{en ? 'Calendar could not load.' : 'Календарът не се зареди.'}</span><button type="button" disabled={disabled} onClick={onRetry}>{en ? 'Retry' : 'Опитай пак'}</button></p> : status === 'loading' ? <p className="monthly-calendar-loading" role="status">{en ? 'Checking availability…' : 'Проверяваме наличността…'}</p> : <p className="monthly-calendar-legend"><span><i className="is-available" aria-hidden="true" />{en ? 'Available' : 'Свободни'}</span><span><i className="is-unavailable" aria-hidden="true" />{en ? 'Unavailable' : 'Заети'}</span></p>}
    </div>
  </section>
}

export function MonthlyBookingCalendar({ business, serviceId, staffId = '', locale = 'bg', selectedDate = '', onSelectDate, onInvalidateSelection, onData, onLoadingChange, refreshKey = 0, active = true, disabled = false, previewMonthLoader }) {
  const headingId = useId()
  const [now, setNow] = useState(() => Date.now())
  const range = bookingCalendarWindow(business, now)
  const context = JSON.stringify([business.id, business.slug, business.timezone, business.booking_window_days, business.minimum_notice_minutes, serviceId, staffId, Boolean(previewMonthLoader)])
  const [view, setView] = useState(() => ({ context, month: range.firstMonth }))
  const month = view.context === context && view.month >= range.firstMonth && view.month <= range.lastMonth ? view.month : range.firstMonth
  const params = { business, serviceId, staffId, month }
  const requestKey = `${context}:${monthAvailabilityKey(params)}`
  const [request, setRequest] = useState({ key: '', version: 0, status: 'loading', payload: null, receivedAt: 0 })
  const [retry, setRetry] = useState(0)
  const callbacks = useRef({})
  callbacks.current = { onSelectDate, onInvalidateSelection, onData, onLoadingChange }
  const loader = useRef(null)
  loader.current = async input => {
    let payload
    if (previewMonthLoader) payload = await previewMonthLoader(input)
    else {
      const query = new URLSearchParams({ service_id: input.serviceId, month: input.month })
      if (input.staffId) query.set('staff_id', input.staffId)
      const response = await fetch(`/api/public/${encodeURIComponent(input.business.slug)}/availability/month?${query}`, { signal: input.signal, cache: 'no-store' })
      if (!response.ok) throw new Error('Monthly availability request failed')
      payload = await response.json()
    }
    return validateMonthlyAvailability(payload, input.month)
  }
  const cache = useRef(null)
  if (!cache.current) cache.current = createMonthAvailabilityCache({ loadMonth: input => loader.current(input) })
  const previousContext = useRef(context)
  const previousLoad = useRef({ active: false, refreshKey, retry, today: range.today })
  const generation = useRef(0)

  useEffect(() => {
    if (!active) return
    // Recheck expiry while the screen is open, including today's short-notice
    // slots. A fresh authoritative server check still happens on submission.
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [active])

  useEffect(() => {
    if (previousContext.current !== context) {
      previousContext.current = context
      cache.current.invalidate()
      callbacks.current.onInvalidateSelection?.()
    }
    const id = ++generation.current
    const prior = previousLoad.current
    const force = !prior.active || prior.refreshKey !== refreshKey || prior.retry !== retry || prior.today !== range.today
    previousLoad.current = { active, refreshKey, retry, today: range.today }
    if (!active || !serviceId) {
      setRequest({ key: requestKey, version: id, status: 'idle', payload: null, receivedAt: 0 })
      return
    }
    if (force) cache.current.invalidate()
    const controller = new AbortController()
    setRequest({ key: requestKey, version: id, status: 'loading', payload: null, receivedAt: 0 })
    cache.current.load(params, { signal: controller.signal }).then(payload => {
      if (controller.signal.aborted || generation.current !== id) return
      setRequest({ key: requestKey, version: id, status: 'ready', payload, receivedAt: cache.current.receivedAt(params) || Date.now() })
    }).catch(error => {
      if (controller.signal.aborted || generation.current !== id || error.name === 'AbortError') return
      setRequest({ key: requestKey, version: id, status: 'error', payload: null, receivedAt: 0 })
    })
    return () => controller.abort()
  // Params are represented by the complete context and month key. In particular,
  // language changes do not repeat network work or clear a valid selection.
  }, [active, requestKey, refreshKey, retry, context, serviceId, range.today])

  useEffect(() => () => cache.current.dispose(), [])

  const current = request.key === requestKey && active ? request : { status: 'loading', payload: null, receivedAt: 0 }
  useEffect(() => {
    if (!disabled) callbacks.current.onLoadingChange?.(Boolean(active && serviceId && current.status === 'loading'))
  }, [current.status, active, serviceId, disabled])
  const filtered = useMemo(() => current.payload ? filterMonthlyAvailability(current.payload, { now: availabilityClock(current.payload, current.receivedAt, now), minimumNoticeMinutes: business.minimum_notice_minutes }) : null, [current.payload, current.receivedAt, now, business.minimum_notice_minutes])
  const dataSignature = filtered ? `${requestKey}:${current.version}:${monthlyAvailabilityDaySignature(filtered)}` : ''
  const lastNotified = useRef('')
  useEffect(() => {
    if (!filtered || current.status !== 'ready') { lastNotified.current = ''; return }
    // Keep the immutable in-flight booking choice intact. Expiry/refresh data is
    // applied immediately after submission unlocks, rather than clearing the
    // date while the server is confirming that same appointment.
    if (disabled) return
    if (lastNotified.current !== dataSignature) {
      lastNotified.current = dataSignature
      callbacks.current.onData?.(filtered)
    }
    if (selectedDate && !filtered.days.some(day => day.date === selectedDate && day.slots.length)) callbacks.current.onInvalidateSelection?.()
  }, [dataSignature, current.status, selectedDate, disabled])

  const bounds = filtered || range
  const calendar = bookingMonthGrid({ month, timezone: bounds.timezone, today: bounds.today, firstBookableDate: bounds.firstBookableDate, lastBookableDate: bounds.lastBookableDate, days: filtered?.days, status: current.status })
  const firstMonth = bounds.firstBookableDate.slice(0, 7)
  const lastMonth = bounds.lastBookableDate.slice(0, 7)
  function navigate(amount) {
    if (disabled) return
    const next = shiftCalendarMonth(month, amount, bounds.timezone)
    if (!next || next < firstMonth || next > lastMonth) return
    callbacks.current.onInvalidateSelection?.()
    setView({ context, month: next })
  }
  function selectDate(date, slots) {
    if (disabled) return
    const checked = filterMonthlyAvailability({ days: [{ date, slots }] }, { now: availabilityClock(current.payload, current.receivedAt, Date.now()), minimumNoticeMinutes: business.minimum_notice_minutes }).days[0].slots
    if (checked.length) callbacks.current.onSelectDate?.(date, checked)
    else { callbacks.current.onInvalidateSelection?.(); setNow(Date.now()) }
  }
  return <MonthlyBookingCalendarView month={month} timezone={bounds.timezone} locale={locale} calendar={calendar} status={current.status} selectedDate={selectedDate} canPrevious={month > firstMonth} canNext={month < lastMonth} onPrevious={() => navigate(-1)} onNext={() => navigate(1)} onSelectDate={selectDate} onRetry={() => { if (!disabled) setRetry(value => value + 1) }} disabled={disabled} headingId={headingId} />
}
