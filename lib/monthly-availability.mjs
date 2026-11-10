import { DateTime } from 'luxon'
import { z } from 'zod'
import { buildAvailableSlots } from './availability.mjs'
import { assertInternalBooking } from './booking-mode.mjs'
import { createServerTiming } from './server-timing.mjs'

const selectionSchema = z.object({
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  month: z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/),
})
const slugSchema = z.string().trim().min(2).max(64).regex(/^[a-z0-9-]+$/)
const noStoreHeaders = { 'Cache-Control': 'private, no-store, max-age=0' }

function validationError(message) {
  const error = new Error(message)
  error.code = 'VALIDATION_ERROR'
  return error
}

function resolveMonth({ business, serviceId, staffId, month, now }) {
  assertInternalBooking(business)
  const selection = selectionSchema.parse({ serviceId, staffId, month })
  const zone = business.timezone || 'Europe/Sofia'
  // Freeze one clock value for the whole response, including minimum notice.
  const generatedAt = now ? DateTime.fromISO(now).toUTC() : DateTime.now().toUTC()
  const today = generatedAt.setZone(zone).startOf('day')
  const monthStart = DateTime.fromISO(`${selection.month}-01`, { zone }).startOf('day')
  const lastBookableDay = today.plus({ days: business.booking_window_days || 60 })
  if (!generatedAt.isValid || !today.isValid || !monthStart.isValid) {
    throw validationError('Избери валиден месец.')
  }
  if (monthStart < today.startOf('month') || monthStart > lastBookableDay.startOf('month')) {
    throw validationError('Избраният месец е извън периода за резервации.')
  }

  const service = business.services.find((item) => item.id === selection.serviceId)
  if (!service) throw validationError('Избраната услуга вече не е налична.')
  if (selection.staffId && !business.staff.some((person) => person.id === selection.staffId)) {
    throw validationError('Избраният служител вече не е наличен.')
  }
  // No mappings means every active member of staff, just like daily availability.
  const mappedStaffIds = business.staffServices.filter((item) => item.service_id === selection.serviceId).map((item) => item.staff_id)
  const staff = business.staff.filter((person) => (
    (!selection.staffId || person.id === selection.staffId)
    && (mappedStaffIds.length === 0 || mappedStaffIds.includes(person.id))
  ))
  if (selection.staffId && !staff.length) {
    throw validationError('Избраният служител не предлага тази услуга.')
  }
  return { business, service, staff, month: selection.month, zone, generatedAt, today, lastBookableDay, monthStart }
}

function buildMonth(context, appointments, timeOff) {
  const { business, service, staff, month, zone, generatedAt, today, lastBookableDay, monthStart } = context
  const indexedRanges = (ranges) => ranges.map((range) => ({
    range,
    start: DateTime.fromISO(range.starts_at).toMillis(),
    end: DateTime.fromISO(range.ends_at).toMillis(),
  }))
  const appointmentRanges = indexedRanges(appointments)
  const timeOffRanges = indexedRanges(timeOff)
  const days = Array.from({ length: monthStart.daysInMonth }, (_, index) => {
    const day = monthStart.plus({ days: index })
    const date = day.toISODate()
    const start = day.toMillis()
    const end = day.plus({ days: 1 }).toMillis()
    // Keep intervals crossing midnight on both dates, but do not make each
    // candidate slot compare against the entire month's busy calendar.
    const overlappingDay = (ranges) => ranges.filter((item) => item.start < end && item.end > start).map((item) => item.range)
    return {
      date,
      slots: day < today || day > lastBookableDay ? [] : buildAvailableSlots({
        date,
        zone,
        durationMinutes: service.duration_min,
        slotMinutes: business.booking_slot_minutes || 15,
        minimumNoticeMinutes: business.minimum_notice_minutes || 0,
        now: generatedAt.toISO(),
        staff,
        workingHours: business.workingHours,
        appointments: overlappingDay(appointmentRanges),
        timeOff: overlappingDay(timeOffRanges),
      }),
    }
  })
  return {
    month,
    timezone: zone,
    today: today.toISODate(),
    firstBookableDate: today.toISODate(),
    lastBookableDate: lastBookableDay.toISODate(),
    generatedAt: generatedAt.toISO(),
    days,
  }
}

// Pure wrapper around the authoritative daily engine; no synthetic availability.
export function buildMonthlyAvailability({ appointments = [], timeOff = [], ...input }) {
  return buildMonth(resolveMonth(input), appointments, timeOff)
}

function completeRows(result) {
  if (result.error) throw result.error
  // A database response row limit must never turn omitted busy rows into free
  // slots. Exact counts let us fail safely without paginating per calendar day.
  if (!Array.isArray(result.data) || !Number.isSafeInteger(result.count) || result.count !== result.data.length) {
    throw new Error('Incomplete monthly availability data')
  }
  return result.data
}

export async function readMonthlyAvailableSlots({ supabase, ...input }) {
  const context = resolveMonth(input)
  if (!context.staff.length) return buildMonth(context, [], [])
  const eligibleIds = context.staff.map((person) => person.id)
  // Calendar boundaries are local midnights, then converted to UTC for storage.
  // This remains correct in 23/25-hour days and across a year boundary.
  const rangeStart = context.monthStart.toUTC().toISO()
  const rangeEnd = context.monthStart.plus({ months: 1 }).toUTC().toISO()
  const [appointmentsResult, timeOffResult] = await Promise.all([
    supabase.from('appointments')
      .select('staff_id,starts_at,ends_at', { count: 'exact' })
      .eq('business_id', context.business.id)
      .in('staff_id', eligibleIds)
      .in('status', ['booked', 'confirmed'])
      .lt('starts_at', rangeEnd)
      .gt('ends_at', rangeStart),
    supabase.from('time_off')
      .select('staff_id,starts_at,ends_at', { count: 'exact' })
      .eq('business_id', context.business.id)
      .or(`staff_id.is.null,staff_id.in.(${eligibleIds.join(',')})`)
      .lt('starts_at', rangeEnd)
      .gt('ends_at', rangeStart),
  ])
  return buildMonth(context, completeRows(appointmentsResult), completeRows(timeOffResult))
}

function jsonError(message, status, code) {
  return Response.json({ error: { code, message } }, { status, headers: noStoreHeaders })
}

// Dependencies are explicit so the complete HTTP path can be tested without
// production credentials, a provider request, or a server-only module import.
export function createMonthlyAvailabilityHandler({ getPublicBusiness, getMonthlyAvailableSlots, consumeRateLimit, getSafeError }) {
  return async function handleMonthlyAvailability(request, context) {
    const timing = createServerTiming()
    try {
      const { slug: rawSlug } = await context.params
      const slug = slugSchema.parse(rawSlug)
      const url = new URL(request.url)
      const selection = selectionSchema.parse({
        serviceId: url.searchParams.get('service_id'),
        staffId: url.searchParams.has('staff_id') ? url.searchParams.get('staff_id') : undefined,
        month: url.searchParams.get('month'),
      })
      if (!await timing.measure('rate_limit', () => consumeRateLimit(request, { scope: `availability-month:${slug}`, limit: 60, windowSeconds: 60 }))) {
        return jsonError('Твърде много заявки. Опитай отново след малко.', 429, 'RATE_LIMITED')
      }
      const business = await timing.measure('business', () => getPublicBusiness(slug))
      if (!business) return jsonError('Този бизнес не е открит.', 404, 'NOT_FOUND')
      assertInternalBooking(business)
      const result = await timing.measure('availability', () => getMonthlyAvailableSlots({ business, ...selection }))
      return Response.json(result, { headers: { ...timing.headers(), ...noStoreHeaders } })
    } catch (error) {
      const safe = getSafeError(error)
      return jsonError(safe.message, safe.status, safe.code)
    }
  }
}
