import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createReviewHandlers, reviewSchema, reviewVisit, publicReviewPage } from '../lib/reviews.mjs'
import { businessWeeklyHours, groupBusinessServices, profileDetailsSchema, publicProfileDetails, businessDirectionsUrl, businessMapUrl } from '../lib/business-profile.mjs'
import { createProfileUpdateHandler, createReviewAdminHandlers } from '../lib/profile-management.mjs'
import { buildNotificationEmail, notificationIsCurrent } from '../lib/notification-email.mjs'
import { createNotificationWorker } from '../lib/notification-worker.mjs'

const token = '10000000-0000-4000-8000-000000000001', owner = '20000000-0000-4000-8000-000000000001'
const now = Date.parse('2026-10-26T15:00:00Z')
const body = { rating: 4, displayName: 'QA Client', comment: 'Honest feedback.', consent: true, details: { quality: 5 } }
const invite = { token, available_at: '2026-10-26T14:00:00Z', expires_at: '2026-11-25T14:00:00Z', appointment_revision: 3, appointment: { status: 'done', ends_at: '2026-10-26T13:00:00Z', notification_revision: 3, business: { active: true, platform_status: 'enabled', name: 'QA business', slug: 'qa-business' }, service: { name: 'QA service' } } }
const user = { id: owner, email_confirmed_at: '2026-10-25T12:00:00Z', is_anonymous: false }
const request = (value = body, headers = {}, method = 'POST', path = `/api/public/reviews/${token}`) => new Request(`https://www.gorez.co${path}`, { method, headers: { 'Content-Type': 'application/json', Origin: 'https://www.gorez.co', ...headers }, ...(method !== 'GET' ? { body: typeof value === 'string' ? value : JSON.stringify(value) } : {}) })
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
function reviewsHarness(overrides = {}) {
  const reads = [], writes = []
  return { reads, writes, handlers: createReviewHandlers({ lookup: async value => { reads.push(value); return invite }, save: async (...args) => { writes.push(args) }, allowAttempt: async () => true, now: () => now, ...overrides }) }
}

test('ratings accept only explicit 1–5 numbers, a bounded public name/comment, optional dimensions and publish consent', () => {
  assert.equal(reviewSchema.safeParse(body).success, true)
  for (const change of [{ rating: 0 }, { rating: 6 }, { rating: 2.5 }, { rating: '5' }, { consent: false }, { consent: undefined }, { displayName: '<script>' }, { displayName: 'x' }, { comment: 'x'.repeat(1501) }, { details: { quality: 8 } }, { details: { unknown: 5 } }, { appointmentId: token }, { businessId: token }, { status: 'published' }]) assert.equal(reviewSchema.safeParse({ ...body, ...change }).success, false, JSON.stringify(change))
  const parsed = reviewSchema.parse({ ...body, displayName: '  Q. C.  ', comment: '  Thank you  ' })
  assert.equal(parsed.displayName, 'Q. C.'); assert.equal(parsed.comment, 'Thank you')
})
test('private review lookup exposes only business/service/date and submitted state, never booking IDs or contacts', async () => {
  const h = reviewsHarness(), response = await h.handlers.GET(request(null, {}, 'GET'), token)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { visit: { business: { name: 'QA business', slug: 'qa-business' }, service: 'QA service', endsAt: invite.appointment.ends_at, submitted: false } })
  assert.equal(h.writes.length, 0)
  assert.match(response.headers.get('cache-control'), /private, no-store/)
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
})
test('invalid, future, expired, changed, revoked and unpublished review invitations fail closed', () => {
  for (const patch of [null, { ...invite, revoked_at: '2026-10-26T14:30:00Z' }, { ...invite, expires_at: 'invalid' }, { ...invite, available_at: null }, { ...invite, available_at: '2026-10-27T14:00:00Z' }, { ...invite, expires_at: '2026-10-25T14:00:00Z' }, { ...invite, appointment_revision: 2 }, { ...invite, appointment: { ...invite.appointment, status: 'cancelled' } }, { ...invite, appointment: { ...invite.appointment, ends_at: '2026-10-27T13:00:00Z' } }, { ...invite, appointment: { ...invite.appointment, business: { ...invite.appointment.business, platform_status: 'suspended' } } }]) assert.equal(reviewVisit(patch, now), null)
  assert.equal(reviewVisit({ ...invite, used_at: '2026-10-26T14:30:00Z' }, now).submitted, true)
})
test('review POST validates token, origin, content type, size, schema and rate limit before a write', async () => {
  const h = reviewsHarness()
  for (const [req, value, status] of [[request(), 'not-a-token', 404], [request(body, { Origin: 'https://attacker.example' }), token, 403], [request(body, { 'sec-fetch-site': 'cross-site' }), token, 403], [request(body, { 'Content-Type': 'text/plain' }), token, 422], [request('{bad'), token, 422], [request({ ...body, rating: 7 }), token, 422], [request('x'.repeat(8200)), token, 422], [request(body, { 'content-length': '9000' }), token, 422]]) assert.equal((await h.handlers.POST(req, value)).status, status)
  assert.equal(h.writes.length, 0)
  assert.equal((await reviewsHarness({ allowAttempt: async () => false }).handlers.POST(request(), token)).status, 429)
  assert.equal((await reviewsHarness({ allowAttempt: async () => false }).handlers.GET(request(null, {}, 'GET'), token)).status, 429)
})
test('explicit review submission writes once; duplicates and provider/database errors return safe machine codes', async () => {
  const h = reviewsHarness(), response = await h.handlers.POST(request(), token)
  assert.equal(response.status, 201); assert.equal(h.writes.length, 1); assert.deepEqual(h.writes[0], [token, body])
  for (const [message, status] of [['REVIEW_ALREADY_SUBMITTED', 409], ['REVIEW_LINK_UNAVAILABLE', 404], ['database password PRIVATE', 503]]) {
    const result = await reviewsHarness({ save: async () => { throw new Error(message) } }).handlers.POST(request(), token)
    assert.equal(result.status, status); assert.doesNotMatch(JSON.stringify(await result.json()), /password|PRIVATE/)
  }
})
test('public review pagination returns ten rows plus a stable timestamp/ID cursor, not a token', () => {
  const result = publicReviewPage({ summary: { count: 20, average: 4.5 }, items: Array.from({ length: 11 }, (_, index) => ({ id: `id-${index}`, created_at: '2026-10-26T10:00:00Z' })) })
  assert.equal(result.items.length, 10); assert.deepEqual(result.next, { before: '2026-10-26T10:00:00Z', id: 'id-9' })
  assert.equal(publicReviewPage({ summary: { count: 0 }, items: [] }).next, null)
})
test('public profile fields are optional, bounded and reject arbitrary/unpaired coordinates or injected private fields', () => {
  assert.deepEqual(publicProfileDetails({}), { description: { bg: '', en: '' }, payments: [], brands: [], latitude: null, longitude: null })
  for (const value of [{ latitude: 91, longitude: 1 }, { latitude: 42 }, { description: { bg: 'x'.repeat(2001) } }, { payments: ['crypto'] }, { brands: [''] }, { brands: Array(21).fill('Brand') }, { contact_email: 'secret@example.com' }]) assert.equal(profileDetailsSchema.safeParse(value).success, false)
  assert.deepEqual(publicProfileDetails({ public_profile: { private: 'secret' } }), publicProfileDetails({}))
})
test('service groups use only the business’s real categories and preserve service ordering', () => {
  const rows = [{ id: 1, category: 'Hair' }, { id: 2, category: 'Nails' }, { id: 3, category: 'Hair' }, { id: 4 }]
  assert.deepEqual(groupBusinessServices(rows, 'en').map(group => [group.name, group.services.map(row => row.id)]), [['Hair', [1, 3]], ['Nails', [2]], ['Services', [4]]])
  assert.deepEqual(groupBusinessServices([], 'bg'), [])
})
test('published working hours include real lunch breaks, omit inactive staff and merge parallel schedules correctly', () => {
  const business = { staff: [{ id: 'a' }, { id: 'b' }], workingHours: [{ staff_id: 'a', weekday: 1, open_time: '09:00:00', close_time: '18:00:00', break_start: '12:00:00', break_end: '13:00:00' }, { staff_id: 'inactive', weekday: 2, open_time: '00:00', close_time: '23:59' }] }
  assert.deepEqual(businessWeeklyHours(business)[0].periods, ['09:00–12:00', '13:00–18:00'])
  assert.deepEqual(businessWeeklyHours(business)[1].periods, [])
  business.workingHours.push({ staff_id: 'b', weekday: 1, open_time: '11:00', close_time: '14:00' })
  assert.deepEqual(businessWeeklyHours(business)[0].periods, ['09:00–18:00'])
})
test('directions encode an address safely and maps require owner-supplied coordinates, never guessed business positions', () => {
  const address = 'София, ул. Синанишко езеро 13 & 15'
  assert.equal(new URL(businessDirectionsUrl({ address })).searchParams.get('destination'), address + ', България')
  assert.equal(businessMapUrl({ address }), null); assert.equal(businessDirectionsUrl({}), null)
  const business = { address, public_profile: { latitude: 42.7, longitude: 23.32 } }
  assert.equal(new URL(businessDirectionsUrl(business)).searchParams.get('destination'), address + ', България')
  const map = new URL(businessMapUrl(business)); assert.equal(map.hostname, 'www.openstreetmap.org'); assert.equal(map.searchParams.get('marker'), '42.7,23.32')
})
function profileHarness(overrides = {}) {
  const writes = [], ownership = []
  return { writes, ownership, handler: createProfileUpdateHandler({ authenticate: async () => user, ownsBusiness: async (...args) => { ownership.push(args); return true }, update: async (...args) => writes.push(args), allowAttempt: async () => true, ...overrides }) }
}
const profileBody = { businessId: token, profile: { description: { bg: 'A business', en: '' }, payments: ['card'], brands: ['QA Brand'], latitude: null, longitude: null }, reviewRequestsEnabled: true }
test('owner profile updates require a verified session, same origin and actual business ownership', async () => {
  for (const person of [null, { ...user, email_confirmed_at: null }, { ...user, is_anonymous: true }]) assert.equal((await profileHarness({ authenticate: async () => person }).handler(request(profileBody))).status, 401)
  const notOwner = profileHarness({ ownsBusiness: async () => false })
  assert.equal((await notOwner.handler(request(profileBody))).status, 403); assert.equal(notOwner.writes.length, 0)
  const cross = profileHarness(); assert.equal((await cross.handler(request(profileBody, { Origin: 'https://elsewhere.example' }))).status, 403); assert.equal(cross.writes.length, 0)
})
test('owners can update only the public profile and review preference, not platform status, IDs or other owners', async () => {
  const h = profileHarness()
  assert.equal((await h.handler(request(profileBody))).status, 200)
  assert.deepEqual(h.ownership[0], [token, owner]); assert.deepEqual(h.writes[0], [token, owner, { public_profile: profileBody.profile, review_requests_enabled: true }])
  for (const patch of [{ active: true }, { owner_id: token }, { profile: { ...profileBody.profile, platform_status: 'enabled' } }]) assert.equal((await h.handler(request({ ...profileBody, ...patch }))).status, 422)
  assert.equal(h.writes.length, 1)
  assert.equal((await profileHarness({ allowAttempt: async () => false }).handler(request(profileBody))).status, 429)
})
function adminHarness(overrides = {}) {
  const writes = [], reads = []
  return { writes, reads, handlers: createReviewAdminHandlers({ authenticate: async () => user, isAdmin: () => true, list: async value => { reads.push(value); return { items: [], next: null } }, moderate: async (...args) => writes.push(args), allowAttempt: async () => true, ...overrides }) }
}
const action = { id: token, status: 'hidden', revision: 0, reason: 'Contains exposed private information' }
test('review moderation is unavailable to anonymous, unverified or ordinary business owners', async () => {
  for (const overrides of [{ authenticate: async () => null }, { authenticate: async () => ({ ...user, email_confirmed_at: null }) }, { authenticate: async () => ({ ...user, is_anonymous: true }) }, { isAdmin: () => false }]) {
    const h = adminHarness(overrides)
    assert.ok([401, 403].includes((await h.handlers.GET(request(null, {}, 'GET', '/api/admin/reviews'))).status))
    assert.ok([401, 403].includes((await h.handlers.PATCH(request(action, {}, 'PATCH', '/api/admin/reviews'))).status))
    assert.equal(h.reads.length, 0); assert.equal(h.writes.length, 0)
  }
})
test('administrator can hide/restore with a reason and server-derived actor but cannot alter rating or comment', async () => {
  const h = adminHarness(), req = value => request(value, {}, 'PATCH', '/api/admin/reviews')
  assert.equal((await h.handlers.PATCH(req(action))).status, 200); assert.deepEqual(h.writes[0], [action, owner])
  for (const patch of [{ rating: 5 }, { comment: 'Changed' }, { actor: token }, { reason: '' }, { revision: -1 }, { status: 'deleted' }]) assert.equal((await h.handlers.PATCH(req({ ...action, ...patch }))).status, 422)
  assert.equal(h.writes.length, 1)
  assert.equal((await h.handlers.PATCH(request(action, { Origin: 'https://bad.example' }, 'PATCH'))).status, 403)
})
test('admin review list validates stable cursors and returns private no-store responses', async () => {
  const h = adminHarness()
  const response = await h.handlers.GET(request(null, {}, 'GET', `/api/admin/reviews?status=hidden&before=2026-10-26T15:00:00Z&id=${token}`))
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /private, no-store/)
  assert.equal(h.reads[0].id, token)
  assert.equal((await h.handlers.GET(request(null, {}, 'GET', '/api/admin/reviews?before=invalid'))).status, 422)
  assert.equal((await h.handlers.GET(request(null, {}, 'GET', '/api/admin/reviews?status=anything'))).status, 422)
})
test('stale admin moderation does not silently overwrite another administrator’s decision', async () => {
  const h = adminHarness({ moderate: async () => { throw new Error('REVIEW_CHANGED') } })
  assert.equal((await h.handlers.PATCH(request(action, {}, 'PATCH'))).status, 409)
})
const completed = { id: token, business_id: token, starts_at: '2026-10-26T12:00:00Z', ends_at: '2026-10-26T13:00:00Z', status: 'done', notification_revision: 3, cancellation_token: 'PRIVATE_BOOKING_TOKEN', email_notifications_requested: true, review_invitation: { ...invite, appointment: undefined }, business: { ...invite.appointment.business, review_requests_enabled: true, email_notifications_enabled: true, timezone: 'Europe/Sofia', contact_email: 'owner@example.com' }, service: { name: '<QA service>' }, staff: { name: 'QA person' }, customer: { email: 'client@example.com', name: 'PRIVATE_CLIENT_NAME', phone: 'PRIVATE_PHONE' }, notes: 'PRIVATE_CRM_NOTE' }
const message = { id: token, appointment_id: token, business_id: token, appointment_revision: 3, recipient: 'client@example.com', locale: 'bg', kind: 'review_request', created_at: '2026-10-25T14:00:00Z', scheduled_for: '2026-10-26T14:00:00Z', first_attempt_at: '2026-10-26T15:00:00Z', attempts: 1, claim_token: 'QA_LEASE' }
test('review email revalidation accepts only completed, ended, still-current, unused and non-expired visits', () => {
  assert.equal(notificationIsCurrent(message, completed, now), true)
  for (const patch of [{ status: 'no_show' }, { status: 'cancelled' }, { status: 'confirmed' }, { ends_at: '2026-10-27T13:00:00Z' }, { notification_revision: 4 }, { customer: { email: null } }, { business: { ...completed.business, review_requests_enabled: false } }, { business: { ...completed.business, platform_status: 'suspended' } }]) assert.equal(notificationIsCurrent(message, { ...completed, ...patch }, now), false)
  for (const patch of [{ used_at: '2026-10-26T14:30:00Z' }, { revoked_at: '2026-10-26T14:30:00Z' }, { available_at: '2026-10-27T14:00:00Z' }, { expires_at: '2026-10-25T14:00:00Z' }, { appointment_revision: 1 }, { expires_at: 'invalid' }]) assert.equal(notificationIsCurrent(message, { ...completed, review_invitation: { ...completed.review_invitation, ...patch } }, now), false)
  assert.equal(notificationIsCurrent({ ...message, scheduled_for: '2026-10-20T14:00:00Z' }, completed, now), false)
})
test('review emails are neutral BG/EN messages with one private review link and no management token, CRM notes or client contacts', () => {
  for (const locale of ['bg', 'en']) {
    const mail = buildNotificationEmail({ ...message, locale }, completed, { origin: 'https://www.gorez.co', from: 'GoRez <info@gorez.co>' })
    assert.match(mail.text, new RegExp(`https://www.gorez.co/review/${token}\\?lang=${locale}`))
    assert.match(mail.text, locale === 'en' ? /honest rating/ : /честна оценка/)
    assert.doesNotMatch(mail.html + mail.text, /PRIVATE_|5 stars|пет звезди/)
    assert.doesNotMatch(mail.html, /<QA service>/)
    assert.match(mail.html, /&lt;QA service&gt;/)
    if (locale === 'en') assert.doesNotMatch(mail.html, /[А-Яа-я]/)
    assert.equal(mail.reply_to, 'owner@example.com')
  }
})
test('the existing durable worker delivers review invitations with its frozen payload/idempotency key, with no real provider call', async () => {
  const rows = [message], writes = [], calls = []
  const run = createNotificationWorker({ env: { EMAIL_NOTIFICATIONS_ENABLED: 'true', RESEND_API_KEY: 'OFFLINE_ONLY', EMAIL_FROM: 'GoRez <info@gorez.co>' }, now: () => now, pause: async () => {}, store: { claim: async () => rows.shift(), appointment: async () => completed, prepare: async (_row, payload) => { writes.push(payload); return true }, current: async () => true, finish: async (_row, patch) => writes.push(patch) }, fetcher: async (url, request) => { calls.push({ url, request }); return Response.json({ id: 'QA_PROVIDER' }) } })
  assert.equal((await run()).accepted, 1); assert.equal(calls.length, 1)
  assert.equal(calls[0].request.headers['Idempotency-Key'], `gorez/${token}`)
  assert.equal(writes[1].provider_message_id, 'QA_PROVIDER')
})
test('new private pages are noindex/no-referrer; local fictional profile/review fixtures are production-gated', async () => {
  const config = await read('next.config.mjs'), robots = await read('app/robots.js'), fixture = await read('app/dev/business-profile/page.js')
  assert.match(config, /'\/review\/:path\*'/); assert.match(config, /'\/admin\/:path\*'/)
  assert.match(robots, /'\/review\/'/); assert.match(fixture, /if \(process.env.NODE_ENV === 'production'\) notFound\(\)/)
  const form = await read('components/review-form.js')
  assert.doesNotMatch(form, /trackProductEvent|trackEvent|dangerouslySetInnerHTML|localStorage/)
  assert.match(form, /<form onSubmit=\{submit\}/); assert.match(form, /required type="checkbox"/)
  const profile = await read('components/business-profile.js')
  assert.match(profile, /mapLoaded \? <iframe/); assert.match(profile, /onClick=\{\(\) => setMapLoaded\(true\)\}/)
  assert.doesNotMatch(profile, /studio24|Valentino|5\.0|27 отзива/)
  const exportRoute = await read('app/api/owner/public-profile/route.js')
  assert.match(exportRoute, /\.eq\('id', id\)\.eq\('owner_id', user\.id\)/)
  assert.match(exportRoute, /\.select\('id,rating,display_name,comment,quality,service_rating,cleanliness,atmosphere,status,created_at'\)/)
  assert.doesNotMatch(exportRoute, /\.select\('[^']*(invitation_id|payload|token)[^']*'\)/)
})
