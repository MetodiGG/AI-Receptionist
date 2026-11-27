import assert from 'node:assert/strict'
import test from 'node:test'
import { cataloguePartnerMatcher, isCataloguePartnerDuplicate, normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'

test('phone index retains exact branch, city, service-area and verified ID semantics', () => {
  const record = { cityCode: '68134', address: 'София, бул. Сливница 178Е', phone: '+359 888 001 001', website: 'https://branch.example/book' }
  const branch = { id: 'one', city_ekatte: '68134', city: 'София', address: 'бул. Сливница 178Е', phone: '0888 001 001' }
  const matcher = cataloguePartnerMatcher([
    { ...branch, id: 'different-city', city_ekatte: '56784' },
    { ...branch, id: 'another-door', address: 'бул. Сливница 178' },
    branch,
    { ...branch, id: 'service-area', phone: '+359 888 001 002', website_url: 'https://www.branch.example/book/?from=web' },
    { ...branch, id: 'manual-link', phone: null },
  ])
  assert.equal(matcher(record), true)
  assert.equal(matcher({ ...record, address: 'София, бул. Сливница 178А' }), false)
  assert.equal(matcher({ ...record, cityCode: '10135' }), false)
  assert.equal(matcher({ ...record, cityCode: '10135', phone: null, gorezBusinessId: 'manual-link' }), true)
  assert.equal(matcher({ ...record, locationKind: 'service_area', address: null, phone: '+359888001002' }), true)
  assert.equal(matcher({ ...record, address: null, phone: '+359888001002' }), false)
  assert.equal(matcher({ ...record, locationKind: 'service_area', address: null, phone: '+359888001002', website: 'https://branch.example/other' }), false)
  assert.equal(isCataloguePartnerDuplicate(record, [branch]), true)
})

test('a freshly read snapshot with an edited partner cannot hide the old branch', () => {
  const now = Date.parse('2026-11-27T00:00:00Z')
  const intent = { cityCode: '68134', browse: true, searchV2: true }
  const records = SOFIA_CATALOGUE.filter(row => row.address && row.phone).slice(0, 40)
  const visible = normalizeCatalogueBusinesses(records, intent, { now, includeDetails: false })
  assert.ok(visible.length > 0)
  const id = visible[0].id, raw = records.find(row => row.id === id)
  const partner = { id: 'one', city_ekatte: raw.cityCode, address: raw.address, phone: raw.phone }
  const browse = partners => normalizeCatalogueBusinesses(records, intent, { now, includeDetails: false, partners })
  assert.deepEqual(browse([partner]), visible.filter(row => row.id !== id))
  assert.deepEqual(browse([{ ...partner, phone: '+359899000000' }]), visible)
})
