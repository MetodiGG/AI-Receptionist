import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createPartnerLeadUpdateHandler, partnerLeadUpdateSchema } from '../lib/partner-lead-admin.mjs'
import { PARTNER_DECISION_STATUS, filterPartnerLeads, partnerReviewGroup } from '../lib/partner-leads.mjs'

const id = '10000000-0000-4000-8000-000000000001'
const user = { id: 'admin-id', email: 'admin@example.com', email_confirmed_at: '2026-10-16T12:00:00Z' }
const input = { id, status: 'onboarding', expectedUpdatedAt: '2026-10-16T12:00:00.123456+00:00' }
const request = (body = input, headers = {}) => new Request('https://gorez.example/api/admin/partner-leads', {
  method: 'PATCH', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body),
})
function harness(options = {}) {
  const writes = [], attempts = []
  let record = { id, status: 'new', notes: 'Preserve private notes', updated_at: input.expectedUpdatedAt }
  const handler = createPartnerLeadUpdateHandler({
    authenticate: async () => options.user === undefined ? user : options.user,
    isAdmin: account => account.email === user.email,
    allowAttempt: async (_request, actor) => { attempts.push(actor); return options.allowed !== false },
    update: async data => {
      writes.push(data)
      if (options.failure) throw new Error('Private database details')
      if (data.expectedUpdatedAt !== record.updated_at) return null
      record = { ...record, status: data.status, updated_at: '2026-10-16T12:30:00.000Z', ...(data.notes === undefined ? {} : { notes: data.notes || null }) }
      return record
    },
  })
  return { handler, writes, attempts }
}

test('approval is setup, rejection is reversible, and neither means published business', () => {
  assert.deepEqual(PARTNER_DECISION_STATUS, { approve: 'onboarding', reject: 'declined' })
  for (const status of ['new', 'contacted', 'demo_scheduled', 'interested']) assert.equal(partnerReviewGroup(status), 'pending')
  assert.equal(partnerReviewGroup('onboarding'), 'approved')
  assert.equal(partnerReviewGroup('active'), 'completed')
  assert.equal(partnerReviewGroup('declined'), 'rejected')
  const rows = [{ status: 'active', created_at: '2026-10-16' }, { status: 'new', created_at: '2026-10-15' }, { status: 'onboarding', created_at: '2026-10-16' }]
  assert.equal(filterPartnerLeads(rows)[0].status, 'new')
  assert.deepEqual(filterPartnerLeads(rows, 'approved').map(row => row.status), ['onboarding'])
  assert.equal(rows[0].status, 'active', 'filter does not mutate records')
})

test('guests, unverified, anonymous and ordinary owners cannot decide applications', async () => {
  for (const account of [null, { ...user, email: 'owner@example.com', user_metadata: { admin: true } }, { ...user, email_confirmed_at: null }, { ...user, is_anonymous: true }]) {
    const h = harness({ user: account })
    assert.equal((await h.handler(request())).status, account ? 403 : 401)
    assert.deepEqual(h.writes, [])
  }
})

test('application updates reject invalid, forged or cross-site input before any write', async () => {
  for (const body of ['{', { ...input, id: 'bad' }, { ...input, status: 'published' }, { ...input, expectedUpdatedAt: '' }, { ...input, actorId: 'forged' }, { ...input, notes: 'a'.repeat(3001) }]) {
    const h = harness()
    assert.equal((await h.handler(request(body))).status, 422)
    assert.equal(h.writes.length, 0)
  }
  for (const headers of [{ origin: 'https://evil.example' }, { 'sec-fetch-site': 'cross-site' }]) {
    const h = harness()
    assert.equal((await h.handler(request(input, headers))).status, 403)
    assert.equal(h.writes.length, 0)
  }
  assert.equal(partnerLeadUpdateSchema.safeParse(input).success, true)
})

test('decisions preserve notes, acknowledge saved status and return private responses', async () => {
  const h = harness(), response = await h.handler(request())
  assert.equal(response.status, 200)
  assert.match(response.headers.get('cache-control'), /private.*no-store/)
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
  const { lead } = await response.json()
  assert.equal(lead.status, 'onboarding')
  assert.equal(lead.notes, 'Preserve private notes')
  assert.equal(Object.hasOwn(h.writes[0], 'notes'), false)
  assert.deepEqual(h.attempts, [user.id])
})

test('explicit note edits and clearing notes are supported, stale decisions are rejected', async () => {
  const h = harness()
  assert.equal((await h.handler(request({ ...input, notes: '' }))).status, 200)
  const stale = await h.handler(request({ ...input, status: 'declined' }))
  assert.equal(stale.status, 409)
  assert.deepEqual(await stale.json(), { error: { code: 'LEAD_CHANGED' } })
  const fresh = await h.handler(request({ ...input, expectedUpdatedAt: '2026-10-16T12:30:00.000Z', status: 'new', notes: '  Reopen  ' }))
  assert.equal(fresh.status, 200)
  assert.equal((await fresh.json()).lead.notes, 'Reopen')
})

test('rate limiting and failures never report a successful decision or expose internals', async () => {
  const limited = harness({ allowed: false })
  assert.equal((await limited.handler(request())).status, 429)
  assert.deepEqual(limited.writes, [])
  const response = await harness({ failure: true }).handler(request())
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: { code: 'ADMIN_UNAVAILABLE' } })
})

test('production adapter conditionally updates only the selected lead and never publishes or emails', async () => {
  const route = await readFile(new URL('../app/api/admin/partner-leads/route.js', import.meta.url), 'utf8')
  assert.match(route, /\.eq\('id', input\.id\)/)
  assert.match(route, /\.eq\('updated_at', input\.expectedUpdatedAt\)/)
  assert.match(route, /if \(input\.notes !== undefined\)/)
  assert.doesNotMatch(route, /from\('businesses'\)|sendEmail|resend|auth\.admin|deleteUser|rpc\('platform_business_action'/)
  const ui = await readFile(new URL('../components/admin-application-card.js', import.meta.url), 'utf8')
  assert.match(ui, /saving \|\| dirty/)
  assert.match(ui, /Потвърди/)
  assert.match(ui, /Не създава и не публикува бизнес/)
  const console = await readFile(new URL('../components/platform-admin.js', import.meta.url), 'utf8')
  assert.match(console, /setLeads\(items=>items\.map\(item=>item\.id===row\.id\?\{\.\.\.item,\.\.\.result\.lead\}/)
})
