import assert from 'node:assert/strict'
import test from 'node:test'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { bookingAction, assertInternalBooking } from '../lib/booking-mode.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'

const now = Date.parse('2026-11-11T12:00:00Z')
const phone = '+359888000001'
const formUrl = 'https://booking.business.bg/appointments'
const verified = { verified: true, checkedOn: '2026-11-11', validUntil: '2027-02-09' }
const catalogue = patch => ({ source: 'catalogue', website: 'https://business.bg/', phone, ...patch })
const booking = value => ({ ...value, ...verified })

test('a genuinely reviewed catalogue booking form takes priority over its published phone and generic website', () => {
  const row = catalogue({ booking: booking({ kind: 'form', url: formUrl }) })
  assert.deepEqual(railExternalAction(row, now), { kind: 'form', href: formUrl })
  assert.deepEqual(railExternalAction({ ...row, website: null }, now), { kind: 'form', href: formUrl }, 'an approved configured provider form does not require an invented own website')
})

test('a reviewed catalogue phone booking stays the sole fallback even when the business has a generic website', () => {
  assert.deepEqual(railExternalAction(catalogue({ booking: booking({ kind: 'phone', phone }) }), now), { kind: 'phone', href: `tel:${phone}` })
  assert.equal(railExternalAction(catalogue({ booking: null }), now), null, 'a public phone/homepage alone is not catalogue booking evidence')
  assert.equal(railExternalAction(catalogue({ booking: booking({ kind: 'phone', phone: '+359888000002' }) }), now), null, 'a stale booking phone cannot route to a different current contact')
})

test('expired, unverified or unsafe catalogue booking routes fail closed rather than silently becoming homepage bookings', () => {
  const row = catalogue({ booking: booking({ kind: 'form', url: formUrl }) })
  for (const patch of [{ verified: false }, { checkedOn: '2026-11-12' }, { validUntil: '2026-11-10' }, { url: 'javascript:bad()' }, { url: 'https://127.0.0.1/book' }, { url: 'https://booking.business.bg/?next=https://other.bg' }]) {
    assert.equal(railExternalAction({ ...row, booking: { ...row.booking, ...patch } }, now), null)
  }
})

test('Google generic websites are not forms: approved link IDs win, otherwise only an actual phone can reserve', () => {
  const id = '11111111-1111-4111-8111-111111111111'
  const row = { source: 'google', website: 'https://business.bg/', phone }
  assert.deepEqual(railExternalAction({ ...row, booking: { id } }, now), { kind: 'verified', id }, 'the approved-link redirect is not replaced by a direct website link')
  assert.deepEqual(railExternalAction(row, now), { kind: 'phone', href: `tel:${phone}` })
  assert.equal(railExternalAction({ ...row, phone: null }, now), null)
  assert.equal(railExternalAction({ ...row, phone: 'javascript:bad()' }, now), null)
  assert.equal(railExternalAction({ ...row, phone: null, website: 'https://business.bg/book-now', booking: { kind: 'form', url: formUrl } }, now), null, 'a guessed pathname/unapproved form object is not an approved link')
})

const partnerId = '10000000-0000-4000-8000-000000000001'
const request = id => new Request(`https://www.gorez.co/api/public/discovery/business/${id}`)
const record = patch => ({
  id: 'sofia-booking-priority-fixture', name: 'Offline booking fixture', category: 'beauty', cityCode: '68134', neighborhood: null,
  address: 'София, ул. Тестова 1', locationKind: 'premises', coordinates: null, website: 'https://business.bg/', phone,
  services: [{ name: 'Публикувана услуга', category: 'beauty', appointmentModel: 'appointment' }],
  booking: { kind: 'phone', phone },
  verification: { status: 'approved', checkedOn: verified.checkedOn, validUntil: verified.validUntil, booking: { url: 'https://business.bg/', excerpt: 'Записване на час по телефона.' }, contact: 'https://business.bg/' },
  ...patch,
})
const dependencies = patch => ({
  config: { enabled: true }, now: () => now, allowAttempt: async () => true,
  findCatalogue: async () => record(), readCataloguePhotos: async () => [], readPartner: async () => null,
  ...patch,
})

test('fresh catalogue details replace a preview phone booking with the actual reviewed form and clear an absent phone', async () => {
  const entry = record({ phone: null, booking: { kind: 'form', url: formUrl } })
  const response = await createPublicBusinessDetailsHandler(dependencies({ findCatalogue: async () => entry }))(request(entry.id), entry.id)
  assert.equal(response.status, 200)
  const { business } = await response.json()
  const preview = catalogue({ booking: booking({ kind: 'phone', phone }) })
  const fresh = { ...preview, ...business }
  assert.equal(fresh.phone, null)
  assert.equal(business.details.phone, null)
  assert.deepEqual(business.booking, booking({ kind: 'form', url: formUrl }))
  assert.deepEqual(railExternalAction(fresh, now), { kind: 'form', href: formUrl })
})

test('fresh catalogue details replace an old form with the reviewed phone fallback and remove the stale form URL', async () => {
  const entry = record()
  const response = await createPublicBusinessDetailsHandler(dependencies({ findCatalogue: async () => entry }))(request(entry.id), entry.id)
  assert.equal(response.status, 200)
  const { business } = await response.json()
  const fresh = { ...catalogue({ booking: booking({ kind: 'form', url: formUrl }) }), ...business }
  assert.deepEqual(fresh.booking, booking({ kind: 'phone', phone }))
  assert.equal(fresh.booking.url, undefined)
  assert.deepEqual(railExternalAction(fresh, now), { kind: 'phone', href: `tel:${phone}` })
})

test('expired catalogue details do not return an apparently fresh booking context', async () => {
  const entry = record(); entry.verification.checkedOn = '2026-08-01'; entry.verification.validUntil = '2026-10-30'
  const response = await createPublicBusinessDetailsHandler(dependencies({ findCatalogue: async () => entry }))(request(entry.id), entry.id)
  assert.equal(response.status, 404)
  assert.equal((await response.json()).business, undefined)
})

test('fresh partner details preserve native/external mode changes and slug without leaking raw external or private fields', async () => {
  for (const [oldMode, mode] of [['gorez', 'external'], ['external', 'gorez']]) {
    const raw = {
      id: partnerId, slug: 'current-owned-slug', name: 'Offline partner', active: true, platform_status: 'enabled', industry: 'beauty', city: 'София', address: 'Тестова 1',
      booking_mode: mode, services: [{ id: 'service-one', name: 'Публикувана услуга', active: true }],
      phone, website_url: 'https://business.bg/', external_booking_url: formUrl, external_booking_consent_at: '2026-11-01T12:00:00Z',
      owner_id: 'private-owner', customers: [{ email: 'private-customer@business.bg' }], appointments: [{ notes: 'private-notes' }],
    }
    const response = await createPublicBusinessDetailsHandler(dependencies({ readPartner: async () => raw }))(request(partnerId), partnerId)
    assert.equal(response.status, 200)
    const { business } = await response.json()
    const fresh = { id: partnerId, source: 'gorez', slug: 'old-slug', booking_mode: oldMode, ...business }
    assert.equal(fresh.slug, 'current-owned-slug')
    assert.equal(fresh.booking_mode, mode)
    assert.equal(bookingAction(fresh, 'en').href, mode === 'external' ? '/out/business/current-owned-slug?lang=en' : '/book/current-owned-slug?lang=en')
    assert.equal(railExternalAction(fresh, now), null, 'partner booking remains with the native/protected external action, not a direct generic contact')
    if (mode === 'external') assert.throws(() => assertInternalBooking(fresh), { code: 'EXTERNAL_BOOKING' })
    else assert.doesNotThrow(() => assertInternalBooking(fresh))
    assert.doesNotMatch(JSON.stringify(business), /external_booking_url|external_booking_consent_at|private-owner|private-customer|private-notes|customers|appointments/)
  }
})
