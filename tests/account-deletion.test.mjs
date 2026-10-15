import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createAccountDeletionHandlers, hasRecentPasswordLogin, readOwnedAccount } from '../lib/account-deletion.mjs'
import { ACCOUNT_DELETION_COPY } from '../lib/account-deletion-copy.mjs'

const businessId = '00000000-0000-4000-8000-000000000001'
const ownerId = '00000000-0000-4000-8000-000000000002'
const user = { id: ownerId, email: 'qa@example.com' }
const tokenWith = (claims) => `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`
const freshToken = () => tokenWith({ amr: [{ method: 'password', timestamp: Math.floor(Date.now() / 1000) }] })
const input = { businessId, confirmation: 'DELETE', acknowledged: true }
const request = (body = input, headers = {}) => new Request('https://gorez.example/api/owner/account', { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) })

function fakeClient({ fail, foreign = false, businessCount = 2 } = {}) {
  const operations = []
  const client = {
    auth: { admin: { async deleteUser(id, soft) { operations.push({ action: 'deleteUser', id, soft }); return { error: fail === 'delete' ? new Error('internal secret database error') : null } } } },
    from(table) {
      const operation = { table, filters: [] }; operations.push(operation)
      return {
        select(_columns, options) { operation.head = options?.head; return this },
        eq(key, value) { operation.filters.push([key, value]); return this },
        in(key, value) { operation.filters.push([key, value]); return this },
        gt(key, value) { operation.filters.push([key, value]); return this },
        order() { return this }, range(start, end) { operation.range = [start, end]; return this }, maybeSingle() { operation.single = true; return this },
        then(resolve, reject) {
          const data = operation.single ? (foreign ? null : { id: businessId }) : table === 'businesses' ? Array.from({ length: businessCount }, (_, index) => ({ id: `${businessId}-${index}`, name: `QA ${index}`, slug: `qa-${index}` })).slice(operation.range[0], operation.range[1] + 1) : null
          return Promise.resolve({ data, count: table === 'appointments' ? 3 : null, error: fail === table ? new Error('private query details') : null }).then(resolve, reject)
        },
      }
    },
  }
  return { client, operations }
}

function handlers({ signedIn = true, token = freshToken(), allowed = true, factors, ...options } = {}) {
  const db = fakeClient(options)
  return { ...db, ...createAccountDeletionHandlers({ authenticate: async () => ({ user: signedIn ? { ...user, factors } : null, token }), getClient: () => db.client, allowAttempt: async () => allowed }) }
}

test('deletion requires a recent password AMR, not just a refreshed JWT timestamp', () => {
  const now = 1800000000000
  const seconds = now / 1000
  assert.equal(hasRecentPasswordLogin(tokenWith({ amr: [{ method: 'password', timestamp: seconds - 299 }] }), now), true)
  for (const claims of [{ iat: seconds, amr: [{ method: 'password', timestamp: seconds - 301 }] }, { amr: [{ method: 'oauth', timestamp: seconds }] }, { amr: [{ method: 'password', timestamp: seconds + 31 }] }, { amr: [{ method: 'password', timestamp: String(seconds) }] }, {}]) assert.equal(hasRecentPasswordLogin(tokenWith(claims), now), false)
  assert.equal(hasRecentPasswordLogin('invalid', now), false)
})

test('anonymous account reads and deletion cannot touch the database', async () => {
  const h = handlers({ signedIn: false })
  assert.equal((await h.GET(new Request('https://gorez.example/api/owner/account'))).status, 401)
  assert.equal((await h.DELETE(request())).status, 401)
  assert.deepEqual(h.operations, [])
})

test('deletion requires the exact confirmation and acknowledgement, rejects caller-selected user IDs', async () => {
  for (const invalid of [{ ...input, confirmation: 'delete' }, { ...input, acknowledged: false }, { businessId }, { ...input, userId: 'another-owner' }, '{']) {
    const h = handlers()
    assert.equal((await h.DELETE(request(invalid))).status, 422)
    assert.deepEqual(h.operations, [])
  }
})

test('cross-origin deletion, stale authentication, MFA downgrade and rate-limit failures cannot delete', async () => {
  for (const [options, headers, expected] of [[{}, { origin: 'https://attacker.example' }, 403], [{}, { 'sec-fetch-site': 'cross-site' }, 403], [{ token: tokenWith({}) }, {}, 403], [{ factors: [{ status: 'verified' }] }, {}, 403], [{ allowed: false }, {}, 429]]) {
    const h = handlers(options)
    assert.equal((await h.DELETE(request(input, headers))).status, expected)
    assert.deepEqual(h.operations, [])
  }
})

test('another owner business cannot authorize account deletion', async () => {
  const h = handlers({ foreign: true })
  assert.equal((await h.DELETE(request())).status, 404)
  assert.ok(h.operations[0].filters.some(([key, value]) => key === 'owner_id' && value === ownerId))
  assert.equal(h.operations.some((operation) => operation.action === 'deleteUser'), false)
})

test('successful deletion hard-deletes only the server-verified identity without pre-deleting rows', async () => {
  const h = handlers()
  const response = await h.DELETE(request(input, { origin: 'https://gorez.example' }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { deleted: true })
  assert.deepEqual(h.operations.at(-1), { action: 'deleteUser', id: ownerId, soft: false })
  assert.equal(h.operations.length, 2)
  assert.match(response.headers.get('cache-control'), /no-store/)
})

test('Auth deletion failure is not reported as success and private errors do not leak', async () => {
  const h = handlers({ fail: 'delete' })
  const response = await h.DELETE(request())
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: { code: 'ACCOUNT_DELETE_FAILED' } })
  assert.equal(h.operations.filter((operation) => operation.table).length, 1)
})

test('account summary paginates every owned business and scopes upcoming counts', async () => {
  const h = fakeClient({ businessCount: 201 })
  const account = await readOwnedAccount(h.client, user, '2026-10-15T10:00:00Z')
  assert.equal(account.businesses.length, 201)
  assert.equal(account.upcomingBookings, 9)
  assert.ok(h.operations.filter((operation) => operation.table === 'businesses').every((operation) => operation.filters.some(([key, value]) => key === 'owner_id' && value === ownerId)))
  assert.equal(h.operations.filter((operation) => operation.table === 'appointments').length, 3)
  assert.ok(h.operations.filter((operation) => operation.table === 'appointments').every((operation) => operation.head && operation.filters.some(([key, value]) => key === 'ends_at' && value === '2026-10-15T10:00:00Z')))
})

test('summary query failure is private and never opens a misleading empty account', async () => {
  const h = handlers({ fail: 'businesses' })
  const response = await h.GET(new Request('https://gorez.example/api/owner/account'))
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: { code: 'ACCOUNT_READ_FAILED' } })
})

test('BG/EN explain permanent loss, all businesses, upcoming bookings and backup limitations', () => {
  assert.deepEqual(Object.keys(ACCOUNT_DELETION_COPY.bg).sort(), Object.keys(ACCOUNT_DELETION_COPY.en).sort())
  assert.deepEqual(Object.keys(ACCOUNT_DELETION_COPY.bg.errors).sort(), Object.keys(ACCOUNT_DELETION_COPY.en.errors).sort())
  assert.match(ACCOUNT_DELETION_COPY.bg.irreversible, /Резервните копия/)
  assert.match(ACCOUNT_DELETION_COPY.en.lead, /every business/)
})

test('client keeps admin APIs server-side and does not send the password in the deletion body', async () => {
  const panel = await readFile(new URL('../components/account-deletion-panel.js', import.meta.url), 'utf8')
  assert.doesNotMatch(panel, /auth\.admin|SUPABASE_SERVICE_ROLE_KEY/)
  assert.match(panel, /JSON\.stringify\(\{ businessId, confirmation, acknowledged \}\)/)
  assert.match(panel, /signInWithPassword/)
  assert.match(panel, /aria-modal="true"/)
  assert.match(panel, /scope: 'local'/)
})
