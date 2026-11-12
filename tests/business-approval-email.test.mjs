import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { approvalNoticeIsCurrent, buildBusinessApprovalEmail, createBusinessApprovalEmailWorker } from '../lib/business-approval-email.mjs'
import { serializeEmailPayload } from '../lib/notification-email.mjs'

const now = Date.parse('2026-11-12T12:00:00Z')
const env = { EMAIL_NOTIFICATIONS_ENABLED: 'true', RESEND_API_KEY: 'offline-test-only', EMAIL_FROM: 'GoRez <info@gorez.co>' }
const row = { id: 'offline-message', business_id: 'offline-business', owner_id: 'offline-owner', recipient: 'owner@example.com', locale: 'bg', attempts: 1, claim_token: 'offline-claim', created_at: new Date(now).toISOString(), first_attempt_at: new Date(now).toISOString() }
const context = { business: { id: row.business_id, owner_id: row.owner_id, name: 'Offline Salon', slug: 'offline-salon', active: true, platform_status: 'enabled', contact_email: 'other-contact@example.com' }, owner: { id: row.owner_id, email: 'owner@example.com', email_confirmed_at: '2026-11-12T11:59:00Z', is_anonymous: false } }

test('approval notice is one BG/EN owner message with canonical sign-in/profile links and no authentication token', () => {
  for (const locale of ['bg', 'en']) {
    const message = buildBusinessApprovalEmail({ ...row, locale }, context, env.EMAIL_FROM)
    assert.deepEqual(message.to, ['owner@example.com'])
    assert.match(message.text, new RegExp(`https://www.gorez.co/login\\?lang=${locale}`))
    assert.match(message.text, new RegExp(`https://www.gorez.co/book/offline-salon\\?lang=${locale}`))
    assert.match(message.html, new RegExp(`<html lang="${locale}">`))
    assert.doesNotMatch(JSON.stringify(message), /other-contact|access_token|refresh_token|magiclink|\/auth\/confirm|\/booking\//)
    assert.match(message.text, locale === 'en' ? /password you chose/ : /паролата, които избра/)
    if (locale === 'en') assert.doesNotMatch(message.html, /[А-Яа-я]/)
  }
})

test('approval email escapes business markup/headers and rejects untrusted recipient, slug or sender', () => {
  const message = buildBusinessApprovalEmail(row, { ...context, business: { ...context.business, name: '<img onerror="bad">\r\nBcc:other@example.com' } }, env.EMAIL_FROM)
  assert.doesNotMatch(message.html, /<img|onerror="bad"/)
  assert.doesNotMatch(message.subject, /[\r\n]/)
  for (const args of [[{ ...row, recipient: 'bad\n@example.com' }, context, env.EMAIL_FROM], [row, { ...context, business: { ...context.business, slug: '../login?bad=yes' } }, env.EMAIL_FROM], [row, context, 'GoRez\r\nBcc:other@example.com']]) assert.throws(() => buildBusinessApprovalEmail(...args))
})

test('delivery requires the exact still-published business, matching confirmed Auth owner and valid retry window', () => {
  assert.equal(approvalNoticeIsCurrent(row, context, now), true)
  const badContexts = [null, { ...context, business: { ...context.business, id: 'other' } }, { ...context, business: { ...context.business, owner_id: 'other' } }, { ...context, business: { ...context.business, active: false } }, { ...context, business: { ...context.business, platform_status: 'suspended' } }, { ...context, business: { ...context.business, platform_status: 'archived' } }, { ...context, owner: { ...context.owner, id: 'other' } }, { ...context, owner: { ...context.owner, email: 'new-owner@example.com' } }, { ...context, owner: { ...context.owner, email_confirmed_at: null } }, { ...context, owner: { ...context.owner, is_anonymous: true } }, { ...context, owner: { ...context.owner, banned_until: new Date(now + 60000).toISOString() } }, { ...context, owner: { ...context.owner, banned_until: 'bad' } }]
  for (const value of badContexts) assert.equal(approvalNoticeIsCurrent(row, value, now), false)
  for (const patch of [{ recipient: 'bad' }, { created_at: 'bad' }, { created_at: new Date(now + 1).toISOString() }, { created_at: new Date(now - 7 * 86400000).toISOString() }, { first_attempt_at: 'bad' }, { first_attempt_at: new Date(now + 1).toISOString() }, { first_attempt_at: new Date(now - 23 * 3600000).toISOString() }]) assert.equal(approvalNoticeIsCurrent({ ...row, ...patch }, context, now), false)
})

function harness({ rows = [structuredClone(row)], currentContext = context, response, prepare = true, current = true, failedSentFinish = false, envPatch = {}, clock = () => now } = {}) {
  const sent = [], changes = [], claims = [], pauses = []
  const store = {
    async claim(id) { claims.push(id); return rows.shift() || null },
    async context() { return currentContext },
    async prepare(_row, payload) { changes.push({ prepared: structuredClone(payload) }); return prepare },
    async current() { return typeof current === 'function' ? current() : current },
    async finish(_row, patch) { changes.push(patch); if (failedSentFinish && patch.status === 'sent') throw Error('private DB error') },
  }
  const run = createBusinessApprovalEmailWorker({ store, env: { ...env, ...envPatch }, now: clock, pause: async ms => { pauses.push(ms) },
    fetcher: async (url, options) => { sent.push({ url, options }); const value = typeof response === 'function' ? response() : Array.isArray(response) ? response.shift() : response; if (value instanceof Error) throw value; return value || Response.json({ id: 'offline-provider-id' }) } })
  return { run, sent, changes, claims, pauses }
}

test('missing/disabled email configuration never claims or sends an approval notice', async () => {
  for (const envPatch of [{ EMAIL_NOTIFICATIONS_ENABLED: 'false' }, { EMAIL_NOTIFICATIONS_ENABLED: '' }, { RESEND_API_KEY: '' }, { EMAIL_FROM: '' }]) {
    const h = harness({ envPatch }); assert.equal((await h.run()).disabled, true); assert.equal(h.sent.length, 0); assert.equal(h.claims.length, 0)
  }
})

test('first attempt freezes payload and uses one stable provider idempotency key, owner recipient and targeted claim', async () => {
  const h = harness()
  assert.deepEqual(await h.run({ businessId: row.business_id, limit: 1 }), { processed: 1, accepted: 1, failed: 0, skipped: 0 })
  assert.deepEqual(h.claims, [row.business_id])
  assert.equal(h.sent[0].url, 'https://api.resend.com/emails')
  assert.equal(h.sent[0].options.headers['Idempotency-Key'], 'gorez/approval/offline-message')
  assert.deepEqual(JSON.parse(h.sent[0].options.body).to, ['owner@example.com'])
  assert.deepEqual(JSON.parse(h.sent[0].options.body), h.changes[0].prepared)
  assert.equal(h.changes[1].provider_message_id, 'offline-provider-id')
  assert.equal(h.changes[1].status, 'sent')
})

test('a retry reuses byte-identical frozen content even if current business name has changed', async () => {
  const payload = buildBusinessApprovalEmail(row, context, env.EMAIL_FROM)
  const reversed = Object.fromEntries(Object.entries(payload).reverse())
  const h = harness({ rows: [{ ...row, attempts: 2, payload: reversed }], currentContext: { ...context, business: { ...context.business, name: 'Changed name' } } })
  await h.run()
  assert.equal(h.changes.some(change => change.prepared), false)
  assert.equal(h.sent[0].options.body, serializeEmailPayload(payload))
  assert.equal(h.sent[0].options.headers['Idempotency-Key'], 'gorez/approval/offline-message')
})

test('lost claims, unpublished/changed owners and forged frozen recipients never contact provider', async () => {
  const payload = buildBusinessApprovalEmail(row, context, env.EMAIL_FROM)
  for (const options of [{ prepare: false }, { current: false }, { currentContext: { ...context, business: { ...context.business, active: false } } }, { currentContext: { ...context, owner: { ...context.owner, email: 'other@example.com' } } }, { rows: [{ ...row, payload: { ...payload, to: ['other@example.com'] } }] }, { rows: [{ ...row, payload: { ...payload, bcc: ['other@example.com'] } }] }]) {
    const h = harness(options); await h.run(); assert.equal(h.sent.length, 0)
  }
})

test('ambiguous delivery is retryable only within the window; errors stay generic and permanent provider failures stop', async () => {
  for (const response of [Error('private credential'), new Response('private provider body', { status: 429 }), new Response('private provider body', { status: 503 }), Response.json({})]) {
    const h = harness({ response }); const stats = await h.run(); assert.equal(stats.failed, 1)
    assert.equal(h.changes.at(-1).scheduled_for, new Date(now + 5 * 60000).toISOString())
    assert.doesNotMatch(JSON.stringify(h.changes), /private credential|private provider body/)
  }
  const permanent = harness({ response: new Response('private', { status: 400 }) }); await permanent.run(); assert.equal(permanent.changes.at(-1).attempts, 3); assert.equal(permanent.sent.length, 1)
  const ambiguous = harness({ failedSentFinish: true }); await ambiguous.run(); assert.equal(ambiguous.changes.at(-1).last_error, 'DELIVERY_UNCONFIRMED')
  const expired = harness({ rows: [{ ...row, first_attempt_at: new Date(now - 24 * 3600000).toISOString() }] }); await expired.run(); assert.equal(expired.sent.length, 0)
})

test('worker is bounded and successful business publication schedules after-work separately from the booking email queue', async () => {
  const h = harness({ rows: Array.from({ length: 12 }, () => structuredClone(row)) }); assert.equal((await h.run({ limit: 500 })).processed, 10)
  assert.equal(h.pauses.filter(ms => ms === 600).length, 9)
  const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
  const [review, publish, cron, store] = await Promise.all(['lib/business-application-review.js','app/api/admin/businesses/[id]/route.js','app/api/cron/notifications/route.js','lib/business-approval-emails.js'].map(read))
  assert.ok(review.indexOf("scheduleBusinessApprovalEmail(lead.business_id)") > review.indexOf('if(result.error)'))
  assert.ok(publish.indexOf("scheduleBusinessApprovalEmail(id)") > publish.indexOf('if(error)throw error'))
  assert.match(cron, /processPendingNotifications\(\)/); assert.match(cron, /processBusinessApprovalEmails\(\)/)
  assert.match(store, /after\(async \(\) =>/); assert.match(store, /catch \{ console.error\('Business approval email processing unavailable\.'/)
  assert.match(store, /eq\('claim_token', row.claim_token\)\.eq\('status', 'processing'\)/)
  assert.match(store, /business_approval_email_current/)
  assert.doesNotMatch(store, /\.from\('notification_outbox'\)|generateLink|inviteUserByEmail|password/)
})

test('transient failures receive at most one paced immediate retry with identical frozen content and a fresh claim check', async () => {
  for (const first of [new Response('', { status: 503 }), Error('offline transport timeout'), new Response('', { status: 429, headers: { 'Retry-After': '2' } })]) {
    const h = harness({ response: [first, Response.json({ id: 'accepted-second-attempt' })] })
    assert.equal((await h.run({ limit: 1 })).accepted, 1)
    assert.equal(h.sent.length, 2); assert.equal(h.sent[0].options.body, h.sent[1].options.body)
    assert.equal(h.sent[0].options.headers['Idempotency-Key'], h.sent[1].options.headers['Idempotency-Key'])
    assert.deepEqual(h.pauses, [first instanceof Response && first.status === 429 ? 2000 : 1000])
  }
  let checks = 0
  const changed = harness({ response: new Response('', { status: 503 }), current: () => ++checks === 1 })
  assert.equal((await changed.run({ limit: 1 })).skipped, 1); assert.equal(changed.sent.length, 1); assert.equal(checks, 2)
  const failed = harness({ response: new Response('', { status: 503 }) }); assert.equal((await failed.run({ limit: 1 })).failed, 1); assert.equal(failed.sent.length, 2)
})

test('long Retry-After and the 18-second invocation budget defer work without sleeping past the budget', async () => {
  const deferred = harness({ response: new Response('', { status: 429, headers: { 'Retry-After': '600' } }) })
  await deferred.run({ limit: 1 }); assert.equal(deferred.sent.length, 1); assert.deepEqual(deferred.pauses, [])
  assert.equal(deferred.changes.at(-1).scheduled_for, new Date(now + 600000).toISOString())
  let clock = now
  const bounded = harness({ clock: () => clock, response: () => { clock += 15000; return new Response('', { status: 503 }) } })
  await bounded.run({ limit: 1 }); assert.equal(bounded.sent.length, 1); assert.deepEqual(bounded.pauses, [])
})

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
async function loadServerModule(path, stubs) {
  await loadBindings()
  const { code } = await transform(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'), { filename: path, jsc: { parser: { syntax: 'ecmascript' } }, module: { type: 'commonjs' } })
  const module = { exports: {} }
  new Function('require','module','exports',code)(name => { if (!(name in stubs)) throw Error(`Unexpected production import: ${name}`); return stubs[name] }, module, module.exports)
  return module.exports
}

test('actual approval adapter schedules only after committed active decisions, never stale/rejected/failed ones', async () => {
  const scheduled = [], lead = { business_id: row.business_id, updated_at: 'expected', requires_owner_activation: false }
  let rpcError = null
  const db = { from: table => { assert.equal(table, 'partner_leads'); return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: lead }) }) }) } }, rpc: async () => ({ data: { id: 'lead-id', status: 'active' }, error: rpcError }) }
  const actual = await loadServerModule('lib/business-application-review.js', { 'server-only': {}, './supabase-admin': { getSupabaseAdmin: () => db }, './business-approval-emails': { scheduleBusinessApprovalEmail: id => scheduled.push(id) } })
  assert.deepEqual(await actual.reviewApplication({ id: 'lead-id', status: 'active', expectedUpdatedAt: 'expected' }, 'actor'), { id: 'lead-id', status: 'active' })
  assert.deepEqual(scheduled, [row.business_id]); scheduled.length = 0
  assert.equal(await actual.reviewApplication({ id: 'lead-id', status: 'active', expectedUpdatedAt: 'stale' }, 'actor'), null)
  await actual.reviewApplication({ id: 'lead-id', status: 'declined', expectedUpdatedAt: 'expected' }, 'actor'); assert.equal(scheduled.length, 0)
  rpcError = Error('publication failed')
  await assert.rejects(actual.reviewApplication({ id: 'lead-id', status: 'active', expectedUpdatedAt: 'expected' }, 'actor'))
  assert.equal(scheduled.length, 0)
})

test('actual publish route and after wrapper cannot let email scheduling/delivery failures undo publication', async () => {
  const scheduled = [], afterTasks = [], processed = []
  let captured, rpcError = null
  const db = { rpc: async () => ({ data: { ok: true }, error: rpcError }) }
  await loadServerModule('app/api/admin/businesses/[id]/route.js', {
    '../../../../../lib/server-auth': { requireUser: async () => null, isPlatformAdmin: () => true },
    '../../../../../lib/supabase-admin': { getSupabaseAdmin: () => db }, '../../../../../lib/rate-limit': { consumeRateLimit: async () => true },
    '../../../../../lib/platform-admin.mjs': { createAdminBusinessHandlers: deps => { captured = deps; return {} } },
    '../../../../../lib/business-application-review': { activateApplicationOwner: async () => {} },
    '../../../../../lib/business-approval-emails': { scheduleBusinessApprovalEmail: id => scheduled.push(id) },
  })
  assert.deepEqual(await captured.mutate({ id: row.business_id, action: 'publish' }), { ok: true }); assert.deepEqual(scheduled, [row.business_id]); scheduled.length = 0
  await captured.mutate({ id: row.business_id, action: 'suspend' }); assert.equal(scheduled.length, 0)
  rpcError = Error('publication failed'); await assert.rejects(captured.mutate({ id: row.business_id, action: 'publish' })); assert.equal(scheduled.length, 0)
  const actual = await loadServerModule('lib/business-approval-emails.js', {
    'server-only': {}, 'next/server': { after: callback => afterTasks.push(callback) }, './supabase-admin': { getSupabaseAdmin: () => ({}) },
    './business-approval-email.mjs': { createBusinessApprovalEmailWorker: () => async options => { processed.push(options); throw Error('offline delivery unavailable') } },
  })
  const originalError = console.error, logs = []; console.error = text => logs.push(text)
  try { assert.doesNotThrow(() => actual.scheduleBusinessApprovalEmail(row.business_id)); assert.equal(processed.length, 0); await afterTasks[0](); assert.deepEqual(processed, [{ businessId: row.business_id, limit: 1 }]); assert.deepEqual(logs, ['Business approval email processing unavailable.']) } finally { console.error = originalError }
})
