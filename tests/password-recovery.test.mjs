import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRecoveryRequestHandler, initializePasswordRecovery, newPasswordSchema, passwordUpdateError, readRecoveryFragment, recoveryRedirect } from '../lib/password-recovery.mjs'
import { PASSWORD_RECOVERY_COPY } from '../lib/password-recovery-copy.mjs'

const input = { email: '  Owner@Example.com ', locale: 'en' }
const request = (body = input, headers = {}) => new Request('https://gorez.example/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) })
function handler({ allowed = true, error, throws = false } = {}) {
  const calls = []
  const POST = createRecoveryRequestHandler({ origin: 'https://gorez.example', allowAttempt: async () => allowed, sendRecovery: async (...args) => { calls.push(args); if (throws) throw new Error('secret'); return { error } } })
  return { POST, calls }
}

test('recovery normalizes email and sends only a configured BG/EN reset URL', async () => {
  const h = handler()
  const response = await h.POST(request())
  assert.equal(response.status, 202)
  assert.deepEqual(await response.json(), { accepted: true })
  assert.deepEqual(h.calls, [['owner@example.com', { redirectTo: 'https://gorez.example/reset-password?lang=en' }]])
  assert.match(response.headers.get('cache-control'), /no-store/)
  assert.equal(recoveryRedirect('https://gorez.example/path?next=evil', 'bg'), 'https://gorez.example/reset-password?lang=bg')
  assert.throws(() => recoveryRedirect('http://attacker.example', 'en'))
})

test('cross-origin and rate-limited requests do not send recovery mail', async () => {
  for (const [options, headers, status] of [[{}, { origin: 'https://attacker.example' }, 403], [{}, { 'sec-fetch-site': 'cross-site' }, 403], [{ allowed: false }, {}, 429]]) {
    const h = handler(options)
    assert.equal((await h.POST(request(input, headers))).status, status)
    assert.deepEqual(h.calls, [])
  }
})

test('recovery rejects invalid email, locale, external redirect and malformed JSON', async () => {
  for (const body of [{ ...input, email: 'invalid' }, { ...input, email: '' }, { ...input, locale: 'fr' }, { ...input, redirectTo: 'https://evil.example' }, '{']) {
    const h = handler()
    assert.equal((await h.POST(request(body))).status, 422)
    assert.deepEqual(h.calls, [])
  }
})

test('account-specific results have identical, non-enumerating responses', async () => {
  for (const code of [null, 'user_not_found', 'email_not_found', 'email_address_not_authorized']) {
    const h = handler({ error: code ? { code, message: 'private@example.com' } : null })
    const response = await h.POST(request())
    assert.equal(response.status, 202)
    assert.deepEqual(await response.json(), { accepted: true })
  }
})

test('delivery outages and global quotas are not reported as a successful send or leaked', async () => {
  for (const [options, status] of [[{ error: { code: 'unexpected_failure', message: 'SMTP secret' } }, 503], [{ throws: true }, 503], [{ error: { code: 'over_email_send_rate_limit' } }, 429]]) {
    const response = await handler(options).POST(request())
    assert.equal(response.status, status)
    assert.doesNotMatch(await response.text(), /SMTP|secret/)
  }
})

const fragment = (extra = '') => `#access_token=qa-access&refresh_token=qa-refresh&type=recovery&expires_at=${Math.floor(Date.now() / 1000) + 600}${extra}`

test('recovery rejects missing, expired, error and non-recovery callbacks', () => {
  for (const hash of ['', '#type=recovery', fragment().replace('type=recovery', 'type=signup'), fragment('&error=access_denied'), '#access_token=a&refresh_token=r&type=recovery&expires_at=1']) assert.equal(readRecoveryFragment(hash), null)
  assert.deepEqual(readRecoveryFragment(fragment()), { access_token: 'qa-access', refresh_token: 'qa-refresh' })
})

test('callback clears sensitive URL fields before contacting Auth and verifies the tokens', async () => {
  const operations = []
  const auth = { async setSession(credentials) { operations.push(credentials); return { data: { session: { user: { id: 'qa' } } }, error: null } } }
  const valid = await initializePasswordRecovery(auth, `https://gorez.example/reset-password?lang=en&code=private${fragment()}`, (path) => operations.push(path))
  assert.equal(valid, true)
  assert.equal(operations[0], '/reset-password?lang=en')
  assert.deepEqual(operations[1], { access_token: 'qa-access', refresh_token: 'qa-refresh' })
})

test('an existing login alone cannot unlock reset, and rejected/reused tokens fail closed', async () => {
  const auth = { async setSession() { return { data: { session: null }, error: { status: 401 } } } }
  assert.equal(await initializePasswordRecovery(auth, 'https://gorez.example/reset-password?lang=bg', () => {}), false)
  assert.equal(await initializePasswordRecovery(auth, `https://gorez.example/reset-password${fragment()}`, () => {}), false)
})

test('new passwords must match, meet length limits and preserve spaces', () => {
  assert.equal(newPasswordSchema.safeParse({ password: ' abcdef ', confirmation: ' abcdef ' }).success, true)
  for (const data of [{ password: 'short', confirmation: 'short' }, { password: 'long-enough', confirmation: 'different' }, { password: 'x'.repeat(129), confirmation: 'x'.repeat(129) }]) assert.equal(newPasswordSchema.safeParse(data).success, false)
  assert.equal(passwordUpdateError({ code: 'same_password' }), 'samePassword')
  assert.equal(passwordUpdateError({ code: 'weak_password' }), 'weakPassword')
  assert.equal(passwordUpdateError({ status: 401 }), 'expired')
})

test('BG/EN contain the same text, including delivery and expired link guidance', () => {
  assert.deepEqual(Object.keys(PASSWORD_RECOVERY_COPY.bg).sort(), Object.keys(PASSWORD_RECOVERY_COPY.en).sort())
  assert.deepEqual(Object.keys(PASSWORD_RECOVERY_COPY.bg.errors).sort(), Object.keys(PASSWORD_RECOVERY_COPY.en.errors).sort())
})

test('recovery tokens stay in memory, main login ignores reset callbacks, login has a language-aware link', async () => {
  const recovery = await readFile(new URL('../lib/password-recovery-client.js', import.meta.url), 'utf8')
  const main = await readFile(new URL('../lib/supabase.js', import.meta.url), 'utf8')
  const home = await readFile(new URL('../components/business-login.js', import.meta.url), 'utf8')
  assert.match(recovery, /persistSession: false, autoRefreshToken: false, detectSessionInUrl: false/)
  assert.doesNotMatch(recovery, /localStorage|sessionStorage|console\./)
  assert.match(main, /url\.pathname !== '\/reset-password'/)
  assert.match(home, /forgot-password\?lang=\$\{locale\}/)
  const route = await readFile(new URL('../app/api/auth/forgot-password/route.js', import.meta.url), 'utf8')
  assert.match(route, /includeUserAgent: false/)
})
