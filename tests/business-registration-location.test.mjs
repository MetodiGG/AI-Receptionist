import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { catalogueRegistrationPoint, registrationLocationConfirmed, registrationLocationFingerprint, registrationMapPreview, validRegistrationPoint } from '../lib/business-registration-location.mjs'
import { hasBusinessCoordinates, parseBusinessCoordinates } from '../lib/business-coordinates.mjs'
import { businessApplicationSchema, applicationRecord, createBusinessApplicationHandler } from '../lib/business-application.mjs'
import { mergeCatalogueBusiness, selectCatalogueBusinessDraft, editOnboardingBusinessDraft } from '../lib/onboarding-catalogue-draft.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'

const point = { latitude: 42.665, longitude: 23.286 }
const sourcedPoint = { ...point, source: 'https://studio.example.com/contacts', method: 'first_party_coordinates' }
const business = patch => ({ name: 'Offline studio', address: 'Test street 1', city_ekatte: '68134', neighborhood: 'Борово', public_profile: { description: { bg: '', en: '' }, payments: [], brands: [], ...point }, ...patch })
const application = mode => ({
  business: { ...business(), slug: 'offline-location-studio', phone: '+359888123456', contact_email: 'owner@example.com', timezone: 'Europe/Sofia', industry: 'beauty', booking_mode: mode, location_confirmed: true,
    ...(mode === 'external' ? { external_booking_url: 'https://booking.example.com/appointments', external_booking_consent: true, opening_hours: Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, periods: [] })) } : {}) },
  services: [{ name: 'Offline service', price: 25, currency: 'EUR', duration_min: 45 }], staff: mode === 'gorez' ? [{ name: 'Offline person' }] : [],
  schedule: mode === 'gorez' ? Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, enabled: i < 5, open: '09:00', close: '18:00', breakEnabled: false, breakStart: '12:00', breakEnd: '13:00' })) : [],
  account: { email: 'owner@example.com', password: 'offline-test-only-value' }, locale: 'bg', consent: true, company: '',
})

test('registration points are real finite numeric pairs inside Bulgaria, not blanks, strings or city guesses', () => {
  assert.equal(validRegistrationPoint(point), true)
  for (const value of [null, {}, { latitude: null, longitude: null }, { latitude: '', longitude: '' }, { latitude: '42.665', longitude: '23.286' }, { ...point, latitude: Infinity }, { ...point, longitude: NaN }, { ...point, latitude: 0 }, { ...point, longitude: 21.99 }, { ...point, latitude: 44.51 }, { ...point, longitude: 29.01 }]) {
    assert.equal(validRegistrationPoint(value), false, JSON.stringify(value))
    assert.equal(registrationMapPreview(value), null)
  }
  const url = new URL(registrationMapPreview(point))
  assert.equal(url.origin, 'https://www.google.com'); assert.equal(url.searchParams.get('query'), '42.665,23.286')
})

test('confirmation is bound to the actual point and selected address; unrelated edits do not invalidate it', () => {
  const original = business(), proof = registrationLocationFingerprint(original)
  assert.ok(proof); assert.equal(registrationLocationConfirmed(original, proof), true)
  assert.equal(registrationLocationConfirmed(business({ name: 'Renamed studio', phone: '+359881234567' }), proof), true)
  assert.equal(registrationLocationConfirmed(business({ address: '  Test   street 1  ' }), proof), true)
  for (const change of [{ address: 'Different street 9' }, { neighborhood: 'Център' }, { city_ekatte: '56784' }, { public_profile: { ...point, latitude: 42.666 } }, { public_profile: { ...point, longitude: 23.287 } }, { public_profile: {} }]) assert.equal(registrationLocationConfirmed(business(change), proof), false)
  for (const value of ['', null, true, 'previous-pin']) assert.equal(registrationLocationConfirmed(original, value), false)
  assert.equal(registrationLocationFingerprint(business({ city_ekatte: '00000' })), '')
  assert.equal(registrationLocationFingerprint(business({ address: '' })), '')
})

test('all public booking modes require an explicit pin and applicant attestation before creating any account', async () => {
  for (const mode of ['gorez', 'external', 'phone']) {
    const input = application(mode), parsed = businessApplicationSchema.safeParse(input)
    assert.equal(parsed.success, true, mode)
    const saved = applicationRecord(parsed.data)
    assert.equal(saved.business.public_profile.latitude, point.latitude)
    assert.equal(saved.business.public_profile.longitude, point.longitude)
    assert.equal('location_confirmed' in saved.business, false, 'create-only checkbox is not business profile data')
    assert.doesNotMatch(JSON.stringify(saved), /password|offline-test-only-value/)
    const bad = [
      { ...input.business, location_confirmed: undefined }, { ...input.business, location_confirmed: false }, { ...input.business, location_confirmed: 'true' },
      { ...input.business, public_profile: undefined }, { ...input.business, public_profile: { latitude: null, longitude: null } },
      { ...input.business, public_profile: { ...point, latitude: '42.665' } }, { ...input.business, public_profile: { latitude: 0, longitude: 0 } },
      { ...input.business, public_profile: { ...point, longitude: 30 } },
    ]
    for (const item of bad) {
      assert.equal(businessApplicationSchema.safeParse({ ...input, business: item }).success, false, `${mode}: ${JSON.stringify(item.public_profile)}`)
      let sideEffects = 0
      const forbidden = () => { sideEffects++; throw Error('location rejection must precede side effects') }
      const handler = createBusinessApplicationHandler({ allowAttempt: forbidden, authenticate: forbidden, reserved: forbidden, createAccount: forbidden, deleteAccount: forbidden, save: forbidden, notify: forbidden, prepareImages: forbidden })
      const response = await handler(new Request('https://gorez.example/api/public/business-applications', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...input, business: item }) }))
      assert.equal(response.status, 422); assert.equal(sideEffects, 0)
    }
  }
})

const catalogue = coordinates => ({ id: 'sofia-location-fixture', name: 'Offline location studio', cityCode: '68134', neighborhood: 'Борово', address: 'Test street 1', locationKind: 'premises', coordinates, category: 'beauty', website: 'https://studio.example.com/', phone: '+359888123456', services: [{ name: 'Offline service', category: 'beauty', appointmentModel: 'appointment' }], booking: { kind: 'phone', phone: '+359888123456' }, verification: { status: 'approved', checkedOn: '2026-11-11', validUntil: '2027-01-01', booking: { url: 'https://studio.example.com/contacts', excerpt: 'Call us to book an appointment.' }, contact: 'https://studio.example.com/contacts' } })
test('catalogue prefill carries only approved first-party coordinates, not OSM attribution stripped from its record', () => {
  assert.deepEqual(catalogueRegistrationPoint(sourcedPoint), point)
  for (const value of [point, { ...sourcedPoint, method: 'estimated' }, { ...sourcedPoint, source: 'javascript:alert(1)' }, { ...sourcedPoint, source: 'https://user:password@studio.example.com' }, { ...sourcedPoint, latitude: null }]) assert.equal(catalogueRegistrationPoint(value), null)
  const now = Date.parse('2026-11-12T12:00:00Z'), firstParty = catalogue(sourcedPoint)
  assert.deepEqual(catalogueOnboardingDetail([firstParty], firstParty.id, { now }).business.coordinates, sourcedPoint)
  const osm = catalogue({ ...point, method: 'verified_address_geocode', source: 'https://www.openstreetmap.org/node/12345', sourceAddress: 'Test street 1', checkedOn: '2026-11-11', licence: 'ODbL-1.0', attribution: '© OpenStreetMap contributors' })
  const result = catalogueOnboardingDetail([osm], osm.id, { now })
  assert.ok(result); assert.equal(result.business.address, osm.address); assert.equal('coordinates' in result.business, false)
  assert.equal(catalogueOnboardingDetail([catalogue(null)], firstParty.id, { now }).business.coordinates, undefined)
})

test('catalogue points never overwrite a manual point or attach to a retained different venue address', () => {
  const source = { name: 'Imported venue', address: 'Test street 1', cityCode: '68134', neighborhood: 'Борово', coordinates: sourcedPoint }
  const empty = business({ name: '', address: '', city_ekatte: '', neighborhood: '', public_profile: { description: { bg: '', en: '' }, latitude: null, longitude: null } })
  const imported = selectCatalogueBusinessDraft({ business: empty, importedFields: {} }, source)
  assert.deepEqual(imported.importedFields.coordinates, point)
  assert.equal(imported.business.public_profile.latitude, point.latitude)
  assert.deepEqual(imported.business.public_profile.description, { bg: '', en: '' })
  const noPointNext = selectCatalogueBusinessDraft(imported, { ...source, name: 'Next venue', address: 'Another street 4', coordinates: null })
  assert.equal(noPointNext.business.public_profile.latitude, null); assert.equal(noPointNext.business.address, 'Another street 4')
  const manual = editOnboardingBusinessDraft(imported, { public_profile: { ...imported.business.public_profile, latitude: 42.67, longitude: 23.29 } })
  assert.equal(selectCatalogueBusinessDraft(manual, source).business.public_profile.latitude, 42.67)
  for (const change of [{ address: 'Owner street 9' }, { city_ekatte: '56784' }, { neighborhood: 'Център' }]) assert.equal(mergeCatalogueBusiness({ ...empty, ...change }, source).public_profile.latitude, null)
  const editedAddress = editOnboardingBusinessDraft(imported, { address: 'Changed street 2' })
  assert.equal(editedAddress.business.public_profile.latitude, null); assert.equal('coordinates' in editedAddress.importedFields, false)
  assert.equal(editOnboardingBusinessDraft(imported, { phone: '+359889999999' }).business.public_profile.latitude, point.latitude)
})

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
let active
const hooks = { ...React, useState: initial => active.state(initial) }
const source = await readFile(new URL('../components/business-coordinates-fields.js', import.meta.url), 'utf8')
const { code } = await transform(source, { filename: 'business-coordinates-fields.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const compiled = { exports: {} }
new Function('require', 'module', 'exports', code)(name => name === 'react' ? hooks : name === '../lib/business-coordinates.mjs' ? { hasBusinessCoordinates, parseBusinessCoordinates } : name === '../lib/business-registration-location.mjs' ? { registrationMapPreview } : require(name), compiled, compiled.exports)
const { BusinessCoordinatesFields } = compiled.exports
function all(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(child => all(child, predicate, found))
  else if (React.isValidElement(node)) { if (predicate(node)) found.push(node); all(node.props.children, predicate, found) }
  return found
}
function coordinateHarness(locale, required = true) {
  const slots = []; let index = 0
  const api = { props: { latitude: null, longitude: null, required, confirmed: false, locale, address: 'Offline test address', onChange: point => Object.assign(api.props, point), onConfirm: value => { api.props.confirmed = value } },
    state(initial) { const at = index++; if (!(at in slots)) slots[at] = initial; return [slots[at], value => { slots[at] = typeof value === 'function' ? value(slots[at]) : value }] },
    render() { index = 0; active = api; try { api.tree = BusinessCoordinatesFields(api.props) } finally { active = null }; return api.tree },
    find(predicate) { return all(api.tree, predicate) },
    pin() { return api.find(node => node.type === 'input' && node.props.maxLength === 3000)[0] },
    checkbox() { return api.find(node => node.type === 'input' && node.props.type === 'checkbox')[0] },
    editPin(value) { api.pin().props.onChange({ target: { value } }); api.render() },
  }; api.render(); return api
}
for (const locale of ['bg', 'en']) test(`${locale}: actual pin control requires applying a real pin before confirmation, with no geolocation or requests`, () => {
  const h = coordinateHarness(locale)
  assert.equal(h.checkbox().props.disabled, true); assert.equal(h.checkbox().props.required, true)
  h.editPin('https://www.google.com/maps/place/Offline/@42.7,23.3,15z/data=!3d42.665!4d23.286')
  h.find(node => node.type === 'button')[0].props.onClick(); h.render()
  assert.equal(h.props.latitude, point.latitude); assert.equal(h.props.longitude, point.longitude)
  assert.equal(h.checkbox().props.disabled, false)
  h.checkbox().props.onChange({ target: { checked: true } }); h.render(); assert.equal(h.checkbox().props.checked, true)
  assert.ok(h.find(node => node.type === 'a').some(node => node.props.href === registrationMapPreview(point)))
  h.editPin('https://maps.app.goo.gl/short-link')
  assert.equal(h.checkbox().props.checked, false); assert.equal(h.checkbox().props.disabled, true)
  h.find(node => node.type === 'button')[0].props.onClick(); h.render()
  assert.equal(h.props.latitude, point.latitude, 'invalid input never changes the saved point')
  assert.ok(h.find(node => node.props.role === 'alert').length)
  const optional = coordinateHarness(locale, false)
  assert.equal(optional.checkbox(), undefined, 'existing owner editors do not gain a new hard gate')
  assert.doesNotMatch(source, /fetch\(|getCurrentPosition|watchPosition|localStorage|api[_-]?key/i)
})

test('local location preview is unavailable in Production and contains no submission or notification path', async () => {
  const page=await readFile(new URL('../app/dev/registration-location/page.js',import.meta.url),'utf8')
  const fixture=await readFile(new URL('../app/dev/registration-location/preview.js',import.meta.url),'utf8')
  assert.match(page,/process.env.NODE_ENV !== 'development'\) notFound\(\)/)
  assert.match(fixture,/<BusinessCoordinatesFields required/)
  assert.match(fixture,/disabled=\{!confirmed\}/)
  assert.doesNotMatch(fixture,/fetch\(|supabase|onSubmit|type="submit"|action=/)
})
