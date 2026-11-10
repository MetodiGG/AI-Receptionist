import { DateTime } from 'luxon'

export const MONTH_AVAILABILITY_TTL_MS = 15_000

function zoneOrDefault(zone) {
  return DateTime.now().setZone(zone || 'Europe/Sofia').isValid ? (zone || 'Europe/Sofia') : 'Europe/Sofia'
}

function instant(value) {
  if (DateTime.isDateTime(value)) return value
  return typeof value === 'string' ? DateTime.fromISO(value) : DateTime.fromMillis(value ?? Date.now())
}

export function bookingCalendarWindow(business = {}, now = Date.now()) {
  const timezone = zoneOrDefault(business.timezone)
  const today = instant(now).setZone(timezone).startOf('day')
  const configured = Number(business.booking_window_days || 60)
  const days = Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : 60
  const last = today.plus({ days })
  return { timezone, today: today.toISODate(), firstBookableDate: today.toISODate(), lastBookableDate: last.toISODate(), firstMonth: today.toFormat('yyyy-MM'), lastMonth: last.toFormat('yyyy-MM') }
}

export function validCalendarMonth(month, timezone = 'Europe/Sofia') {
  return typeof month === 'string' && /^\d{4}-\d{2}$/.test(month) && DateTime.fromISO(`${month}-01`, { zone: timezone }).isValid
}

export function shiftCalendarMonth(month, amount, timezone = 'Europe/Sofia') {
  return validCalendarMonth(month, timezone) ? DateTime.fromISO(`${month}-01`, { zone: timezone }).plus({ months: amount }).toFormat('yyyy-MM') : null
}

export function calendarMonthTitle(month, timezone = 'Europe/Sofia', locale = 'bg') {
  return DateTime.fromISO(`${month}-01`, { zone: timezone }).setLocale(locale === 'en' ? 'en' : 'bg').toFormat('LLLL yyyy')
}

export function calendarWeekdays(locale = 'bg') {
  return Array.from({ length: 7 }, (_, index) => {
    const day = DateTime.fromISO('2024-01-01', { zone: 'UTC' }).plus({ days: index }).setLocale(locale === 'en' ? 'en' : 'bg')
    return { short: day.toFormat('ccc'), full: day.toFormat('cccc') }
  })
}

// This only removes expired server-returned choices. It never constructs slots
// from opening hours, staff schedules or client-side availability assumptions.
export function filterMonthlyAvailability(payload, { now = Date.now(), minimumNoticeMinutes = 0 } = {}) {
  const threshold = instant(now).toMillis() + Math.max(0, Number(minimumNoticeMinutes) || 0) * 60_000
  return { ...payload, days: (payload.days || []).map(day => ({ ...day, slots: (day.slots || []).filter(slot => {
    // Responses are validated once on receipt. Native ISO parsing avoids doing
    // thousands of Luxon allocations on every clock tick for larger teams.
    const start = typeof slot?.startsAt === 'string' ? Date.parse(slot.startsAt) : NaN
    return Number.isFinite(start) && start >= threshold
  }) })) }
}

// Within one immutable response filtering can only remove slots, so per-day
// counts completely describe expiry changes. A new response gets a new request
// generation in the component even when it happens to have the same counts.
export function monthlyAvailabilityDaySignature(payload) {
  return `${payload.month}:${payload.generatedAt}:${payload.days.map(day => `${day.date}:${day.slots.length}`).join('|')}`
}

export function availabilityClock(payload, receivedAt, now = Date.now()) {
  const serverNow = DateTime.fromISO(payload?.generatedAt || '').toMillis()
  return Number.isFinite(serverNow) ? Math.max(now, serverNow + Math.max(0, now - receivedAt)) : now
}

export function validateMonthlyAvailability(payload, month) {
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && DateTime.fromISO(value, { zone: payload?.timezone }).isValid
  if (!payload || typeof payload.timezone !== 'string' || !DateTime.now().setZone(payload.timezone).isValid
    || payload.month !== month || !validCalendarMonth(month, payload.timezone) || !Array.isArray(payload.days)
    || !validDate(payload.today) || !validDate(payload.firstBookableDate) || !validDate(payload.lastBookableDate)
    || typeof payload.generatedAt !== 'string' || !DateTime.fromISO(payload.generatedAt).isValid
    || payload.firstBookableDate > payload.lastBookableDate) throw new Error('Invalid monthly availability response')
  const dates = new Set()
  const expectedDays = DateTime.fromISO(`${month}-01`, { zone: payload.timezone }).daysInMonth
  if (payload.days.length !== expectedDays) throw new Error('Invalid monthly availability response')
  for (const day of payload.days) {
    if (!day || !validDate(day.date) || !day.date.startsWith(`${month}-`) || !Array.isArray(day.slots) || dates.has(day.date)
      || day.slots.some(slot => {
        if (!slot || typeof slot.startsAt !== 'string' || typeof slot.endsAt !== 'string'
          || !/(?:Z|[+-]\d{2}:\d{2})$/.test(slot.startsAt) || !/(?:Z|[+-]\d{2}:\d{2})$/.test(slot.endsAt)
          || !/^\d{2}:\d{2}$/.test(slot.localTime || '') || !/^\d{2}:\d{2}$/.test(slot.localEndTime || '')
          || typeof slot.staffId !== 'string' || typeof slot.staffName !== 'string') return true
        const start = DateTime.fromISO(slot.startsAt, { zone: payload.timezone })
        const end = DateTime.fromISO(slot.endsAt, { zone: payload.timezone })
        return !start.isValid || !end.isValid || end <= start || start.toISODate() !== day.date
          || start.toFormat('HH:mm') !== slot.localTime || end.toFormat('HH:mm') !== slot.localEndTime
      })) throw new Error('Invalid monthly availability response')
    dates.add(day.date)
  }
  return payload
}

export function bookingMonthGrid({ month, timezone = 'Europe/Sofia', today, firstBookableDate, lastBookableDate, days = [], status = 'loading' }) {
  if (!validCalendarMonth(month, timezone)) return []
  const start = DateTime.fromISO(`${month}-01`, { zone: timezone })
  const data = new Map(days.map(day => [day.date, day.slots]))
  const cells = Array.from({ length: start.weekday - 1 }, () => null)
  for (let day = 1; day <= start.daysInMonth; day += 1) {
    const date = start.set({ day }).toISODate()
    const inRange = date >= firstBookableDate && date <= lastBookableDate
    const slots = status === 'ready' && inRange ? data.get(date) : undefined
    const state = !inRange ? 'outside' : slots === undefined ? 'unknown' : slots.length ? 'available' : 'unavailable'
    cells.push({ date, day, today: date === today, state, slots: slots || [] })
  }
  while (cells.length % 7) cells.push(null)
  return cells
}

export function monthAvailabilityKey({ business, businessId, slug, serviceId, staffId, month }) {
  return JSON.stringify([businessId || business?.id || slug || business?.slug, serviceId, staffId || '', month])
}

function abortError() {
  return Object.assign(new Error('Availability request cancelled'), { name: 'AbortError' })
}

// Each mounted calendar owns a cache. A cancelled subscriber cannot publish an
// old response, even when its loader ignores AbortSignal. Identical concurrent
// requests share one load; aborting one subscriber does not cancel the others.
export function createMonthAvailabilityCache({ loadMonth, ttlMs = MONTH_AVAILABILITY_TTL_MS, maxEntries = 4, now = Date.now }) {
  const entries = new Map()
  const limit = Math.max(1, maxEntries)
  function remove(key, entry) {
    if (entries.get(key) === entry) entries.delete(key)
    entry.controller?.abort()
  }
  function invalidate(params) {
    if (params) {
      const key = monthAvailabilityKey(params)
      const entry = entries.get(key)
      if (entry) remove(key, entry)
    } else {
      for (const [key, entry] of entries) remove(key, entry)
    }
  }
  function load(params, { force = false, signal } = {}) {
    if (signal?.aborted) return Promise.reject(abortError())
    const key = monthAvailabilityKey(params)
    let entry = entries.get(key)
    if (entry && (force || (!entry.pending && entry.expiresAt <= now()))) {
      remove(key, entry)
      entry = null
    }
    if (entry) { entries.delete(key); entries.set(key, entry) }
    if (entry && !entry.pending) return Promise.resolve(entry.data)
    if (!entry) {
      entry = { controller: new AbortController(), users: 0, pending: true }
      const current = entry
      entries.set(key, current)
      current.promise = Promise.resolve().then(() => {
        if (current.controller.signal.aborted) throw abortError()
        return loadMonth({ ...params, signal: current.controller.signal })
      }).then(data => {
        if (current.controller.signal.aborted || entries.get(key) !== current) throw abortError()
        current.data = data
        current.receivedAt = now()
        current.expiresAt = current.receivedAt + ttlMs
        current.pending = false
        return data
      }).catch(error => {
        if (entries.get(key) === current) entries.delete(key)
        throw error
      })
      while (entries.size > limit) {
        const [oldKey, oldEntry] = entries.entries().next().value
        remove(oldKey, oldEntry)
      }
    }
    const current = entry
    current.users += 1
    return new Promise((resolve, reject) => {
      let settled = false
      const finish = (callback, value) => {
        if (settled) return
        settled = true
        signal?.removeEventListener('abort', cancel)
        current.controller.signal.removeEventListener('abort', cancel)
        current.users -= 1
        callback(value)
        if (!current.users && current.pending && !current.controller.signal.aborted) remove(key, current)
      }
      const cancel = () => finish(reject, abortError())
      signal?.addEventListener('abort', cancel, { once: true })
      current.controller.signal.addEventListener('abort', cancel, { once: true })
      current.promise.then(data => finish(resolve, data), error => finish(reject, error))
    })
  }
  return { load, invalidate, dispose: invalidate, receivedAt: params => entries.get(monthAvailabilityKey(params))?.receivedAt, get size() { return entries.size } }
}
