import { z } from 'zod'
import { profileDetailsSchema } from './business-profile.mjs'
import { businessLocationFields, findCity } from './business-location.mjs'
import { PARTNER_CATEGORY_KEYS } from './partner-leads.mjs'
import { scheduleProblem } from './business-schedule.mjs'
import { privateReviewJson as privateJson } from './reviews.mjs'
import { sameOriginRequest } from './profile-management.mjs'

const optionalText = max => z.string().trim().max(max).nullable().transform(value => value || null)
const email = z.union([z.literal(''), z.email()]).nullable().transform(value => value || null)
const url = z.union([z.literal(''), z.url().refine(value => { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password })]).nullable().transform(value => value || null)
const duration = z.coerce.number().int().min(5).max(1440)
export const businessContentSchema = z.object({
  name: z.string().trim().min(2).max(120), slug: z.string().min(3).max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  phone: optionalText(32), contact_email: email, address: z.string().trim().min(2).max(250),
  city_ekatte: z.string().refine(value => Boolean(findCity(value))), neighborhood: z.string().trim().max(120),
  industry: z.enum(PARTNER_CATEGORY_KEYS), timezone: z.enum(['Europe/Sofia', 'Europe/London', 'Europe/Berlin']),
  website_url: url, privacy_contact_email: email, booking_terms: optionalText(5000),
  default_duration_min: duration, booking_slot_minutes: z.coerce.number().refine(value => [5, 10, 15, 20, 30, 45, 60].includes(value)),
  booking_window_days: z.coerce.number().int().min(1).max(365), minimum_notice_minutes: z.coerce.number().int().min(0).max(10080), cancellation_notice_hours: z.coerce.number().int().min(0).max(720),
  email_notifications_enabled: z.boolean(), notification_locale: z.enum(['bg', 'en']), review_requests_enabled: z.boolean(),
  public_profile: profileDetailsSchema, welcome_message: optionalText(2000), bot_instructions: optionalText(8000),
}).strict().transform(value => ({ ...value, ...businessLocationFields(value.city_ekatte, value.neighborhood) }))
const id = z.string().uuid().optional()
export const contentSections = {
  business: businessContentSchema,
  services: z.array(z.object({ id, name: z.string().trim().min(2).max(120), description: optionalText(2000), category: optionalText(80), duration_min: z.preprocess(v=>v===''?null:v,duration.nullable()), price: z.preprocess(v=>v===''?null:v,z.coerce.number().min(0).max(999999.99).multipleOf(.01).nullable()), active: z.boolean(), sort_order: z.number().int().min(0).max(9999) }).strict()).max(100),
  staff: z.array(z.object({ id, name: z.string().trim().min(2).max(100), email, phone: optionalText(32), bio: optionalText(2000), active: z.boolean(), sort_order: z.number().int().min(0).max(9999) }).strict()).max(50),
  hours: z.object({ staffId: z.string().uuid(), days: z.array(z.object({ weekday: z.number().int().min(1).max(7), enabled: z.boolean(), open: z.string(), close: z.string(), breakEnabled: z.boolean(), breakStart: z.string(), breakEnd: z.string() }).strict()).length(7).refine(days => new Set(days.map(day => day.weekday)).size === 7 && !scheduleProblem(days)) }).strict(),
}
export function parseContentUpdate(value) {
  const envelope = z.object({ revision: z.number().int().nonnegative(), section: z.enum(['business', 'services', 'staff', 'hours']), payload: z.unknown(), reason: z.string().trim().min(3).max(500) }).strict().parse(value)
  const payload = contentSections[envelope.section].parse(envelope.payload)
  if (Array.isArray(payload)) { const ids = payload.map(row => row.id).filter(Boolean); if (new Set(ids).size !== ids.length) throw new Error('VALIDATION_ERROR') }
  return { ...envelope, payload }
}
export const contentFailure = error => {
  const known = ['CONTENT_CHANGED', 'BUSINESS_NOT_FOUND', 'RESTORE_FIRST', 'WRONG_BUSINESS', 'UPCOMING_BOOKINGS', 'SCHEDULE_CONFLICT', 'TIMEZONE_BOOKINGS', 'MEDIA_LIMIT', 'MEDIA_NOT_FOUND']
  const code = known.find(key => error?.message?.includes(key)) || (error?.code === '23505' ? 'ADDRESS_IN_USE' : error?.name === 'ZodError' || error instanceof SyntaxError || error?.message === 'VALIDATION_ERROR' ? 'VALIDATION_ERROR' : 'CONTENT_UNAVAILABLE')
  return privateJson({ error: { code } }, code === 'BUSINESS_NOT_FOUND' || code === 'MEDIA_NOT_FOUND' ? 404 : code === 'VALIDATION_ERROR' ? 422 : code === 'CONTENT_UNAVAILABLE' ? 503 : 409)
}
export function createContentHandler({ authenticate, isAdmin, allowAttempt, save }) {
  return async (request, businessId) => {
    try {
      const user = await authenticate(request)
      if (!user?.id || !user.email_confirmed_at || user.is_anonymous) return privateJson({ error: { code: 'UNAUTHORIZED' } }, 401)
      if (!isAdmin(user) || !sameOriginRequest(request)) return privateJson({ error: { code: 'FORBIDDEN' } }, 403)
      if (!z.string().uuid().safeParse(businessId).success || !request.headers.get('content-type')?.startsWith('application/json') || Number(request.headers.get('content-length')) > 300000) return privateJson({ error: { code: 'VALIDATION_ERROR' } }, 422)
      if (!await allowAttempt(request, user.id)) return privateJson({ error: { code: 'RATE_LIMITED' } }, 429)
      const raw = await request.text()
      if (new TextEncoder().encode(raw).byteLength > 300000) return privateJson({ error: { code: 'VALIDATION_ERROR' } }, 422)
      const input = parseContentUpdate(JSON.parse(raw))
      await save({ businessId, actorId: user.id, ...input })
      return privateJson({ ok: true })
    } catch (error) { return contentFailure(error) }
  }
}
