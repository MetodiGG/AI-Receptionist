import { z } from 'zod'
import { DateTime } from 'luxon'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'
import { sameOriginRequest } from './profile-management.mjs'

export const REPORT_STATUSES = ['booked', 'confirmed', 'done', 'cancelled', 'no_show']
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const querySchema = z.object({
  from: date.optional(), to: date.optional(),
  basis: z.enum(['visit', 'created']).default('visit'),
  status: z.enum(['all', ...REPORT_STATUSES]).default('all'),
  view: z.enum(['bookings', 'customers']).default('bookings'),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(25),
}).strict().refine(value => Boolean(value.from) === Boolean(value.to))

export function parseBusinessReportQuery(searchParams) {
  const entries = [...searchParams.entries()]
  if (new Set(entries.map(([key]) => key)).size !== entries.length) throw Error('VALIDATION_ERROR')
  return querySchema.parse(Object.fromEntries(entries))
}

export function businessReportPeriod(query, timezone, now = Date.now()) {
  const today = DateTime.fromMillis(now, { zone: timezone }).startOf('day')
  if (!today.isValid) throw Error('INVALID_BUSINESS_TIMEZONE')
  const from = query.from || today.minus({ days: 29 }).toISODate(), to = query.to || today.toISODate()
  const start = DateTime.fromISO(from, { zone: timezone }).startOf('day')
  const last = DateTime.fromISO(to, { zone: timezone }).startOf('day')
  if (!start.isValid || !last.isValid || start.toISODate() !== from || last.toISODate() !== to
    || start.year < 1 || last.year > 9998 || start > last || last.diff(start, 'days').days + 1 > 366) throw Error('VALIDATION_ERROR')
  return { from, to, basis: query.basis, timezone, startAt: start.toUTC().toISO(), endAtExclusive: last.plus({ days: 1 }).toUTC().toISO() }
}

const count = z.number().int().nonnegative()
const statuses = z.object(Object.fromEntries(REPORT_STATUSES.map(status => [status, count])))
const contact = z.object({ id: z.uuid(), name: z.string().nullable(), phone: z.string().nullable(), email: z.string().nullable() })
const entity = z.object({ id: z.uuid(), name: z.string().nullable() })
const instant = z.string().refine(value => DateTime.fromISO(value, { setZone: true }).isValid)
const booking = z.object({ id: z.uuid(), startsAt: instant, endsAt: instant, createdAt: instant, status: z.enum(REPORT_STATUSES), source: z.string(), customer: contact.nullable(), service: entity.nullable(), staff: entity.nullable() })
const customer = contact.extend({ bookings: count, statuses, firstVisitAt: instant, lastVisitAt: instant })
const reportSchema = z.object({ summary: z.object({ bookings: count, customers: count, statuses }), filtered: z.object({ bookings: count, customers: count }), view: z.enum(['bookings', 'customers']), page: count.min(1), pageSize: count.min(1).max(50), totalRows: count, totalPages: count, rows: z.array(z.unknown()).max(50) })

// Explicit output allowlist: never return CRM notes, questionnaire answers,
// conversations, cancellation links/tokens or unrelated business records.
export function safeBusinessReport(value, query) {
  const result = reportSchema.parse(value)
  if (result.view !== query.view || result.page !== query.page || result.pageSize !== query.limit || result.rows.length > query.limit
    || result.totalRows !== result.filtered[query.view] || result.totalPages !== Math.ceil(result.totalRows / query.limit)
    || REPORT_STATUSES.reduce((sum, status) => sum + result.summary.statuses[status], 0) !== result.summary.bookings
    || result.filtered.bookings > result.summary.bookings || result.filtered.customers > result.summary.customers) throw Error('REPORT_UNAVAILABLE')
  return { ...result, rows: result.rows.map(row => (query.view === 'bookings' ? booking : customer).parse(row)) }
}

export function createAdminBusinessReportHandler({ authenticate, isAdmin, allowAttempt, readBusiness, load, now = Date.now }) {
  return async (request, businessId) => {
    const json = (body, status = 200) => Response.json(body, { status, headers: { ...PRIVATE_RESPONSE_HEADERS, Vary: 'Authorization' } })
    const fail = (code, status) => json({ error: { code } }, status)
    try {
      const user = await authenticate(request)
      if (!user?.id) return fail('UNAUTHORIZED', 401)
      if (!user.email_confirmed_at || user.is_anonymous || !isAdmin(user) || !sameOriginRequest(request)) return fail('FORBIDDEN', 403)
      if (!z.uuid().safeParse(businessId).success) return fail('VALIDATION_ERROR', 422)
      let query
      try { query = parseBusinessReportQuery(new URL(request.url).searchParams) } catch { return fail('VALIDATION_ERROR', 422) }
      if (!await allowAttempt(request, user.id)) return fail('RATE_LIMITED', 429)
      const business = await readBusiness(businessId)
      if (!business) return fail('BUSINESS_NOT_FOUND', 404)
      let period
      try { period = businessReportPeriod(query, business.timezone || 'Europe/Sofia', now()) }
      catch (problem) { if (problem.message === 'VALIDATION_ERROR') return fail('VALIDATION_ERROR', 422); throw problem }
      const report = safeBusinessReport(await load({ businessId, ...query, startAt: period.startAt, endAtExclusive: period.endAtExclusive }), query)
      return json({ business: { id: business.id, name: business.name, timezone: period.timezone, bookingMode: business.booking_mode || 'gorez' }, period, ...report })
    } catch (problem) { return fail(problem?.message?.includes('BUSINESS_NOT_FOUND') ? 'BUSINESS_NOT_FOUND' : 'REPORT_UNAVAILABLE', problem?.message?.includes('BUSINESS_NOT_FOUND') ? 404 : 503) }
  }
}
