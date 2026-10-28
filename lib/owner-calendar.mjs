import { DateTime } from 'luxon'

export const APPOINTMENT_STATUS_LABELS = {
  bg: { booked: 'Записан', confirmed: 'Потвърден', cancelled: 'Отменен', no_show: 'Неявил се', done: 'Завършен' },
  en: { booked: 'Booked', confirmed: 'Confirmed', cancelled: 'Cancelled', no_show: 'No-show', done: 'Completed' },
}

export function getCalendarDays(date, view = 'day', zone = 'Europe/Sofia') {
  const parsed = DateTime.fromISO(date, { zone })
  const day = (parsed.isValid ? parsed : DateTime.now().setZone(zone)).startOf('day')
  if (view === 'month') {
    const first = day.startOf('month')
    const start = first.minus({ days: first.weekday - 1 })
    const length = Math.ceil((first.weekday - 1 + first.daysInMonth) / 7) * 7
    return Array.from({ length }, (_, index) => start.plus({ days: index }))
  }
  const start = view === 'week' ? day.minus({ days: day.weekday - 1 }) : day
  return Array.from({ length: view === 'week' ? 7 : 1 }, (_, index) => start.plus({ days: index }))
}

export function shiftCalendarDate(date, view, direction, zone = 'Europe/Sofia') {
  const parsed = DateTime.fromISO(date, { zone })
  const day = (parsed.isValid ? parsed : DateTime.now().setZone(zone)).startOf('day')
  return (view === 'month' ? day.startOf('month').plus({ months: direction }) : day.plus({ days: direction * (view === 'week' ? 7 : 1) })).toISODate()
}

// Parse each interval once, rather than once for each of up to 42 month cells.
export function groupCalendarAppointments(appointments, days) {
  const buckets = days.map(day => ({ day, start: day.startOf('day').toMillis(), end: day.startOf('day').plus({ days: 1 }).toMillis(), appointments: [] }))
  const intervals = appointments.map(item => ({ item, start: DateTime.fromISO(item.starts_at).toMillis(), end: DateTime.fromISO(item.ends_at).toMillis() }))
    .filter(item => Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > item.start)
    .sort((left, right) => left.start - right.start)
  for (const interval of intervals) {
    for (const bucket of buckets) if (interval.start < bucket.end && interval.end > bucket.start) bucket.appointments.push(interval.item)
  }
  return buckets.map(({ day, appointments: items }) => ({ day, appointments: items }))
}

export function appointmentsForDay(appointments, day, zone = 'Europe/Sofia') {
  const start = typeof day === 'string' ? DateTime.fromISO(day, { zone }).startOf('day') : day.startOf('day')
  const end = start.plus({ days: 1 })
  return appointments.filter((item) => {
    const begins = DateTime.fromISO(item.starts_at)
    const ends = DateTime.fromISO(item.ends_at)
    return begins.isValid && ends.isValid && begins < end && ends > start
  }).sort((left, right) => DateTime.fromISO(left.starts_at).toMillis() - DateTime.fromISO(right.starts_at).toMillis())
}

export function filterCalendarAppointments(appointments, { staffId = '', status = 'active', query = '', scope = 'all', now = DateTime.now() } = {}) {
  const needle = query.trim().toLocaleLowerCase()
  return appointments.filter((item) => {
    if (staffId && item.staff?.id !== staffId) return false
    if (status === 'active' && item.status === 'cancelled') return false
    if (status !== 'active' && status !== 'all' && item.status !== status) return false
    const ends = DateTime.fromISO(item.ends_at)
    if (scope === 'upcoming' && (ends < now || ['cancelled', 'done', 'no_show'].includes(item.status))) return false
    if (scope === 'past' && ends >= now && !['cancelled', 'done', 'no_show'].includes(item.status)) return false
    if (needle && ![item.customer?.name, item.customer?.phone, item.service?.name, item.staff?.name].some((value) => String(value || '').toLocaleLowerCase().includes(needle))) return false
    return true
  }).sort((left, right) => DateTime.fromISO(left.starts_at).toMillis() - DateTime.fromISO(right.starts_at).toMillis())
}

export function getAppointmentTiming(item, date, zone = 'Europe/Sofia') {
  const day = DateTime.fromISO(date, { zone }).startOf('day')
  const dayEnd = day.plus({ days: 1 })
  const starts = DateTime.fromISO(item.starts_at).setZone(zone)
  const ends = DateTime.fromISO(item.ends_at).setZone(zone)
  const from = starts < day ? 0 : starts.hour * 60 + starts.minute
  const to = ends >= dayEnd ? 1440 : ends.hour * 60 + ends.minute
  return {
    starts,
    ends,
    startMinute: from,
    endMinute: Math.max(from + 1, to),
    durationMinutes: Math.round(ends.diff(starts, 'minutes').minutes),
    continuesBefore: starts < day,
    continuesAfter: ends > dayEnd,
  }
}

export function getTimelineBounds(appointments, date, zone = 'Europe/Sofia') {
  const timings = appointments.map((item) => getAppointmentTiming(item, date, zone))
  return {
    startHour: Math.max(0, Math.min(8, ...timings.map((item) => Math.floor(item.startMinute / 60)))),
    endHour: Math.min(24, Math.max(19, ...timings.map((item) => Math.ceil(item.endMinute / 60)))),
  }
}

export function layoutDayAppointments(appointments, date, zone = 'Europe/Sofia') {
  const sorted = appointments.map((item) => ({ item, timing: getAppointmentTiming(item, date, zone) }))
    .sort((left, right) => left.timing.startMinute - right.timing.startMinute)
  const result = []
  let group = []
  let laneEnds = []
  let groupEnd = -1
  const flush = () => {
    result.push(...group.map((event) => ({ ...event, laneCount: laneEnds.length })))
    group = []; laneEnds = []; groupEnd = -1
  }
  for (const event of sorted) {
    const { startMinute, endMinute } = event.timing
    if (startMinute >= groupEnd && group.length) flush()
    let lane = laneEnds.findIndex((end) => end <= startMinute)
    if (lane === -1) lane = laneEnds.length
    const visualEnd = Math.max(endMinute, startMinute + 8)
    laneEnds[lane] = visualEnd
    groupEnd = Math.max(groupEnd, visualEnd)
    group.push({ ...event, lane })
  }
  flush()
  return result
}
