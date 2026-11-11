import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { emptyOnboardingService, hasServiceDraftEdits, mergeCatalogueBusiness, normalizeImportedServices, servicesForApplication } from '../lib/onboarding-catalogue-draft.mjs'
import { applicationServiceSchema } from '../lib/service-pricing.mjs'

test('blank service rows are independent and do not invent a quote or duration', () => {
  const first = emptyOnboardingService(), second = emptyOnboardingService()
  assert.deepEqual(first, { name: '', price: '', duration_min: '' })
  first.name = 'Edited'
  assert.equal(second.name, '')
})

test('draft edit protection treats any nonblank field and zero as an edit', () => {
  for (const rows of [undefined, null, [], [emptyOnboardingService()], [{ name: ' ', price: null, duration_min: undefined }], [{currency:'EUR',description:' ',price_details:{}}]]) assert.equal(hasServiceDraftEdits(rows), false)
  for (const row of [{ name: 'Name' }, { price: '0' }, { price: 0 }, { duration_min: '45' }, { price: 'not valid yet' }, {currency:'BGN'}, {description:'Real conditions'}, {price_details:{kind:'from'}}]) assert.equal(hasServiceDraftEdits([row]), true)
})

test('business merge changes the selected name but fills only blank public fields', () => {
  const current = Object.freeze({ name: 'Typed', phone: 'my phone', address: ' ', city_ekatte: '', neighborhood: null, website_url: '', industry: 'other', slug: 'new-page-nonce', default_duration_min: '45' })
  const source = Object.freeze({ name: 'Selected', phone: 'source phone', address: 'Real address', city_ekatte: '68134', neighborhood: 'Борово', website_url: 'https://example.com/', industry: 'beauty', slug: 'old-page' })
  assert.deepEqual(mergeCatalogueBusiness(current, source), { ...current, name: 'Selected', address: 'Real address', city_ekatte: '68134', neighborhood: 'Борово', website_url: 'https://example.com/', industry: 'beauty' })
  assert.equal(current.name, 'Typed')
})

test('business merge never copies identity, auth, photos, hours, booking consent or coordinates', () => {
  const current = { name: '', owner_id: 'own', slug: 'own-slug', account: { email: 'mine' }, public_profile: { latitude: null, longitude: null }, booking_mode: 'gorez', external_booking_consent: false, photoConsent: false, default_duration_min: '45', industry: 'auto' }
  const source = { name: 'Chosen', owner_id: 'attacker', id: 'old-id', gorezBusinessId: 'partner', slug: 'old-slug', account: { email: 'other' }, photos: ['foreign.jpg'], staff: [{ id: 'old-staff' }], hours: ['old'], schedule: ['old'], booking_mode: 'external', external_booking_consent: true, photoConsent: true, public_profile: { latitude: 42, longitude: 23 }, latitude: 42, longitude: 23, industry: 'beauty' }
  const result = mergeCatalogueBusiness(current, source)
  assert.deepEqual(result, { ...current, name: 'Chosen' })
  assert.notEqual(result, current)
})

test('invalid industry/source input and blank selected names cannot overwrite the draft', () => {
  assert.deepEqual(mergeCatalogueBusiness({ name: 'Mine', industry: 'other' }, { name: ' ', industry: 'unknown', phone: {} }), { name: 'Mine', industry: 'other' })
  assert.deepEqual(mergeCatalogueBusiness(null, { name: 'Valid', id: 'do-not-copy' }), { name: 'Valid' })
  assert.deepEqual(mergeCatalogueBusiness({ industry: '' }, { industry: 'beauty' }), { industry: '' })
})

test('public lookup DTO cityCode and website aliases fill native draft fields without importing IDs', () => {
  assert.deepEqual(mergeCatalogueBusiness({ name: '', phone: '', address: '', city_ekatte: '', neighborhood: '', website_url: '', industry: 'other', slug: 'fresh' }, { id: 'catalogue-id', name: 'Exact selected name', cityCode: '68134', website: 'https://example.com/', industry: 'beauty' }), { name: 'Exact selected name', phone: '', address: '', city_ekatte: '68134', neighborhood: '', website_url: 'https://example.com/', industry: 'beauty', slug: 'fresh' })
})

test('unknown or inherited source fields cannot populate allowed fields', () => {
  const current = { name: 'Mine', phone: '', address: '', neighborhood: '', industry: 'other' }
  assert.deepEqual(mergeCatalogueBusiness(current, { undefined: 'Not a public field' }), current)
  assert.deepEqual(mergeCatalogueBusiness(current, Object.create({ name: 'Inherited', phone: 'Inherited', industry: 'beauty' })), current)
  const source = JSON.parse('{"name":"Chosen","__proto__":{"owner_id":"bad"}}')
  const result = mergeCatalogueBusiness(current, source)
  assert.equal(result.name, 'Chosen')
  assert.equal(result.owner_id, undefined)
  assert.equal(Object.getPrototypeOf(result), Object.prototype)
})

test('imported scalar DTO values retain exact decimal strings and zero without defaults', () => {
  assert.deepEqual(normalizeImportedServices([{ name: 'Free', price: 0, duration_min: 5 }, { name: 'Exact', price: '025.00', duration_min: '45.0', catalogueHint: { priceLabel: 'Owner quote' } }]), [
    { name: 'Free', price: '0', duration_min: '5', currency:'EUR', description:'', price_details:{}, catalogueHint: null },
    { name: 'Exact', price: '025.00', duration_min: '45.0', currency:'EUR', description:'', price_details:{}, catalogueHint: { priceLabel: 'Owner quote' } },
  ])
  assert.deepEqual(normalizeImportedServices([{ name: 'Unknown' }]), [{ name: 'Unknown', price: '', duration_min: '', currency:'EUR', description:'', price_details:{}, catalogueHint: null }])
})

test('raw objects and malformed ranges are not scalar prices; valid qualified tariffs retain currency and metadata', () => {
  for (const row of [
    { price: { amount: 20, currency: 'EUR', kind: 'fixed' } },
    { price: { amount: 20, currency: 'EUR', kind: 'range', maximum: 40 } },
    { price: '20', kind: 'range' }, {price:'20',price_details:{kind:'range',maximum:10}},
    {price:'20',currency:'USD'}, {price:'20',price_details:{kind:'fixed',maximum:30}},
  ]) assert.equal(normalizeImportedServices([{ name: 'Qualified', catalogueHint: 'Original terms', ...row }])[0].price, '')
  for (const row of [{price:'20',currency:'BGN'}, {price:'20',priceCurrency:'BGN'}, {price:'20',priceKind:'from'}, {price:'20',price_kind:'from'}, {price:'20',unit:'6 sessions'}, {price:'20',description:'Only with online booking'}]) {
    const service=normalizeImportedServices([{name:'Qualified',...row}])[0]
    assert.equal(service.price,'20')
    assert.equal(service.currency,row.currency||row.priceCurrency||'EUR')
    if(row.priceKind||row.price_kind)assert.equal(service.price_details.kind,'from')
    if(row.unit)assert.equal(service.price_details.unit,row.unit)
    if(row.description)assert.equal(service.description,row.description)
  }
  assert.equal(normalizeImportedServices([{ name: 'Valid', price: '20.00', currency: 'EUR', kind: 'fixed' }])[0].price, '20.00')
})

test('invalid numeric imports become blank, never rounded, converted or guessed', () => {
  for (const price of [-1, 1000000, NaN, Infinity, true, {}, '1,50', 'from 20', '1.234', '1e2', '']) assert.equal(normalizeImportedServices([{ price }])[0].price, '')
  for (const duration_min of [0, 2, 4, 1441, 45.5, NaN, Infinity, true, {}, '', '45 minutes']) assert.equal(normalizeImportedServices([{ duration_min }])[0].duration_min, '')
  assert.equal(normalizeImportedServices([{ durationMin: 45 }])[0].duration_min, '')
})

test('catalogue hint whitelists bounded UI context and preserves ordinary context without clearing safe prices', () => {
  const hint = Object.freeze({ priceLabel: '25 €', description: 'Haircut including wash', requiresPriceConfirmation: false, id: 'must not copy', owner_id: 'must not copy', nested: { unsafe: true } })
  const result = normalizeImportedServices([{ name: 'Safe', price: '25.00', duration_min: '45', catalogueHint: hint }])[0]
  assert.equal(result.price, '25.00')
  assert.deepEqual(result.catalogueHint, { priceLabel: '25 €', description: 'Haircut including wash' })
  assert.notEqual(result.catalogueHint, hint)
  assert.equal(normalizeImportedServices([{ price: '25.00', price_details:{kind:'from'}, catalogueHint: { requiresPriceConfirmation: true, priceLabel: 'from 25 €' } }])[0].price, '25.00', 'a legacy advisory flag cannot force re-entry')
  const oversized = normalizeImportedServices([{ price: '25.00', catalogueHint: { priceLabel: 'x'.repeat(501), description: 'y'.repeat(2001), requiresPriceConfirmation: false } }])[0]
  assert.equal(oversized.price, '')
  assert.equal(oversized.catalogueHint, null)
  assert.equal(oversized.description.length,2001,'oversized conditions remain visible for correction, never silently cut')
})

test('service normalization whitelists fields without truncating names or more than 40 rows', () => {
  const name = 'Long name '.repeat(20), rows = Array.from({ length: 45 }, (_, index) => Object.freeze({ name: name + index, price: '1.15', duration_min: '45', id: 'old', business_id: 'old', currency: 'EUR', staff: ['old'], owner_id: 'old', catalogueHint: 'Source context' }))
  const result = normalizeImportedServices(rows)
  assert.equal(result.length, 45)
  assert.equal(result[0].name, name + 0)
  assert.deepEqual(Object.keys(result[0]), ['name', 'price', 'duration_min', 'currency','description','price_details','catalogueHint'])
  assert.equal(result[0].price, '1.15')
  assert.deepEqual(normalizeImportedServices(rows, [2, 0, 2, -1, 999, '1']).map(row => row.name), [name + 0, name + 2])
  assert.equal(normalizeImportedServices(rows, new Set([1])).length, 1)
  assert.deepEqual(normalizeImportedServices(rows, []), [])
  assert.deepEqual(normalizeImportedServices(rows, 'all'), [])
})

test('application projection keeps real pricing semantics but strips source identity and UI-only metadata', () => {
  const source = [{ name: 'Service', price: '0.00', duration_min: '45', catalogueHint: 'Do not submit', id: 'old', owner_id: 'bad', currency: 'BGN', description: 'source', category: 'hair' }, { name: 'Unknown', price: ' ', duration_min: null }, { name: 9, price: 'not a number', duration_min: '1.5' }]
  assert.deepEqual(servicesForApplication(source), [
    { name: 'Service', price: '0.00', duration_min: '45', currency:'BGN',description:'source' },
    { name: 'Unknown', price: null, duration_min: null },
    { name: 9, price: 'not a number', duration_min: '1.5' },
  ])
  assert.deepEqual(servicesForApplication(null), [])
  assert.equal(source[0].catalogueHint, 'Do not submit')
})

test('the complete range/unit/currency/conditions survive draft projection without source privileges or a confirmation flag', () => {
  const [service] = normalizeImportedServices([{ name:'Actual tariff',price:'20.50',duration_min:'30',currency:'BGN',description:'За едно посещение, при публикуваните условия.',price_details:{kind:'range',maximum:35,unit:'посещение'},owner_id:'must-not-copy',catalogueHint:{requiresPriceConfirmation:true,priceLabel:'20,50–35 лв.'} }])
  assert.equal(service.price,'20.50')
  const [payload] = servicesForApplication([service])
  assert.equal(applicationServiceSchema.safeParse(payload).success,true)
  assert.deepEqual(payload.price_details,{kind:'range',maximum:35,unit:'посещение'})
  assert.equal(payload.currency,'BGN')
  assert.equal(payload.description,service.description)
  assert.equal(payload.owner_id,undefined)
  assert.equal(payload.catalogueHint,undefined)
  assert.equal(service.catalogueHint.requiresPriceConfirmation,undefined)
})

test('malformed explicit pricing metadata cannot disappear into defaults or turn a missing range maximum into zero', () => {
  for(const price_details of [null,[],42,'not metadata']) {
    const [payload]=servicesForApplication([{name:'Invalid service',price:'0',duration_min:'30',price_details}])
    assert.equal(applicationServiceSchema.safeParse(payload).success,false)
  }
  for(const maximum of ['',null,undefined]) {
    const [service]=normalizeImportedServices([{name:'Missing maximum',price:'0',price_details:{kind:'range',maximum}}])
    assert.equal(service.price,'')
  }
})

test('client draft helper does not import the catalogue, server application or database modules', async () => {
  const source = await readFile(new URL('../lib/onboarding-catalogue-draft.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /from\s+['"][^'"]*(?:business-application|sofia-catalogue|supabase|server-only)/)
  assert.doesNotMatch(source, /\bfetch\s*\(/)
})
