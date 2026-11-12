'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { DateTime } from 'luxon'

const STATUSES = ['booked', 'confirmed', 'done', 'cancelled', 'no_show']
const LABELS = {
  booked: ['Записани', 'Booked'], confirmed: ['Потвърдени', 'Confirmed'], done: ['Завършени', 'Completed'],
  cancelled: ['Отказани', 'Cancelled'], no_show: ['Неявили се', 'No-shows'],
}
const label = (key, en) => LABELS[key]?.[en ? 1 : 0] || (en ? 'Other' : 'Друг')
const integer = value => Number.isSafeInteger(value) && value >= 0
function initialFilters(context, zone) {
  const today = DateTime.now().setZone(zone).startOf('day')
  const from = today.minus({ days: 29 }).toISODate(), to = today.toISODate()
  return { context, from, to, basis: 'visit', appliedFrom: from, appliedTo: to, appliedBasis: 'visit', status: 'all', view: 'bookings', page: 1, validation: '' }
}
function periodError(from, to, zone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return 'invalid'
  const start = DateTime.fromISO(from, { zone }), end = DateTime.fromISO(to, { zone })
  if (!start.isValid || !end.isValid || end < start) return 'invalid'
  return end.diff(start, 'days').days + 1 > 366 ? 'long' : ''
}
function validResponse(value, businessId, query, zone) {
  return value?.business?.id === businessId && value.period?.from === query.from && value.period?.to === query.to && value.period?.basis === query.basis && value.period?.timezone === zone &&
    value.view === query.view && value.page === query.page && value.pageSize === query.limit && integer(value.totalRows) && integer(value.totalPages) &&
    integer(value.summary?.bookings) && integer(value.summary?.customers) && STATUSES.every(status => integer(value.summary?.statuses?.[status])) &&
    integer(value.filtered?.bookings) && integer(value.filtered?.customers) && Array.isArray(value.rows) && value.rows.length <= query.limit &&
    value.rows.every(row => row && typeof row.id === 'string' && (query.view === 'bookings' ? STATUSES.includes(row.status) : integer(row.bookings)))
}
function emptyPreview(query, business, zone) {
  return { business: { id: business.id, name: business.name, timezone: zone, bookingMode: business.booking_mode }, period: { from: query.from, to: query.to, basis: query.basis, timezone: zone }, summary: { bookings: 0, customers: 0, statuses: Object.fromEntries(STATUSES.map(status => [status, 0])) }, filtered: { bookings: 0, customers: 0 }, view: query.view, page: query.page, pageSize: query.limit, totalRows: 0, totalPages: 0, rows: [] }
}
function displayDate(value, zone, locale, time = false) {
  if (!value) return '—'
  const date = DateTime.fromISO(value, { zone, setZone: true }).setZone(zone).setLocale(locale === 'en' ? 'en-GB' : 'bg')
  return date.isValid ? date.toFormat(time ? 'dd LLL yyyy, HH:mm' : 'dd LLL yyyy') : '—'
}
function CustomerContact({ customer, en }) {
  return <div className="admin-report-customer"><strong>{customer?.name || (en ? 'Unavailable customer' : 'Недостъпен клиент')}</strong>{customer?.phone && <span>{customer.phone}</span>}{customer?.email && <span>{customer.email}</span>}</div>
}

/** Private, read-only report. `send` must be the verified-admin request helper. */
export function AdminBusinessReport({ business, send, locale = 'bg', preview = null }) {
  const en = locale === 'en', fieldId = useId()
  const zone = business.timezone || 'Europe/Sofia', context = `${business.id}:${zone}`
  const [stored, setStored] = useState(() => initialFilters(context, zone))
  // Derive fresh controls before effects run: switching business must never paint
  // another business's contacts, period or rows, even for one frame.
  const filters = stored.context === context ? stored : initialFilters(context, zone)
  const [result, setResult] = useState(null), [attempt, setAttempt] = useState(0)
  const sequence = useRef(0)
  const query = { from: filters.appliedFrom, to: filters.appliedTo, basis: filters.appliedBasis, status: filters.status, view: filters.view, page: filters.page, limit: 25 }
  const key = JSON.stringify([context, ...Object.values(query), attempt])
  const current = result?.key === key ? result : null
  const data = current?.data
  function update(patch) { setStored({ ...filters, ...patch }) }
  useEffect(() => {
    const version = ++sequence.current, controller = new AbortController()
    let active = true
    setResult(null)
    const params = new URLSearchParams(Object.entries(query).map(([name, value]) => [name, String(value)]))
    const request = preview ? Promise.resolve().then(() => typeof preview === 'function' ? preview(query, business) : emptyPreview(query, business, zone)) :
      Promise.resolve().then(() => send(`/api/admin/businesses/${encodeURIComponent(business.id)}/report?${params}`, { method: 'GET', cache: 'no-store', signal: controller.signal }))
    request.then(value => {
      if (!active || version !== sequence.current) return
      if (!validResponse(value, business.id, query, zone)) throw new Error('REPORT_MISMATCH')
      setResult({ key, data: value })
    }).catch(problem => {
      if (active && version === sequence.current && !controller.signal.aborted) setResult({ key, error: problem?.code || 'REPORT_UNAVAILABLE' })
    })
    return () => { active = false; sequence.current++; controller.abort() }
    // A scalar key contains every query parameter, business context and retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, send, preview])
  function apply(event) {
    event.preventDefault()
    const validation = periodError(filters.from, filters.to, zone)
    if (validation) { update({ validation }); return }
    update({ appliedFrom: filters.from, appliedTo: filters.to, appliedBasis: filters.basis, page: 1, validation: '' })
  }
  const statusLabel = key => label(key, en)
  const sourceLabel = value => ({ web: en ? 'Website' : 'Сайт', bot: en ? 'Assistant' : 'Асистент', manual: en ? 'Manual entry' : 'Ръчно добавена' })[value] || (en ? 'Other' : 'Друг')
  const external = business.booking_mode === 'external' || business.booking_mode === 'phone' || data?.business?.bookingMode === 'external' || data?.business?.bookingMode === 'phone'
  const pendingDraft = filters.from !== filters.appliedFrom || filters.to !== filters.appliedTo || filters.basis !== filters.appliedBasis
  return <section className="admin-business-report" aria-label={en ? 'Business booking report' : 'Справка за резервациите на бизнеса'}>
    {preview && <p className="admin-report-note">{en ? 'Local preview · fictional data · no real bookings or messages.' : 'Локален преглед · измислени данни · без реални резервации и съобщения.'}</p>}
    <form className="admin-report-period" onSubmit={apply}>
      <label htmlFor={`${fieldId}-from`}>{en ? 'From' : 'От'}<input id={`${fieldId}-from`} name="reportFrom" type="date" required value={filters.from} onChange={event => update({ from: event.target.value, validation: '' })}/></label>
      <label htmlFor={`${fieldId}-to`}>{en ? 'To (inclusive)' : 'До (включително)'}<input id={`${fieldId}-to`} name="reportTo" type="date" required value={filters.to} onChange={event => update({ to: event.target.value, validation: '' })}/></label>
      <label htmlFor={`${fieldId}-basis`}>{en ? 'Date basis' : 'По дата на'}<select id={`${fieldId}-basis`} name="reportBasis" value={filters.basis} onChange={event => update({ basis: event.target.value })}><option value="visit">{en ? 'Visit' : 'Посещението'}</option><option value="created">{en ? 'Booking creation' : 'Записването'}</option></select></label>
      <button className="primary-button" type="submit">{en ? 'Apply' : 'Приложи'}</button>
    </form>
    {filters.validation && <p className="admin-report-error" role="alert">{filters.validation === 'long' ? (en ? 'Choose a period of up to 366 days.' : 'Избери период до 366 дни.') : (en ? 'Enter valid dates with the end on or after the start.' : 'Въведи валидни дати, като краят е след или на началната дата.')}</p>}
    <p className="admin-report-period-caption">{displayDate(filters.appliedFrom, zone, locale)} – {displayDate(filters.appliedTo, zone, locale)} · {filters.appliedBasis === 'visit' ? (en ? 'Visit date' : 'Дата на посещението') : (en ? 'Booking creation date' : 'Дата на записването')} · {zone}{pendingDraft && <span> · {en ? 'Unapplied changes' : 'Неприложени промени'}</span>}</p>
    {external && <p className="admin-report-note">{en ? 'Only actual GoRez reservations are included. Website and telephone bookings are not available without an integration; clicks are not reservations.' : 'Включени са само реални резервации в GoRez. Записванията през външен сайт и по телефон не са достъпни без интеграция; кликовете не са резервации.'}</p>}
    {!current ? <p className="admin-report-loading" role="status">{en ? 'Loading the report…' : 'Зареждаме справката…'}</p> : current.error ? <div className="admin-report-error" role="alert"><p>{current.error === 'UNAUTHORIZED' || current.error === 'FORBIDDEN' ? (en ? 'Administrator access could not be verified. Sign in again.' : 'Администраторският достъп не е потвърден. Влез отново.') : (en ? 'We could not load this report. No results are shown.' : 'Не успяхме да заредим справката. Не се показват резултати.')}</p><button type="button" className="secondary-button" onClick={() => setAttempt(value => value + 1)}>{en ? 'Retry' : 'Опитай отново'}</button></div> : <>
      <div className="admin-report-summary" aria-label={en ? 'Entire period, all statuses' : 'Целият период, всички статуси'}>
        <article><span>{en ? 'Reservations' : 'Резервации'}</span><strong>{data.summary.bookings}</strong></article><article><span>{en ? 'Customer records' : 'Клиентски профили'}</span><strong>{data.summary.customers}</strong></article>
        {STATUSES.map(status => <article key={status}><span>{statusLabel(status)}</span><strong>{data.summary.statuses[status]}</strong></article>)}
      </div>
      <p className="admin-report-note">{en ? 'Totals include all statuses in the period. Customers are distinct customer records with reservations, not necessarily unique people.' : 'Общите показатели включват всички статуси за периода. Клиентите са отделни клиентски профили с резервации, не непременно уникални хора.'}</p>
    </>}
    <div className="admin-report-list-controls">
      <div className="admin-report-views" role="group" aria-label={en ? 'Report view' : 'Изглед на справката'}>{[['bookings', en ? 'Reservations' : 'Резервации'], ['customers', en ? 'Customers' : 'Клиенти']].map(([view, title]) => <button key={view} type="button" aria-pressed={filters.view === view} onClick={() => update({ view, page: 1 })}>{title}</button>)}</div>
      <label htmlFor={`${fieldId}-status`}>{en ? 'Status' : 'Статус'}<select id={`${fieldId}-status`} name="reportStatus" value={filters.status} onChange={event => update({ status: event.target.value, page: 1 })}><option value="all">{en ? 'All statuses' : 'Всички статуси'}</option>{STATUSES.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label>
    </div>
    {data && <>
      <p className="admin-report-result-count" role="status">{en ? 'Results' : 'Резултати'}: <strong>{data.totalRows}</strong>{filters.status !== 'all' && <> · {statusLabel(filters.status)} · {data.filtered.bookings} {en ? 'reservations' : 'резервации'}, {data.filtered.customers} {en ? 'customer records' : 'клиентски профила'}</>}</p>
      {!data.rows.length ? <p className="admin-report-empty">{en ? 'No records for this period and filter.' : 'Няма записи за този период и филтър.'}</p> : filters.view === 'bookings' ? <div className="admin-report-table-wrap"><table className="admin-report-table"><thead><tr><th>{en ? 'Visit / booked on' : 'Посещение / записване'}</th><th>{en ? 'Customer' : 'Клиент'}</th><th>{en ? 'Service / staff' : 'Услуга / служител'}</th><th>{en ? 'Status / source' : 'Статус / източник'}</th></tr></thead><tbody>{data.rows.map(row => <tr key={row.id}>
        <td data-label={en ? 'Visit / booked on' : 'Посещение / записване'}><strong>{displayDate(row.startsAt, zone, locale, true)}</strong>{row.endsAt && <span>{en ? 'Until' : 'До'} {displayDate(row.endsAt, zone, locale, true)}</span>}<small>{en ? 'Booked' : 'Записана'}: {displayDate(row.createdAt, zone, locale, true)}</small></td>
        <td data-label={en ? 'Customer' : 'Клиент'}><CustomerContact customer={row.customer} en={en}/></td>
        <td data-label={en ? 'Service / staff' : 'Услуга / служител'}><strong>{row.service?.name || (en ? 'Unavailable service' : 'Недостъпна услуга')}</strong>{row.staff?.name && <span>{row.staff.name}</span>}</td>
        <td data-label={en ? 'Status / source' : 'Статус / източник'}><span className={`admin-report-status status-${row.status}`}>{statusLabel(row.status)}</span><small>{sourceLabel(row.source)}</small></td>
      </tr>)}</tbody></table></div> : <div className="admin-report-table-wrap"><table className="admin-report-table admin-report-customers"><thead><tr><th>{en ? 'Customer' : 'Клиент'}</th><th>{en ? 'Reservations / statuses' : 'Резервации / статуси'}</th><th>{en ? 'First / last visit in this report' : 'Първо / последно посещение в справката'}</th></tr></thead><tbody>{data.rows.map(row => <tr key={row.id}>
        <td data-label={en ? 'Customer' : 'Клиент'}><CustomerContact customer={row} en={en}/></td><td data-label={en ? 'Reservations / statuses' : 'Резервации / статуси'}><strong>{row.bookings}</strong><div className="admin-report-status-list">{STATUSES.filter(status => row.statuses?.[status] > 0).map(status => <span key={status}>{statusLabel(status)}: {row.statuses[status]}</span>)}</div></td><td data-label={en ? 'Visits in this report' : 'Посещения в справката'}><span>{displayDate(row.firstVisitAt, zone, locale, true)}</span><span>{displayDate(row.lastVisitAt, zone, locale, true)}</span></td>
      </tr>)}</tbody></table></div>}
      <nav className="admin-report-pagination" aria-label={en ? 'Report pages' : 'Страници на справката'}><button className="secondary-button" type="button" disabled={filters.page <= 1} onClick={() => update({ page: filters.page - 1 })}>{en ? 'Previous' : 'Назад'}</button><span>{en ? 'Page' : 'Страница'} {data.page} / {Math.max(1, data.totalPages)}</span><button className="secondary-button" type="button" disabled={filters.page >= data.totalPages} onClick={() => update({ page: filters.page + 1 })}>{en ? 'Next' : 'Напред'}</button></nav>
    </>}
  </section>
}
