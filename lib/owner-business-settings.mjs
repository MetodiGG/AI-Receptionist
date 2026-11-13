import { z } from 'zod'
import { businessContentInputSchema, businessLocationUpdatePayload } from './business-content.mjs'
import { businessLocationFields } from './business-location.mjs'
import { publicProfileDetails } from './business-profile.mjs'
import { sameOriginRequest } from './profile-management.mjs'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'

// Exactly the existing owner settings form, never publication, ownership,
// booking mode, slug, review preferences or a client-supplied coordinate pair.
const settings = businessContentInputSchema.omit({ slug: true, public_profile: true, review_requests_enabled: true })
  .extend({ booking_slot_minutes: z.coerce.number().refine(value => [5, 10, 15, 20, 30, 45, 60, 90, 120].includes(value)) })
  .transform(value => ({ ...value, ...businessLocationFields(value.city_ekatte, value.neighborhood) }))
export const ownerBusinessSettingsSchema = z.object({
  businessId: z.string().uuid(), revision: z.number().int().nonnegative(), profile: settings,
}).strict()
const reply = (body, status = 200) => Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS })
async function readSettingsText(request) {
  if (!request.body) throw Error('VALIDATION_ERROR')
  const reader = request.body.getReader(), decoder = new TextDecoder('utf-8', { fatal: true })
  let bytes = 0, text = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > 100000) { await reader.cancel(); throw Error('VALIDATION_ERROR') }
      text += decoder.decode(value, { stream: true })
    }
    return text + decoder.decode()
  } catch { throw Error('VALIDATION_ERROR') }
  finally { reader.releaseLock() }
}

export async function saveOwnerBusinessSettings(db, { businessId, ownerId, revision, patch }) {
  // One conditional row mutation: profile metadata and the changed physical
  // address commit together. Existing row/source/revision triggers still run.
  const { data, error } = await db.from('businesses').update(patch)
    .eq('id', businessId).eq('owner_id', ownerId).eq('content_revision', revision).select('id,content_revision').maybeSingle()
  if (error) throw error
  if (!data) throw Error('CONTENT_CHANGED')
  return data
}

export function createOwnerBusinessSettingsHandler({ authenticate, allowAttempt, readBusiness, hasUpcomingBookings, save }) {
  return async request => {
    try {
      const user = await authenticate(request)
      if (!user?.id || !user.email_confirmed_at || user.is_anonymous) return reply({ error: { code: 'UNAUTHORIZED' } }, 401)
      if (!sameOriginRequest(request)) return reply({ error: { code: 'FORBIDDEN' } }, 403)
      if (!request.headers.get('content-type')?.startsWith('application/json') || Number(request.headers.get('content-length')) > 100000) return reply({ error: { code: 'VALIDATION_ERROR' } }, 422)
      if (!await allowAttempt(request, user.id)) return reply({ error: { code: 'RATE_LIMITED' } }, 429)
      const text = await readSettingsText(request)
      const input = ownerBusinessSettingsSchema.parse(JSON.parse(text))
      const current = await readBusiness(input.businessId, user.id)
      if (!current || current.owner_id !== user.id) return reply({ error: { code: 'FORBIDDEN' } }, 403)
      if (current.platform_status === 'archived') return reply({ error: { code: 'RESTORE_FIRST' } }, 409)
      if (current.content_revision == null || !Number.isSafeInteger(Number(current.content_revision)) || Number(current.content_revision) !== input.revision) return reply({ error: { code: 'CONTENT_CHANGED' } }, 409)
      if (current.timezone !== input.profile.timezone && await hasUpcomingBookings(input.businessId)) return reply({ error: { code: 'TIMEZONE_BOOKINGS' } }, 409)
      const patch = businessLocationUpdatePayload(current, { ...input.profile, public_profile: publicProfileDetails(current) })
      const saved = await save({ businessId: input.businessId, ownerId: user.id, revision: input.revision, patch })
      const revision = Number(saved?.content_revision)
      return reply({ ok: true, ...(saved?.content_revision != null && Number.isSafeInteger(revision) ? { revision } : {}) })
    } catch (error) {
      const code = ['CONTENT_CHANGED', 'TIMEZONE_BOOKINGS', 'SCHEDULE_CONFLICT', 'UPCOMING_BOOKINGS', 'RESTORE_FIRST'].find(value => error?.message?.includes(value))
      if (code) return reply({ error: { code } }, 409)
      if (error?.name === 'ZodError' || error instanceof SyntaxError || error?.message === 'VALIDATION_ERROR') return reply({ error: { code: 'VALIDATION_ERROR' } }, 422)
      return reply({ error: { code: 'SETTINGS_UNAVAILABLE' } }, 503)
    }
  }
}
