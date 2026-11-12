import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { catalogueRegistrationPoint, registrationLocationConfirmed, registrationLocationFingerprint, registrationMapPreview, validRegistrationPoint } from '../lib/business-registration-location.mjs'
import { businessApplicationSchema, applicationRecord, createBusinessApplicationHandler } from '../lib/business-application.mjs'
import { mergeCatalogueBusiness, selectCatalogueBusinessDraft, editOnboardingBusinessDraft } from '../lib/onboarding-catalogue-draft.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'

const point = { latitude: 42.665, longitude: 23.286 }
const sourcedPoint = { ...point, source: 'https://studio.example.com/contacts', method: 'first_party_coordinates' }
const business = patch => ({ name: 'Offline studio', address: 'Test street 1', city_ekatte: '68134', neighborhood: 'Борово', public_profile: { description: { bg: '', en: '' }, payments: [], brands: [], ...point }, ...patch })
const application = mode => ({
  business: { ...business({public_profile:{description:{bg:'Offline description',en:''}}}), slug: 'offline-location-studio', phone: '+359888123456', contact_email: 'owner@example.com', timezone: 'Europe/Sofia', industry: 'beauty', booking_mode: mode,
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

function handlerFixture(value, overrides = {}) {
  const calls={accounts:0,saves:[],notifications:0,deleted:0}
  const deps={
    readSubmission:async()=>({value,files:[{staffIndex:null}]}),
    prepareImages:async()=>[{staffIndex:null,image:{data:Buffer.from('offline image'),width:1,height:1,bytes:13}}],
    allowAttempt:async()=>true,authenticate:async()=>null,reserved:()=>false,
    createAccount:async()=>{calls.accounts++;return{id:'10000000-0000-4000-8000-000000000001'}},
    deleteAccount:async()=>{calls.deleted++},save:async input=>{calls.saves.push(input);return{photosSaved:1}},notify:async()=>{calls.notifications++},
    ...overrides,
  }
  return {calls,submit:()=>createBusinessApplicationHandler(deps)(new Request('https://gorez.example/api/public/business-applications',{method:'POST',headers:{'content-type':'multipart/form-data; boundary=offline-qa',origin:'https://gorez.example'},body:'offline-qa'}))}
}

for (const mode of ['gorez','external','phone']) test(`${mode}: real application handler accepts city/quarter/street without map point or confirmation`, async () => {
  for(const profile of [undefined,{}, {latitude:null,longitude:null},{description:{bg:'Offline description',en:''}}]) {
    const input=application(mode);input.business.public_profile=profile
    const parsed=businessApplicationSchema.safeParse(input)
    assert.equal(parsed.success,true,JSON.stringify(parsed.error))
    const f=handlerFixture(input),response=await f.submit()
    assert.equal(response.status,201)
    assert.equal(f.calls.accounts,1);assert.equal(f.calls.saves.length,1);assert.equal(f.calls.notifications,1);assert.equal(f.calls.deleted,0)
    const {record}=f.calls.saves[0]
    assert.equal(record.business.city,'София');assert.equal(record.business.neighborhood,'Борово');assert.equal(record.business.address,'Test street 1')
    assert.equal(record.business.public_profile?.latitude??null,null);assert.equal(record.business.public_profile?.longitude??null,null)
    assert.equal('location_confirmed' in record.business,false)
    assert.doesNotMatch(JSON.stringify(record),/password|offline-test-only-value/)
  }
})

test('legacy optional boolean confirmation is ignored, not a claim of verified position', () => {
  for(const location_confirmed of [undefined,false,true]) {
    const input=application('phone');input.business.location_confirmed=location_confirmed
    const parsed=businessApplicationSchema.parse(input),record=applicationRecord(parsed)
    assert.equal('location_confirmed' in record.business,false)
    assert.equal(record.business.public_profile.latitude,null)
    assert.equal(record.business.public_profile.longitude,null)
  }
  assert.equal(businessApplicationSchema.safeParse({...application('phone'),business:{...application('phone').business,location_confirmed:'true'}}).success,false)
})

test('optional coordinates retain existing strict profile validation before any side effects', async () => {
  for(const mode of ['gorez','external','phone']) for(const public_profile of [
    {latitude:point.latitude},{longitude:point.longitude},{latitude:'42.665',longitude:point.longitude},
    {latitude:91,longitude:point.longitude},{latitude:point.latitude,longitude:181},
    {...point,verified:true},{...point,owner_id:'injected'},
  ]) {
    const input=application(mode);input.business.public_profile=public_profile
    assert.equal(businessApplicationSchema.safeParse(input).success,false)
    let effects=0;const forbidden=()=>{effects++;throw Error('validation must precede side effects')}
    const f=handlerFixture(input,{allowAttempt:forbidden,authenticate:forbidden,createAccount:forbidden,save:forbidden,notify:forbidden,prepareImages:forbidden})
    assert.equal((await f.submit()).status,422);assert.equal(effects,0)
  }
  const input=application('phone');input.business.public_profile={...point,description:{bg:'Preserved',en:''}}
  const f=handlerFixture(input);assert.equal((await f.submit()).status,201)
  assert.deepEqual(f.calls.saves[0].record.business.public_profile,{...point,description:{bg:'Preserved',en:''},payments:[],brands:[]})
})

test('simplified registration still enforces city, street, native service setup, authentication, photo and quota checks', async () => {
  const cases=[
    {patch:input=>{input.business.address=''},status:422},
    {patch:input=>{input.business.city_ekatte='00000'},status:422},
    {patch:input=>{input.business.owner_id='injected'},status:422},
    {patch:input=>{input.schedule=[]},status:422},
    {patch:input=>{input.services[0].price=null},status:422},
    {overrides:{allowAttempt:async()=>false},status:429},
    {overrides:{readSubmission:async()=>({value:application('gorez'),files:[]})},status:422},
    {overrides:{prepareImages:async()=>[]},status:422},
    {overrides:{authenticate:async()=>({id:'unverified',email:'owner@example.com',email_confirmed_at:null})},status:409},
    {overrides:{reserved:()=>true},status:409},
  ]
  for(const item of cases) {
    const input=application('gorez');item.patch?.(input)
    const f=handlerFixture(input,item.overrides),response=await f.submit()
    assert.equal(response.status,item.status)
    assert.equal(f.calls.accounts,0);assert.equal(f.calls.saves.length,0);assert.equal(f.calls.notifications,0)
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

test('local location preview is unavailable in Production and contains no submission or notification path', async () => {
  const page=await readFile(new URL('../app/dev/registration-location/page.js',import.meta.url),'utf8')
  const fixture=await readFile(new URL('../app/dev/registration-location/preview.js',import.meta.url),'utf8')
  assert.match(page,/process.env.NODE_ENV !== 'development'\) notFound\(\)/)
  assert.doesNotMatch(fixture,/BusinessCoordinatesFields|locationConfirmed|location_confirmed|onConfirm|registration-coordinate-confirm/)
  assert.doesNotMatch(fixture,/fetch\(|supabase|onSubmit|type="submit"|action=/)
})
