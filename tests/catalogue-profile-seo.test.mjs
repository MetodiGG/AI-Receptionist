import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord, EXCLUDED_GENERAL_CLINIC_IDS } from '../lib/discovery/catalogue-policy.mjs'
import * as profile from '../lib/catalogue-profile.mjs'
import * as seo from '../lib/seo.mjs'
import * as details from '../lib/discovery/business-details.mjs'
import * as rail from '../lib/discovery/rail.mjs'
import * as servicePresentation from '../lib/discovery/service-presentation.mjs'
import * as copy from '../lib/discovery/copy.mjs'
import * as attribution from '../lib/discovery/catalogue-attribution.mjs'
import { businessCoverPhoto } from '../lib/business-cover-photo.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const real = SOFIA_CATALOGUE.find(row => row.id === 'sofia-in-beauty')
const clone = value => structuredClone(value)
const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
async function compile(path, stubs, extra = {}) {
  const { code } = await transform(await readFile(new URL(path, import.meta.url), 'utf8'), { filename: path,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
  const mod = { exports: {} }
  new Function('require', 'module', 'exports', ...Object.keys(extra), code)(name => name in stubs ? stubs[name] : require(name), mod, mod.exports, ...Object.values(extra))
  return mod.exports
}

test('only current reviewed local catalogue identities receive an indexable profile', () => {
  assert.equal(profile.catalogueProfilePath(real.id), `/businesses/catalogue/${real.id}`)
  for (const id of ['google:ChIJ123', '../admin', 'sofia-abc?token=private', '', null, { toString: () => real.id }]) assert.equal(profile.catalogueProfilePath(id), null)
  for (const row of [undefined, {}, { ...clone(real), verification: { ...real.verification, status: 'draft' } }, { ...clone(real), verification: { ...real.verification, status: 'rejected' } }, { ...clone(real), verification: { ...real.verification, validUntil: '2026-11-01' } }, { ...clone(real), provider: 'google' }]) {
    assert.equal(profile.indexableCatalogueRecord(row, now), null)
    assert.equal(profile.catalogueProfileMetadata(row, 'bg', now).robots.index, false)
    assert.equal(profile.catalogueProfileStructuredData(row, 'bg', now), null)
  }
  for (const id of EXCLUDED_GENERAL_CLINIC_IDS) assert.equal(profile.indexableCatalogueRecord(SOFIA_CATALOGUE.find(row => row.id === id), now), null, id)
  assert.equal(profile.indexableCatalogueRecord(SOFIA_CATALOGUE.find(row => row.gorezBusinessId), now), null, 'an explicitly linked native partner keeps its /book URL')
})

test('metadata uses the real name/services and current-locale canonical plus reciprocal BG/EN alternates', () => {
  for (const locale of ['bg', 'en']) {
    const data = profile.catalogueProfileMetadata(real, locale, now), path = profile.catalogueProfilePath(real.id)
    assert.match(data.title.absolute, /IN Beauty/)
    assert.ok(data.description.includes(real.services[0].name))
    assert.equal(data.alternates.canonical, seo.localizedUrl(path, locale))
    assert.equal(data.alternates.languages['bg-BG'], seo.localizedUrl(path, 'bg'))
    assert.equal(data.alternates.languages.en, seo.localizedUrl(path, 'en'))
    assert.equal(data.openGraph.url, data.alternates.canonical)
    assert.doesNotMatch(JSON.stringify(data), /aggregateRating|reviewCount|availableSlots/)
  }
})

test('structured data contains actual services/contact only, never invented ratings, slots, stock work or guessed points', () => {
  const data = profile.catalogueProfileStructuredData(real, 'en', now)
  assert.equal(data.name, real.name); assert.equal(data.address, real.address); assert.equal(data.telephone, real.phone)
  assert.equal(data.url, seo.localizedUrl(profile.catalogueProfilePath(real.id), 'en'))
  assert.deepEqual(data.hasOfferCatalog.itemListElement.map(item => item.itemOffered.name), real.services.map(service => service.name))
  for (const field of ['aggregateRating', 'review', 'image', 'photo', 'geo', 'openingHours', 'priceRange', 'availability']) assert.equal(field in data, false)
  assert.doesNotMatch(JSON.stringify(data), /"price"|"availability"/)
  const atHome = SOFIA_CATALOGUE.find(row => row.locationKind === 'service_area' && profile.indexableCatalogueRecord(row, now))
  assert.equal('address' in profile.catalogueProfileStructuredData(atHome, 'bg', now), false)
  assert.equal(profile.catalogueProfileStructuredData(atHome, 'bg', now).areaServed.name, 'София')
  assert.doesNotMatch(seo.safeJsonLd({ name: '</script><script>bad' }), /<script|<\/script/)
})

test('profile facts preserve price qualifiers/currency conversion and hide genuinely missing or expired prices', () => {
  const row = clone(real)
  row.services = [
    { ...row.services[0], price: { ...row.services[0].price, kind: 'from', amount: 80, currency: 'BGN', unit: 'посещение' } },
    { ...row.services[1], price: { ...row.services[1].price, kind: 'range', amount: 25, maximum: 40 } },
    { ...row.services[2], price: undefined },
    { ...row.services[3], price: { ...row.services[3].price, checkedOn: '2026-01-01', validUntil: undefined } },
  ]
  const view = profile.catalogueProfileView(row, { now }), services = details.businessDetailServices(view)
  assert.match(details.detailPriceLabel(services[0], 'bg'), /^от 40,90/)
  assert.match(details.detailPriceLabel(services[0], 'bg'), /\/ посещение$/)
  assert.match(details.detailPriceLabel(services[1], 'en'), /25\.00.*40\.00/)
  assert.equal(details.detailPriceLabel(services[2]), null); assert.equal(details.detailPriceLabel(services[3]), null)
  assert.equal(rail.railExternalAction(view, now).href, real.booking.url)
  assert.equal(rail.railDirections(view), rail.railDirections({ ...real, source: 'catalogue' }))
  const byPhone = SOFIA_CATALOGUE.find(row => row.booking.kind === 'phone' && profile.indexableCatalogueRecord(row, now))
  assert.equal(rail.railExternalAction(profile.catalogueProfileView(byPhone, { now }), now).href, `tel:${byPhone.phone}`)
})

test('only rights-cleared stored photos enter the gallery; illustrative fallback is not schema portfolio data', () => {
  const photo = { catalogue_id: real.id, photo_id: 'b0000000-0000-4000-8000-000000000001', rights_basis: 'owner_permission', rights_reference: 'Owner confirmation', width: 1200, height: 800, alt_text: 'Actual salon' }
  assert.equal(profile.catalogueProfileView(real, { now }).photos.length, 0)
  assert.equal(profile.catalogueProfileView(real, { now, photos: [{ ...photo, rights_basis: 'unknown' }] }).photos.length, 0)
  const view = profile.catalogueProfileView(real, { now, photos: [photo] })
  assert.equal(view.photos[0].src, `/api/catalogue-media/${photo.photo_id}`)
  assert.equal(view.photos[0].alt.en, 'Actual salon')
  assert.ok(view.details.services.every(service => service.name && !('verification' in service)))
})

test('real catalogue sitemap is exhaustive, deduplicated, fresh-only and localized; related links point to actual eligible records', () => {
  const eligible = SOFIA_CATALOGUE.filter(row => approvedCatalogueRecord(row, now) && !row.gorezBusinessId)
  const entries = profile.catalogueProfileSitemapEntries([...SOFIA_CATALOGUE, real], now)
  assert.equal(entries.length, eligible.length * 2)
  assert.equal(new Set(entries.map(item => item.url)).size, entries.length)
  assert.ok(entries.every(item => item.lastModified <= '2026-11-14T23:59:59Z' && item.alternates.languages.en && !item.url.includes('google:')))
  const related = profile.relatedCatalogueProfiles(SOFIA_CATALOGUE, real, { now, limit: 4 })
  assert.ok(related.length > 0 && related.length <= 4)
  for (const item of related) {
    const row = SOFIA_CATALOGUE.find(record => record.id === item.id)
    assert.ok(profile.indexableCatalogueRecord(row, now)); assert.equal(row.category, real.category)
    assert.equal(item.href, profile.catalogueProfilePath(row.id)); assert.notEqual(row.id, real.id)
  }
})

test('native canonical uses existing strict public identity matching, never names, chain contacts alone, private or ambiguous profiles', () => {
  const native = { id: 'b0000000-0000-4000-8000-000000000002', name: 'Current partner', slug: 'current-partner', active: true, platform_status: 'enabled', address: real.address, phone: real.phone }
  assert.deepEqual(profile.catalogueNativePartner(real, [native], now), { name: native.name, path: '/book/current-partner' })
  for (const change of [{ active: false }, { platform_status: 'pending' }, { slug: 'invalid?secret=x' }, { phone: '+359888000001' }, { address: 'София, ул. Друга 19', name: real.name }]) assert.equal(profile.catalogueNativePartner(real, [{ ...native, ...change }], now), null)
  assert.equal(profile.catalogueNativePartner(real, [native, { ...native, id: 'other-id', slug: 'other-branch' }], now), null)
  assert.equal(profile.catalogueProfileSitemapEntries([real], now, { partners: [native] }).length, 0)
})

const simpleLink = ({ href, children, prefetch, ...props }) => React.createElement('a', { ...props, href }, children)
const actualProfile = row => ({ row, business: profile.catalogueProfileView(row, { now }), related: profile.relatedCatalogueProfiles(SOFIA_CATALOGUE, row, { now }), now })
let responseProfile = actualProfile(real)
const page = await compile('../app/businesses/catalogue/[id]/page.js', {
  'next/link': simpleLink, 'next/navigation': { notFound: () => { throw Error('NOT_FOUND') }, permanentRedirect: url => { throw Error(`REDIRECT:${url}`) } },
  '../../../../components/brand-logo': { BrandLogo: () => React.createElement('span', null, 'GoRez') },
  '../../../../components/home-link': { HomeLink: () => React.createElement('a', { href: '/' }, 'Home') },
  '../../../../components/business-profile': { BusinessProfileHeader: ({ business, shareUrl }) => React.createElement('header', { 'data-share-url': shareUrl, 'data-private-service-inventory': Boolean(business.details || business.services || business.publicServiceNames),
    'data-activity-cover': business.illustrativeCoverPhotoKey, 'data-resolved-cover': businessCoverPhoto(business).src }, React.createElement('h1', null, business.name), business.address) },
  '../../../../components/service-thumbnail': { ServiceThumbnail: ({ service }) => React.createElement('img', { src: '/service-photos/test.webp', alt: service.name }) },
  '../../../../components/booking-button-content': { BookingButtonContent: ({ children }) => React.createElement('span', null, children) },
  '../../../../components/icon': { Icon: ({ name }) => React.createElement('svg', { 'data-icon': name, 'aria-hidden': true }) },
  '../../../../lib/catalogue-profile-server': { readCatalogueSeoProfile: async () => responseProfile },
  '../../../../lib/catalogue-profile.mjs': profile, '../../../../lib/seo.mjs': seo,
  '../../../../lib/discovery/business-details.mjs': details, '../../../../lib/discovery/rail.mjs': rail,
  '../../../../lib/discovery/service-presentation.mjs': servicePresentation, '../../../../lib/discovery/copy.mjs': copy,
  '../../../../lib/discovery/catalogue-attribution.mjs': attribution, './profile.css': {},
})

test('BG/EN route server-renders actual full service names/prices and safe real actions, without a fabricated calendar or ratings', async () => {
  responseProfile = actualProfile(real)
  for (const locale of ['bg', 'en']) {
    const node = await page.default({ params: Promise.resolve({ id: real.id }), searchParams: Promise.resolve({ lang: locale }) })
    const html = renderToStaticMarkup(node)
    assert.match(html, new RegExp(`lang="${locale}"`))
    for (const service of real.services) assert.ok(html.includes(renderToStaticMarkup(React.createElement('span', null, service.name)).slice(6, -7)), service.name)
    assert.ok(html.includes(real.booking.url)); assert.ok(html.includes(rail.railDirections(responseProfile.business).replaceAll('&', '&amp;')))
    assert.match(html, /data-icon="map"/); assert.match(html, /75,00|75\.00/)
    assert.match(html, /data-private-service-inventory="false"/)
    assert.match(html, /data-share-url="https:\/\/www\.gorez\.co\/businesses\/catalogue\/sofia-in-beauty\?lang=/)
    assert.doesNotMatch(html, /aggregateRating|ratingValue|availableSlots|booking-experience|Избрана дата/)
    assert.match(html, /ГИС София \/ Столична община/)
    assert.ok((await page.generateMetadata({ params: Promise.resolve({ id: real.id }), searchParams: Promise.resolve({ lang: locale }) })).description.includes('IN Beauty'))
  }
})

test('direct BG/EN folk-dance profile hero carries its stable activity image without serializing the service menu', async () => {
  const folk = SOFIA_CATALOGUE.find(row => row.id === 'sofia-nosia-todor-alexandrov17')
  assert.ok(folk)
  responseProfile = actualProfile(folk)
  assert.equal(responseProfile.business.illustrativeCoverPhotoKey, 'sx-bulgarian-folk-group')
  for (const locale of ['bg', 'en']) {
    const node = await page.default({ params: Promise.resolve({ id: folk.id }), searchParams: Promise.resolve({ lang: locale }) })
    const html = renderToStaticMarkup(node)
    assert.match(html, /data-activity-cover="sx-bulgarian-folk-group"/)
    assert.match(html, /data-resolved-cover="\/business-cover-photos\/activity-sx-bulgarian-folk-group-v1\.webp"/)
    assert.match(html, /data-private-service-inventory="false"/)
    assert.doesNotMatch(html, /data-resolved-cover="[^"]*(?:fitness-v1|boxing)/)
    assert.ok(html.includes(folk.name))
  }
})

test('missing catalogue routes are noindex/404 and strict native matches redirect to the existing canonical booking URL', async () => {
  responseProfile = null
  assert.equal((await page.generateMetadata({ params: Promise.resolve({ id: 'sofia-no-such-business' }), searchParams: Promise.resolve({}) })).robots.index, false)
  await assert.rejects(page.default({ params: Promise.resolve({ id: 'sofia-no-such-business' }), searchParams: Promise.resolve({}) }), /NOT_FOUND/)
  responseProfile = { partner: { name: 'Current partner', path: '/book/current-partner' } }
  assert.equal((await page.generateMetadata({ params: Promise.resolve({ id: real.id }), searchParams: Promise.resolve({ lang: 'en' }) })).alternates.canonical, seo.localizedUrl('/book/current-partner', 'en'))
  await assert.rejects(page.default({ params: Promise.resolve({ id: real.id }), searchParams: Promise.resolve({ lang: 'en' }) }), /REDIRECT:https:\/\/www\.gorez\.co\/book\/current-partner\?lang=en/)
})

test('sitemap preserves native published booking URLs and fails closed on private/native read failure', async () => {
  let fail = false, offset = 0, selection
  const native = { id: 'b0000000-0000-4000-8000-000000000002', name: 'Current partner', slug: 'current-partner', active: true, platform_status: 'enabled', address: real.address, phone: real.phone }
  const query = { select: value => { selection = value; return query }, eq: (key, value) => { assert.ok(['active', 'platform_status'].includes(key)); assert.ok(value === true || value === 'enabled'); return query }, order: () => query,
    range: async start => { offset = start; return fail ? { error: new Error('Private detail must not leak') } : { data: [native, { slug: '../private' }] } } }
  const module = await compile('../app/sitemap.js', { '../lib/supabase-admin': { getSupabaseAdmin: () => ({ from: () => query }) }, '../lib/seo.mjs': seo,
    '../lib/discovery/sofia-catalogue.mjs': { SOFIA_CATALOGUE: [real] }, '../lib/catalogue-profile.mjs': profile }, { Date: { now: () => now } })
  const entries = await module.default()
  assert.equal(offset, 0); assert.match(selection, /slug/); assert.doesNotMatch(selection, /email|customer|password|token/)
  assert.equal(entries.filter(item => item.url.includes('/book/current-partner?')).length, 2)
  assert.ok(!entries.some(item => item.url.includes('/businesses/catalogue/') || item.url.includes('private')))
  fail = true
  await assert.rejects(module.default(), /^Error: SITEMAP_UNAVAILABLE$/)
})

test('server profile reader queries public identity fields only, avoids invalid lookups and tolerates photo/read outages without guessing a partner', async () => {
  let queries = 0, photoReads = 0, fail = false, members = [], selected = ''
  const query = { select: value => { selected = value; return query }, eq: (field, value) => { assert.ok(field === 'active' && value === true || field === 'platform_status' && value === 'enabled'); return query }, order: () => query,
    range: async () => { queries++; return fail ? { error: Error('offline') } : { data: members } } }
  const module = await compile('../lib/catalogue-profile-server.js', { 'server-only': {}, react: { cache: fn => fn },
    './discovery/sofia-catalogue.mjs': { SOFIA_CATALOGUE: [real] }, './discovery/catalogue-policy.mjs': { approvedCatalogueRecord }, './catalogue-profile.mjs': profile,
    './catalogue-photo-server': { readPublicCataloguePhotos: async ids => { photoReads++; assert.deepEqual(ids, [real.id]); throw Error('unavailable image store') } },
    './supabase-admin': { getSupabaseAdmin: () => ({ from: table => { assert.equal(table, 'businesses'); return query } }) },
  }, { Date: { now: () => now } })
  assert.equal(await module.readCatalogueSeoProfile('../private'), null)
  assert.equal(await module.readCatalogueSeoProfile('sofia-nonexistent-identity'), null)
  assert.equal(queries, 0); assert.equal(photoReads, 0)
  const available = await module.readCatalogueSeoProfile(real.id)
  assert.equal(available.business.name, real.name); assert.deepEqual(available.business.photos, [])
  assert.doesNotMatch(selected, /email|owner_id|password|token|customer/)
  members = [{ id: 'b0000000-0000-4000-8000-000000000002', name: 'Current partner', slug: 'current-partner', active: true, platform_status: 'enabled', address: real.address, phone: real.phone }]
  assert.deepEqual((await module.readCatalogueSeoProfile(real.id)).partner, { name: 'Current partner', path: '/book/current-partner' })
  assert.equal(photoReads, 1, 'redirecting to the native page does not read independent catalogue photos')
  fail = true
  assert.equal((await module.readCatalogueSeoProfile(real.id)).business.name, real.name, 'an unavailable native lookup never guesses a canonical partner')
})
