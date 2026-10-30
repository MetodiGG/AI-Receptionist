import { timingSafeEqual } from 'node:crypto'
import { createNotificationWorker } from './notification-worker.mjs'
import { PRIVATE_RESPONSE_HEADERS } from './booking-safety.mjs'

// Operator-owned staging fixture only. Never accept a recipient/tenant/visit
// from the browser, or widen the normal notification worker's global flags.
export const REVIEW_TEST = Object.freeze({
  project: 'dbvsfxkmljrwjberwodb',
  branch: 'codex/ai-business-search',
  origin: 'https://ai-receptionist-git-codex-ai-business-search-ai-receptionist12.vercel.app',
  recipient: 'info@gorez.co',
  business: '73000000-0000-4000-8000-000000000001',
  owner: '73000000-0000-4000-8000-000000000002',
  staff: '73000000-0000-4000-8000-000000000003',
  service: '73000000-0000-4000-8000-000000000004',
  customer: '73000000-0000-4000-8000-000000000005',
  appointment: '73000000-0000-4000-8000-000000000006',
  name: '[TEST] GoRez Preview Review',
  slug: 'test-preview-review-20261030',
})
export function previewReviewTestEnabled(env) {
  return env.VERCEL_ENV === 'preview' && env.VERCEL_GIT_COMMIT_REF === REVIEW_TEST.branch
    && env.PREVIEW_REVIEW_TEST_ENABLED === 'true'
    && env.NEXT_PUBLIC_SUPABASE_URL === `https://${REVIEW_TEST.project}.supabase.co`
}
function secretMatches(actual, expected) {
  if (typeof expected !== 'string' || expected.length < 32 || typeof actual !== 'string') return false
  const a = Buffer.from(actual), b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
function fixtureMatches(appointment, row) {
  return appointment?.id === REVIEW_TEST.appointment && appointment.business_id === REVIEW_TEST.business
    && appointment.business?.name === REVIEW_TEST.name && appointment.business?.slug === REVIEW_TEST.slug
    && appointment.customer?.email === REVIEW_TEST.recipient && appointment.status === 'done'
    && row.appointment_id === REVIEW_TEST.appointment && row.business_id === REVIEW_TEST.business
    && row.kind === 'review_request' && row.recipient === REVIEW_TEST.recipient
}
export function previewReviewPayloadAllowed(payload) {
  return payload?.from === `GoRez <${REVIEW_TEST.recipient}>`
    && Array.isArray(payload.to) && payload.to.length === 1 && payload.to[0] === REVIEW_TEST.recipient
    && !payload.cc && !payload.bcc && !payload.attachments && !payload.reply_to
    && typeof payload.subject === 'string' && payload.subject.includes(REVIEW_TEST.name)
    && typeof payload.text === 'string'
    && payload.text.includes(`${REVIEW_TEST.origin}/review/`)
}
export function createPreviewReviewTestHandler({ env, store, inspect, allowAttempt, fetcher = fetch, now = Date.now }) {
  return async request => {
    const reply = (body, status) => Response.json(body, { status, headers: PRIVATE_RESPONSE_HEADERS })
    if (!previewReviewTestEnabled(env)) return reply({ error: 'NOT_FOUND' }, 404)
    if (request.method !== 'POST') return reply({ error: 'METHOD_NOT_ALLOWED' }, 405)
    if (request.headers.get('origin') !== REVIEW_TEST.origin || request.headers.get('sec-fetch-site') === 'cross-site') return reply({ error: 'FORBIDDEN' }, 403)
    if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded') || Number(request.headers.get('content-length')) > 2048) return reply({ error: 'INVALID_REQUEST' }, 422)
    try {
      const body = await request.text()
      if (body.length > 2048) return reply({ error: 'INVALID_REQUEST' }, 422)
      const fields = new URLSearchParams(body)
      if ([...fields.keys()].some(key => key !== 'secret') || fields.getAll('secret').length !== 1) return reply({ error: 'INVALID_REQUEST' }, 422)
      if (!secretMatches(fields.get('secret'), env.PREVIEW_REVIEW_TEST_SECRET)) return reply({ error: 'UNAUTHORIZED' }, 401)
      if (!env.RESEND_API_KEY) return reply({ error: 'PREVIEW_SENDER_NOT_CONFIGURED' }, 503)
      if (!await allowAttempt(request)) return reply({ error: 'RATE_LIMITED' }, 429)
      const { appointment, rows } = await inspect()
      if (rows?.length !== 1 || !fixtureMatches(appointment, rows[0])) return reply({ error: 'ISOLATED_FIXTURE_REQUIRED' }, 409)
      if (rows[0].status === 'sent') return reply({ accepted: true, alreadyAccepted: true, note: 'No additional email was sent.' }, 200)
      const scopedStore = {
        ...store,
        async claim(id, reminders) {
          if (id !== REVIEW_TEST.appointment || reminders) throw new Error('TEST_SCOPE')
          const row = await store.claim(id, false)
          if (row && !fixtureMatches(appointment, row)) throw new Error('TEST_SCOPE')
          return row
        },
      }
      const worker = createNotificationWorker({
        store: scopedStore, now, pause: async () => {},
        env: { ...env, EMAIL_NOTIFICATIONS_ENABLED: 'true', EMAIL_REMINDERS_ENABLED: 'false',
          EMAIL_FROM: `GoRez <${REVIEW_TEST.recipient}>`, NEXT_PUBLIC_APP_URL: REVIEW_TEST.origin },
        fetcher: async (url, options) => {
          if (url !== 'https://api.resend.com/emails' || options.method !== 'POST' || !previewReviewPayloadAllowed(JSON.parse(options.body))) throw new Error('TEST_SCOPE')
          return fetcher(url, options)
        },
      })
      const stats = await worker({ appointmentId: REVIEW_TEST.appointment, limit: 1 })
      return reply({ ...stats, note: 'Provider acceptance is not inbox delivery. Check info@gorez.co.' }, stats.failed ? 502 : 200)
    } catch { return reply({ error: 'PREVIEW_TEST_UNCONFIRMED' }, 503) }
  }
}
