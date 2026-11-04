import test from 'node:test'
import assert from 'node:assert/strict'
import { createPlatformReferralHandler } from '../lib/platform-referral-analytics.mjs'

const user = { id: 'local-admin', email_confirmed_at: '2026-11-04' }
const request = days => new Request(`https://gorez.test/api/admin/referral-analytics${days ? `?days=${days}` : ''}`)
test('platform statistics require a verified administrator and rate allowance before any count query', async () => {
  let reads = 0
  const dependencies = { authenticate: async () => user, isAdmin: () => true, allowAttempt: async () => true, load: async () => { reads++; return {} } }
  for (const [change, status] of [[{ authenticate: async () => null }, 401], [{ authenticate: async () => ({ ...user, email_confirmed_at: null }) }, 401], [{ isAdmin: () => false }, 403], [{ allowAttempt: async () => false }, 429]]) {
    assert.equal((await createPlatformReferralHandler({ ...dependencies, ...change })(request())).status, status)
  }
  assert.equal(reads, 0)
})
test('platform statistics expose bounded period aggregates with private response headers', async () => {
  const summary = { profileViews: 5, partnerOutboundClicks: 2, nonpartnerOutboundClicks: 1, gorezBookings: 1, publishedBusinesses: 3 }
  const handler = createPlatformReferralHandler({ authenticate: async () => user, isAdmin: () => true, allowAttempt: async () => true, load: async days => { assert.ok([7,30].includes(days)); return summary } })
  for (const days of ['7','30']) {
    const response = await handler(request(days))
    assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/)
    assert.deepEqual(await response.json(), { days: Number(days), summary })
  }
  assert.equal((await handler(request('365'))).status, 422)
})
test('platform statistics never turn database errors into invented zeros or leak internals', async () => {
  const handler = createPlatformReferralHandler({ authenticate: async () => user, isAdmin: () => true, allowAttempt: async () => true, load: async () => { throw Error('private database detail') } })
  const response = await handler(request())
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: { code: 'ANALYTICS_UNAVAILABLE' } })
})
