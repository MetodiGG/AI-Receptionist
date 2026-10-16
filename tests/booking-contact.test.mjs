import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { bookingCustomerSchema } from '../lib/booking-contact.mjs'

const customer = { name: 'QA Client', phone: '+359 88 123 4567', email: 'qa@example.com' }

test('new appointments require a real email shape, not a missing, empty or whitespace-only value', () => {
  for (const email of [undefined, null, '', '   ', 'not-email', 'qa@', '@example.com', 'qa example@example.com', 'qa@example.com\r\nBcc:someone@example.com']) assert.equal(bookingCustomerSchema.safeParse({ ...customer, email }).success, false)
  const { email: _email, ...withoutEmail } = customer
  assert.equal(bookingCustomerSchema.safeParse(withoutEmail).success, false)
})

test('valid booking email is trimmed and bounded without altering the supplied mailbox', () => {
  assert.equal(bookingCustomerSchema.parse({ ...customer, email: '  QA+booking@Example.com  ' }).email, 'QA+booking@Example.com')
  const longEmail = `${'a'.repeat(60)}@${'b'.repeat(60)}.${'c'.repeat(60)}.com`
  assert.equal(bookingCustomerSchema.safeParse({ ...customer, email: longEmail }).success, false)
})

test('web/manual and chat server validation share the same required contact schema', async () => {
  for (const path of ['../lib/public-booking.js', '../app/api/public/[slug]/chat/route.js']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8')
    assert.match(source, /customer: bookingCustomerSchema/)
    assert.doesNotMatch(source, /email:.*optional\(/)
  }
})

test('all three booking interfaces mark the email field required in BG and EN', async () => {
  for (const path of ['../components/public-booking-page.js', '../components/guided-booking-chat.js', '../app/dashboard/appointments/page.js']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8')
    assert.match(source, /'Email \*' : 'Имейл \*'/)
    assert.match(source, /<input required type="email" autoComplete="email" inputMode="email" maxLength=\{180\}/)
  }
})
