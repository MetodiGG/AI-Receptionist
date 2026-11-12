import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createBusinessApplicationHandler } from '../lib/business-application.mjs'
import { readApplicationPhotos, prepareApplicationPhotos } from '../lib/application-photos.mjs'
import { normalizeBusinessImage } from '../lib/image-normalization.mjs'
import { emptyOpeningHours } from '../lib/booking-mode.mjs'

const url = 'https://gorez.test/api/public/business-applications'
const value = mode => ({
  business: { name: 'Offline Photo Example', slug: 'offline-photo-example', phone: '+359888123456', contact_email: 'owner@example.com', address: 'Local test 1', timezone: 'Europe/Sofia', industry: 'beauty', city_ekatte: '68134', neighborhood: 'Център', location_confirmed: true, public_profile: { latitude: 42.665, longitude: 23.286 }, booking_mode: mode, ...(mode === 'external' ? { external_booking_url: 'https://example.com/appointments', external_booking_consent: true, opening_hours: emptyOpeningHours() } : {}) },
  services: [{ name: 'Local service', price: mode === 'external' ? null : 25, duration_min: mode === 'external' ? null : 45 }],
  staff: mode === 'external' ? [] : [{ name: 'Local person' }],
  schedule: mode === 'external' ? [] : Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, enabled: i < 5, open: '09:00', close: '18:00', breakEnabled: false, breakStart: '12:00', breakEnd: '13:00' })),
  account: { email: 'owner@example.com', password: 'Offline-example-only-password' }, locale: 'bg', consent: true, company: '',
})
function request(input, files = [], consent = 'true') {
  const form = new FormData()
  form.append('payload', JSON.stringify(input)); form.append('photoConsent', consent)
  for (const [key, file] of files) form.append(key, file)
  return new Request(url, { method: 'POST', headers: { origin: 'https://gorez.test' }, body: form })
}
function harness(overrides = {}) {
  const calls = { accounts: 0, auth: 0, normalization: 0, saved: [], deleted: 0 }
  const handler = createBusinessApplicationHandler({
    readSubmission: readApplicationPhotos,
    prepareImages: async (files, count) => { calls.normalization++; return prepareApplicationPhotos(files, count, normalizeBusinessImage) },
    allowAttempt: async () => true, reserved: () => false,
    authenticate: async () => { calls.auth++; return null },
    createAccount: async () => { calls.accounts++; return { id: 'offline-owner' } },
    deleteAccount: async () => { calls.deleted++ },
    save: async input => { calls.saved.push(input); return { photosSaved: input.images.length } },
    notify: async () => {}, ...overrides,
  })
  return { handler, calls }
}

test('new GoRez and external applications reject JSON-only and empty multipart before touching accounts', async () => {
  for (const mode of ['gorez', 'external']) for (const json of [true, false]) {
    const h = harness(), input = value(mode)
    const req = json ? new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }) : request(input)
    const response = await h.handler(req)
    assert.equal(response.status, 422)
    assert.deepEqual(await response.json(), { error: { code: 'BUSINESS_PHOTO_REQUIRED' } })
    assert.equal(h.calls.auth, 0); assert.equal(h.calls.accounts, 0); assert.equal(h.calls.normalization, 0); assert.equal(h.calls.saved.length, 0)
  }
})
test('an optional team portrait cannot substitute for a business gallery image', async () => {
  const h = harness(), response = await h.handler(request(value('gorez'), [['staff_0', new File(['not decoded'], 'person.png', { type: 'image/png' })]]))
  assert.equal(response.status, 422); assert.equal((await response.json()).error.code, 'BUSINESS_PHOTO_REQUIRED')
  assert.equal(h.calls.normalization, 0); assert.equal(h.calls.accounts, 0)
})
test('empty, fake and unsupported gallery files are validated before identity creation', async () => {
  for (const file of [new File([], 'empty.png', { type: 'image/png' }), new File(['not a photo'], 'fake.png', { type: 'image/png' }), new File(['<svg/>'], 'graphic.svg', { type: 'image/svg+xml' })]) {
    const h = harness(), response = await h.handler(request(value('gorez'), [['gallery_0', file]]))
    assert.equal(response.status, 422); assert.equal((await response.json()).error.code, 'INVALID_IMAGE')
    assert.equal(h.calls.auth, 0); assert.equal(h.calls.accounts, 0); assert.equal(h.calls.saved.length, 0)
  }
})
test('one real business photo suffices in either mode; team photos remain optional and originals are not stored', async () => {
  const bytes = await readFile(new URL('../public/businesses/vesi-studio/interior-20261026.webp', import.meta.url))
  for (const mode of ['gorez', 'external']) {
    const h = harness(), response = await h.handler(request(value(mode), [['gallery_0', new File([bytes], 'private-original-name.webp', { type: 'image/webp' })]]))
    assert.equal(response.status, 201); assert.deepEqual((await response.json()).photos, { requested: 1, saved: 1 })
    assert.equal(h.calls.accounts, 1); assert.equal(h.calls.saved[0].images.length, 1); assert.equal(h.calls.saved[0].images[0].staffIndex, null)
    assert.equal(h.calls.saved[0].images[0].image.data.toString('ascii', 0, 4), 'RIFF')
    assert.equal(h.calls.saved[0].images[0].file, undefined); assert.equal(h.calls.saved[0].images[0].image.name, undefined)
    assert.equal(h.calls.deleted, 0)
  }
})
test('mandatory photos do not bypass publishing consent or allow a forged photo counter', async () => {
  const h = harness()
  const noConsent = await h.handler(request(value('gorez'), [['gallery_0', new File(['bytes'], 'photo.png', { type: 'image/png' })]], 'false'))
  assert.equal(noConsent.status, 422); assert.equal(h.calls.accounts, 0)
  const forged = await h.handler(request({ ...value('gorez'), photoCount: 1 }))
  assert.equal(forged.status, 422); assert.equal(h.calls.accounts, 0)
})
test('normalization cannot silently discard the only gallery photo and still create an account', async () => {
  const h = harness({ prepareImages: async () => [] })
  const response = await h.handler(request(value('gorez'), [['gallery_0', new File(['bytes'], 'photo.png', { type: 'image/png' })]]))
  assert.equal(response.status, 422); assert.equal(h.calls.accounts, 0); assert.equal(h.calls.saved.length, 0)
})
test('registration marks the gallery required, keeps team portraits optional and rechecks before final submission', async () => {
  const setup = await readFile(new URL('../components/business-setup.js', import.meta.url), 'utf8')
  const picker = await readFile(new URL('../components/photo-picker.js', import.meta.url), 'utf8')
  assert.match(setup, /if\(currentStep===0&&!businessPhotos\.length\)/)
  assert.match(setup, /<PhotoPicker files=\{businessPhotos\}[^>]* required label=/)
  assert.match(setup, /Team photo \(optional\)/)
  assert.match(setup, /validateCurrentStep\(index\)/)
  assert.match(picker, /aria-required=\{required \|\| undefined\}/)
  // The native input is cleared after decoding; required validates the prepared
  // files in state, not the now-empty native input's value.
  assert.doesNotMatch(picker, /<input[^>]*\srequired[ =/>]/)
})
