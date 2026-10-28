'use client'

import { DateTime } from 'luxon'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Icon } from './icon'
import { DateMenu } from './date-menu'
import { APPOINTMENT_STATUS_LABELS, appointmentsForDay, filterCalendarAppointments, getAppointmentTiming, getCalendarDays, getTimelineBounds, groupCalendarAppointments, layoutDayAppointments, shiftCalendarDate } from '../lib/owner-calendar.mjs'
import { formatBulgarianMonthShort } from '../lib/booking-window.mjs'

const HOUR_HEIGHT = 96
const shortMonth = (day, locale) => locale === 'bg' ? formatBulgarianMonthShort(day.month) : day.setLocale('en').toFormat('LLL')

export function AppointmentCalendar({ appointments, staff, timezone = 'Europe/Sofia', locale = 'bg', updatingId = '', actionError = '', refreshing = false, onStatusChange, onReschedule, onCreateBooking, onRefresh }) {
  const en = locale === 'en'
  const labels = APPOINTMENT_STATUS_LABELS[locale] || APPOINTMENT_STATUS_LABELS.bg
  const [view, setView] = useState('day')
  const [date, setDate] = useState(() => DateTime.now().setZone(timezone).toISODate())
  const [staffId, setStaffId] = useState('')
  const [status, setStatus] = useState('active')
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState('upcoming')
  const [selectedId, setSelectedId] = useState(null)
  const dialogRef = useRef(null)
  const monthAgendaId = useId()

  const selected = appointments.find((item) => item.id === selectedId)
  const calendarStaff = useMemo(() => {
    const people = new Map(staff.map((person) => [person.id, person]))
    for (const item of appointments) if (item.staff?.id && !people.has(item.staff.id)) people.set(item.staff.id, item.staff)
    return [...people.values()]
  }, [staff, appointments])
  const visibleStaff = staffId ? calendarStaff.filter((person) => person.id === staffId) : calendarStaff
  const days = getCalendarDays(date, view, timezone)
  const selectedDate = DateTime.fromISO(date, { zone: timezone }).setLocale(locale)
  const filtered = filterCalendarAppointments(appointments, { staffId, status, query, scope: view === 'list' ? scope : 'all' })
  const daysWithAppointments = view === 'month' ? groupCalendarAppointments(filtered, days) : days.map((day) => ({ day, appointments: appointmentsForDay(filtered, day, timezone) }))
  const periodDays = view === 'month' ? daysWithAppointments.filter(({ day }) => day.hasSame(selectedDate, 'month')) : daysWithAppointments
  const periodAppointments = view === 'list' ? filtered : [...new Map(periodDays.flatMap((item) => item.appointments).map((item) => [item.id, item])).values()]
  const selectedMonthDay = daysWithAppointments.find(({ day }) => day.toISODate() === date)
  const activeCount = periodAppointments.filter((item) => ['booked', 'confirmed'].includes(item.status)).length
  const completedCount = periodAppointments.filter((item) => item.status === 'done').length
  const bounds = getTimelineBounds(daysWithAppointments[0].appointments, date, timezone)
  const timelineHeight = (bounds.endHour - bounds.startHour) * HOUR_HEIGHT
  const today = DateTime.now().setZone(timezone).toISODate()
  const queryOptions = [...new Set(appointments.flatMap(item => [item.customer?.name,item.service?.name]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,locale))
  const activeFilters = Number(Boolean(staffId)) + Number(status !== 'active') + Number(Boolean(query))

  useEffect(() => {
    const dialog = dialogRef.current
    if (selected && dialog && !dialog.open) dialog.showModal()
    if (!selected && dialog?.open) dialog.close()
  }, [selected])

  function navigate(direction) {
    setDate(shiftCalendarDate(date, view, direction, timezone))
  }

  function openCreate(day = date, personId = staffId) {
    onCreateBooking?.({ date: day, staffId: personId })
  }

  function eventButton(item, day, position = null) {
    const timing = getAppointmentTiming(item, day.toISODate(), timezone)
    const compact = position && timing.endMinute - timing.startMinute < 40
    const starts = timing.starts.setLocale(locale)
    const time = timing.continuesBefore ? '00:00' : starts.toFormat('HH:mm')
    const end = timing.continuesAfter ? '24:00' : timing.ends.toFormat('HH:mm')
    return <button key={item.id} type="button" className={`owner-calendar-event ${item.status}${position ? ' timeline-event' : ''}${compact ? ' compact' : ''}`} style={position || undefined} onClick={() => setSelectedId(item.id)} aria-label={`${time}–${end}, ${item.customer?.name || (en ? 'Client' : 'Клиент')}, ${item.service?.name}, ${item.staff?.name}, ${labels[item.status]}`}>
      <span className="calendar-event-time">{timing.continuesBefore && '← '}{time} – {end}{timing.continuesAfter && ' →'}<small>{timing.durationMinutes} {en ? 'min' : 'мин.'}</small></span>
      <strong>{item.customer?.name || (en ? 'Client' : 'Клиент')}</strong>
      <span className="calendar-event-service">{item.service?.name}</span>
      {!position && <span className="calendar-event-staff">{item.staff?.name} · {labels[item.status]}</span>}
    </button>
  }

  return <section className="owner-calendar" aria-label={en ? 'Booking calendar' : 'Календар с резервации'}>
    <div className="owner-calendar-toolbar">
      <label className="calendar-view-menu"><span>{en ? 'View' : 'Изглед'}</span><select value={view} onChange={event=>setView(event.target.value)}>{[['day',en?'Day':'Ден'],['week',en?'Week':'Седмица'],['month',en?'Month':'Месец'],['list',en?'List':'Списък']].map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
      <details className="calendar-filter-menu"><summary>{en ? 'Filters' : 'Филтри'}{activeFilters > 0 && <b>{activeFilters}</b>}<span aria-hidden="true">⌄</span></summary><div className="calendar-filter-panel">
        <div className="calendar-staff-filter"><label htmlFor="calendar-staff">{en ? 'Specialist' : 'Специалист'}</label><select id="calendar-staff" value={staffId} onChange={(event) => setStaffId(event.target.value)}><option value="">{en ? 'All specialists' : 'Всички специалисти'}</option>{calendarStaff.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></div>
        <div className="calendar-status-filter"><label htmlFor="calendar-status">{en ? 'Status' : 'Статус'}</label><select id="calendar-status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">{en ? 'Without cancelled' : 'Без отменените'}</option><option value="all">{en ? 'All statuses' : 'Всички статуси'}</option>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
        <label className="calendar-client-filter"><span>{en ? 'Client or service' : 'Клиент или услуга'}</span><select value={query} onChange={event=>setQuery(event.target.value)}><option value="">{en ? 'All clients and services' : 'Всички клиенти и услуги'}</option>{queryOptions.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
        <button className="link-button" type="button" onClick={()=>{setStaffId('');setStatus('active');setQuery('')}}>{en ? 'Clear filters' : 'Изчисти филтрите'}</button>
      </div></details>
      {onRefresh && <button className="calendar-refresh secondary-button" type="button" onClick={onRefresh} disabled={refreshing}>{refreshing ? (en ? 'Refreshing…' : 'Обновяване…') : (en ? 'Refresh' : 'Обнови')}</button>}
    </div>
    <div className="owner-calendar-period">
      <div className="calendar-period-copy"><small>{view === 'day' ? (en ? 'Daily schedule' : 'Дневен график') : view === 'week' ? (en ? 'Weekly schedule' : 'Седмичен график') : view === 'month' ? (en ? 'Monthly schedule' : 'Месечен график') : (en ? 'Booking list' : 'Списък с резервации')}</small><h3>{view === 'week' ? `${days[0].day} ${shortMonth(days[0], locale)}${days[0].year !== days[6].year ? ` ${days[0].year}` : ''} – ${days[6].day} ${shortMonth(days[6], locale)} ${days[6].year}` : view === 'month' ? selectedDate.toFormat('LLLL yyyy') : view === 'day' ? selectedDate.toFormat('cccc, d LLLL yyyy') : (en ? 'Your appointments' : 'Твоите посещения')}</h3><p>{en ? 'Times shown in' : 'Часовете са по'} {timezone}</p></div>
      {view !== 'list' ? <div className="calendar-date-controls"><button type="button" className="calendar-arrow" aria-label={en ? 'Previous period' : 'Предишен период'} onClick={() => navigate(-1)}><Icon name="back" /></button><button type="button" className="calendar-today" onClick={() => setDate(today)}>{en ? 'Today' : 'Днес'}</button><DateMenu value={date} onChange={setDate} locale={locale} timezone={timezone}/><button type="button" className="calendar-arrow" aria-label={en ? 'Next period' : 'Следващ период'} onClick={() => navigate(1)}><Icon name="arrow" /></button></div> : <div className="calendar-list-scope" role="group" aria-label={en ? 'Booking period' : 'Период на резервациите'}>{[['upcoming', en ? 'Upcoming' : 'Предстоящи'], ['past', en ? 'Past' : 'Минали'], ['all', en ? 'All' : 'Всички']].map(([value, label]) => <button type="button" className={scope === value ? 'active' : ''} aria-pressed={scope === value} onClick={() => setScope(value)} key={value}>{label}</button>)}</div>}
    </div>
    <div className="calendar-overview"><span><b>{periodAppointments.length}</b>{en ? 'appointments' : 'посещения'}</span><span><i className="calendar-dot booked" /><b>{activeCount}</b>{en ? 'booked / confirmed' : 'записани / потвърдени'}</span><span><i className="calendar-dot done" /><b>{completedCount}</b>{en ? 'completed' : 'завършени'}</span></div>

    {view === 'day' && <>
      <div className="calendar-mobile-agenda">{daysWithAppointments[0].appointments.map(item=>eventButton(item,days[0]))}</div>
      <div className="day-calendar-scroll"><div className="day-calendar-grid" style={{ gridTemplateColumns: `62px repeat(${Math.max(1, visibleStaff.length)}, minmax(210px, 1fr))` }}>
        <div className="calendar-time-heading"><Icon name="clock" /></div>{visibleStaff.map((person) => <div className="calendar-person-heading" key={person.id}><span>{person.name.slice(0, 1)}</span><strong>{person.name}</strong><small>{daysWithAppointments[0].appointments.filter((item) => item.staff?.id === person.id).length} {en ? 'appointments' : 'посещения'}</small></div>)}
        <div className="calendar-time-axis" style={{ height: timelineHeight }}>{Array.from({ length: bounds.endHour - bounds.startHour }, (_, index) => <span style={{ top: index * HOUR_HEIGHT }} key={index}>{String(bounds.startHour + index).padStart(2, '0')}:00</span>)}</div>
        {visibleStaff.map((person) => <div className="calendar-person-track" style={{ height: timelineHeight, backgroundSize: `100% ${HOUR_HEIGHT}px` }} key={person.id}>
          {layoutDayAppointments(daysWithAppointments[0].appointments.filter((item) => item.staff?.id === person.id), date, timezone).map(({ item, timing, lane, laneCount }) => {
            return eventButton(item, days[0], { top: (timing.startMinute / 60 - bounds.startHour) * HOUR_HEIGHT, height: Math.max(12, (timing.endMinute - timing.startMinute) / 60 * HOUR_HEIGHT - 2), left: `calc(${lane / laneCount * 100}% + 5px)`, right: 'auto', width: `calc(${100 / laneCount}% - 10px)` })
          })}
        </div>)}
        {visibleStaff.length === 0 && <div className="calendar-no-staff" style={{ height: timelineHeight }}>{en ? 'Add a team member to organise your schedule.' : 'Добави човек в екипа, за да подредиш графика.'}</div>}
      </div></div>
      {periodAppointments.length === 0 && <p className="calendar-empty-note">{query || staffId || status !== 'active' ? (en ? 'No appointments match these filters on this day.' : 'Няма резервации по тези филтри за деня.') : (en ? 'No appointments for this day.' : 'Няма резервации за този ден.')} <button type="button" onClick={() => openCreate()}>{en ? 'Add a booking' : 'Добави резервация'}</button></p>}
    </>}

    {view === 'week' && <div className="week-calendar-scroll"><div className="week-calendar-grid">{daysWithAppointments.map(({ day, appointments: items }) => <section className={`week-calendar-day ${day.toISODate() === today ? 'is-today' : ''}`} key={day.toISODate()}>
      <button className="week-day-heading" type="button" onClick={() => { setDate(day.toISODate()); setView('day') }} aria-label={`${en ? 'Open day' : 'Отвори ден'} ${day.setLocale(locale).toFormat('cccc, d LLLL')}`}><small>{day.setLocale(locale).toFormat('ccc')}</small><strong>{day.day}</strong><span>{shortMonth(day, locale)}</span><b>{items.length}</b></button>
      <div className="week-day-events">{items.length ? items.map((item) => eventButton(item, day)) : <p>{en ? 'No appointments' : 'Няма резервации'}</p>}</div>
      <button className="week-add-booking" type="button" onClick={() => openCreate(day.toISODate())}>+ {en ? 'Booking' : 'Резервация'}</button>
    </section>)}</div></div>}

    {view === 'month' && <div className="owner-month-calendar">
      <div className="owner-month-weekdays" aria-hidden="true">{days.slice(0, 7).map(day => <span key={day.weekday}>{(en ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'])[day.weekday - 1]}</span>)}</div>
      <div className="owner-month-grid" role="group" aria-label={`${en ? 'Appointments by day' : 'Резервации по дни'} · ${selectedDate.toFormat('LLLL yyyy')}`}>{daysWithAppointments.map(({ day, appointments: items }) => {
        const iso = day.toISODate()
        return <button type="button" key={iso} className={`owner-month-day${day.hasSame(selectedDate, 'month') ? '' : ' outside-month'}${iso === today ? ' is-today' : ''}`} aria-pressed={iso === date} aria-current={iso === today ? 'date' : undefined} aria-controls={monthAgendaId} aria-label={`${day.setLocale(locale).toFormat('cccc, d LLLL yyyy')}, ${items.length} ${en ? (items.length === 1 ? 'appointment' : 'appointments') : (items.length === 1 ? 'посещение' : 'посещения')}`} onClick={() => setDate(iso)}><span className="owner-month-date">{day.day}</span><span className={`owner-month-count${items.length ? ' has-bookings' : ''}`} aria-hidden="true">{items.length > 99 ? '99+' : items.length || '—'}</span></button>
      })}</div>
      <section className="owner-month-agenda" id={monthAgendaId} aria-labelledby={`${monthAgendaId}-title`}>
        <header><h4 id={`${monthAgendaId}-title`}>{selectedDate.toFormat('cccc, d LLLL')}</h4><button className="secondary-button" type="button" onClick={() => setView('day')}>{en ? 'Open day' : 'Отвори ден'}<Icon name="arrow"/></button></header>
        <div className="owner-month-events">{selectedMonthDay?.appointments.length ? selectedMonthDay.appointments.map(item => eventButton(item, selectedDate)) : <p className="owner-month-empty">{en ? 'No appointments for this day with the selected filters.' : 'Няма резервации за този ден по избраните филтри.'}</p>}</div>
        {onCreateBooking && <button className="primary-button owner-month-add" type="button" onClick={() => openCreate()}><Icon name="plus"/>{en ? 'New booking for this day' : 'Нова резервация за деня'}</button>}
      </section>
    </div>}

    {view === 'list' && <div className="calendar-appointment-list">{filtered.length ? filtered.map((item) => {
      const starts = DateTime.fromISO(item.starts_at).setZone(timezone).setLocale(locale)
      return <button className="calendar-list-item" type="button" key={item.id} onClick={() => setSelectedId(item.id)}><span className="calendar-list-date"><strong>{starts.toFormat('dd')}</strong><small>{shortMonth(starts, locale)} {starts.year}</small></span><span className="calendar-list-time"><strong>{starts.toFormat('HH:mm')} – {DateTime.fromISO(item.ends_at).setZone(timezone).toFormat('HH:mm')}</strong><small>{Math.round(DateTime.fromISO(item.ends_at).diff(starts, 'minutes').minutes)} {en ? 'min' : 'мин.'}</small></span><span className="calendar-list-client"><strong>{item.customer?.name || (en ? 'Client' : 'Клиент')}</strong><small>{item.service?.name} · {item.staff?.name}</small></span><span className={`status-badge ${item.status}`}>{labels[item.status]}</span><Icon name="arrow" /></button>
    }) : <div className="empty-state"><h3>{en ? 'No matching appointments' : 'Няма съответстващи резервации'}</h3><p>{en ? 'Try another period, specialist or search.' : 'Избери друг период, специалист или търсене.'}</p></div>}</div>}

    <dialog ref={dialogRef} className="owner-calendar-dialog" onClose={() => setSelectedId(null)} onCancel={() => setSelectedId(null)} aria-labelledby="calendar-appointment-title">
      {selected && <><header><span className={`status-badge ${selected.status}`}>{labels[selected.status]}</span><button type="button" className="calendar-dialog-close" onClick={() => setSelectedId(null)} aria-label={en ? 'Close details' : 'Затвори детайлите'}>×</button></header><h3 id="calendar-appointment-title">{selected.customer?.name || (en ? 'Client' : 'Клиент')}</h3><p className="calendar-dialog-service">{selected.service?.name}</p><dl className="calendar-dialog-details">
        <div><dt>{en ? 'Date' : 'Дата'}</dt><dd>{DateTime.fromISO(selected.starts_at).setZone(timezone).setLocale(locale).toFormat('cccc, d LLLL yyyy')}</dd></div>
        <div><dt>{en ? 'Time and duration' : 'Час и продължителност'}</dt><dd>{DateTime.fromISO(selected.starts_at).setZone(timezone).toFormat('HH:mm')} – {DateTime.fromISO(selected.ends_at).setZone(timezone).toFormat('HH:mm')} · {Math.round(DateTime.fromISO(selected.ends_at).diff(DateTime.fromISO(selected.starts_at), 'minutes').minutes)} {en ? 'min' : 'мин.'}</dd></div>
        <div><dt>{en ? 'Specialist' : 'Специалист'}</dt><dd>{selected.staff?.name}</dd></div>
        {selected.customer?.phone && <div><dt>{en ? 'Phone' : 'Телефон'}</dt><dd><a href={`tel:${selected.customer.phone}`}>{selected.customer.phone}</a></dd></div>}
        {selected.customer?.email && <div><dt>{en ? 'Email' : 'Имейл'}</dt><dd><a href={`mailto:${selected.customer.email}`}>{selected.customer.email}</a></dd></div>}
      </dl>{selected.notes && <div className="calendar-dialog-notes"><strong>{en ? 'Appointment details and notes' : 'Детайли за посещението и бележки'}</strong><p>{selected.notes}</p></div>}{actionError && <p className="form-message" role="alert">{actionError}</p>}<div className="calendar-dialog-actions">
        <label><span>{en ? 'Booking status' : 'Статус на резервацията'}</span><select value={selected.status} disabled={updatingId === selected.id} onChange={(event) => onStatusChange?.(selected.id, event.target.value)}>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        {['booked', 'confirmed'].includes(selected.status) && <button type="button" className="primary-button" disabled={updatingId === selected.id} onClick={() => { setSelectedId(null); onReschedule?.(selected) }}>{en ? 'Reschedule' : 'Премести часа'}</button>}
      </div></>}
    </dialog>
  </section>
}
