import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { createEnglishContentResolver } from '../lib/locale/public-content-resolver.mjs'
import { serviceDisplayName, serviceDisplayUnit, publicProse, postalDisplay, businessDisplayAddress, ENGLISH_TRANSLATION_PENDING } from '../lib/locale/public-content.mjs'
import { servicePresentation, serviceSourcePresentation } from '../lib/discovery/service-presentation.mjs'
import { businessDetailServices, detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { bookingCalendarFile } from '../lib/booking-confirmation.mjs'

const dictionary = { schemaVersion: 1,
  names: { 'Боядисване': 'Hair colouring', 'Маникюр': 'Manicure', 'Изпиляване': 'Filing', 'Силант': 'Sealant' },
  contextual: { auto_repair: { 'Боядисване': 'Car painting' }, other: { 'Изпиляване': 'Tooth preparation', 'Силант': 'Fissure sealant' } },
  descriptions: { 'Само за 2 посещения; материалите не са включени.': 'For 2 visits only; materials are not included.', 'Специалист по маникюр.': 'Manicure specialist.' },
  units: { 'пакет 2 посещения': 'package of 2 visits' },
}
const resolver = createEnglishContentResolver(dictionary)
const fingerprint = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const raw = { id: '10000000-0000-4000-8000-000000000001', name: 'Боядисване', category: 'hair',
  description: 'Само за 2 посещения; материалите не са включени.', price: 30, currency: 'EUR',
  priceKind: 'range', priceMaximum: 50, priceUnit: 'пакет 2 посещения', durationMin: 60,
  priceSourceUrl: 'https://example.test/menu', priceCheckedOn: '2026-11-22' }

test('cached English presentation keeps all source keys, IDs, qualifications, amounts, photo associations and fingerprints untouched', () => {
  const before = fingerprint(raw), source = structuredClone(raw), result = resolver.service(raw)
  const { presentationEn, ...unchanged } = result
  assert.deepEqual(unchanged, source)
  assert.equal(fingerprint(raw), before)
  assert.equal(presentationEn.name, 'Hair colouring')
  assert.equal(serviceDisplayName(result, 'bg'), 'Боядисване')
  assert.equal(serviceDisplayName(result, 'en'), 'Hair colouring')
  assert.equal(serviceDisplayUnit(result, 'en'), 'package of 2 visits')
  assert.equal(servicePresentation(result, 'en').description, dictionary.descriptions[raw.description])
  assert.equal(servicePresentation(result, 'bg').description, raw.description)
  assert.match(detailPriceLabel(result, 'en'), /30\.00.*50\.00.*package of 2 visits/u)
  assert.equal(serviceThumbnail(result, { business: { category: 'hair' }, locale: 'en' }).src,
    serviceThumbnail(raw, { business: { category: 'hair' }, locale: 'en' }).src)
  assert.doesNotMatch(serviceThumbnail(result, { business: { category: 'hair' }, locale: 'en' }).alt, /[а-яѝ]/iu)
})

test('domain-specific names are resolved using the original category before general names; brand wording is not renamed', () => {
  assert.equal(serviceDisplayName(resolver.service({ name: 'Боядисване' }, { businessCategory: 'auto_repair' }), 'en'), 'Car painting')
  assert.equal(serviceDisplayName(resolver.service({ name: 'MEGAN by SKEYNDOR' }), 'en'), 'MEGAN by SKEYNDOR')
  assert.equal(resolver.business({ name: 'Бизнес Иванов', services: [raw] }).name, 'Бизнес Иванов')
  assert.equal(serviceDisplayName(resolver.service({ name: 'Изпиляване', category: 'nails' }), 'en'), 'Filing')
  assert.equal(serviceDisplayName(resolver.service({ name: 'Изпиляване', category: 'other' }), 'en'), 'Tooth preparation')
  assert.equal(serviceDisplayName(resolver.service({ name: 'Силант', category: 'nails' }), 'en'), 'Sealant')
  assert.equal(serviceDisplayName(resolver.service({ name: 'Силант', category: 'other' }), 'en'), 'Fissure sealant')
  assert.match(serviceDisplayName(resolver.service({ name: 'Изпиляване' }), 'en'), /English translation pending/u)
  assert.equal(serviceDisplayName(resolver.service({ name: 'Изпиляване', category: 'Стоматология' }, { industry: 'other' }), 'en'), 'Tooth preparation')
  assert.match(serviceDisplayName(resolver.service({ name: 'Изпиляване', category: 'Нова група' }), 'en'), /English translation pending/u)
})

test('known pricing conditions are interpreted from original source before translating only the remaining prose', () => {
  const service = { ...raw, description: 'Текуща цена с отстъпка, валидна САМО при онлайн записване, проверена на 14.11.2026. Условията се потвърждават при записване; не е зачеркнатата стара цена. ' + raw.description }
  const result = resolver.service(service)
  assert.equal(serviceSourcePresentation(service, 'en').description, raw.description)
  assert.equal(servicePresentation(result, 'en').description, dictionary.descriptions[raw.description])
  assert.deepEqual(servicePresentation(result, 'en').conditions, ['Online-only discount'])
  assert.equal(result.description, service.description)
})

test('unknown future Cyrillic text is honestly marked pending in EN and remains exact in BG; no transliteration substitutes for translation', () => {
  const source = { name: 'Нова специфична услуга', description: 'Специални условия без предплащане.', priceUnit: 'за 5 посещения' }
  const result = resolver.service(source)
  assert.match(serviceDisplayName(result, 'en'), /English translation pending/u)
  assert.equal(servicePresentation(result, 'en').description, ENGLISH_TRANSLATION_PENDING)
  assert.equal(serviceDisplayUnit(result, 'en'), ENGLISH_TRANSLATION_PENDING)
  assert.equal(serviceDisplayName(result, 'bg'), source.name)
  assert.equal(servicePresentation(result, 'bg').description, source.description)
  assert.equal(serviceDisplayUnit(result, 'bg'), source.priceUnit)
  assert.equal(serviceDisplayUnit({ ...resolver.service(raw), priceUnit: '' }, 'en'), '', 'compact prices never repeat the separate unit')
  assert.equal(publicProse({ bg: 'Описание', en: 'Owner supplied English description' }, 'en'), 'Owner supplied English description')
})

test('business and detail projections retain raw identity, map destinations and service ordering; public bios/descriptions use the same cache', () => {
  const source = { name: 'Иванов', address: 'София, ул. Пирин 83', public_profile: { description: { bg: 'Специалист по маникюр.', en: '' } },
    staff: [{ id: 'staff-one', name: 'Анелия', bio: 'Специалист по маникюр.' }], services: [raw], servicePreview: [raw], details: { services: [raw] } }
  const before = fingerprint(source), result = resolver.business(source)
  assert.equal(fingerprint(source), before)
  assert.equal(result.address, source.address)
  assert.equal(result.staff[0].name, 'Анелия')
  assert.equal(result.staff[0].bioEn, 'Manicure specialist.')
  assert.equal(publicProse(result.public_profile.description, 'en', result.presentationEn.description), 'Manicure specialist.')
  assert.equal(businessDisplayAddress(result, 'en'), 'Sofia, St. Pirin 83')
  assert.equal(serviceDisplayName(businessDetailServices(result)[0], 'en'), 'Hair colouring')
  assert.equal(result.servicePreview[0].name, raw.name)
})

test('English confirmation and calendar presentation use the cached service and Latin postal form without changing the booking', () => {
  const source = { appointment: { id: 'booking-one', starts_at: '2026-11-22T10:00:00Z', ends_at: '2026-11-22T11:00:00Z' }, service: raw,
    business: { name: 'Иванов', address: 'София, бул. България 2' } }
  const result = resolver.booking(source)
  const calendar = bookingCalendarFile({ appointment: source.appointment, serviceName: serviceDisplayName(result.service, 'en'), businessName: result.business.name,
    address: businessDisplayAddress(result.business, 'en'), staffName: 'Анелия', locale: 'en', now: new Date('2026-11-22T00:00:00Z') })
  assert.match(calendar, /SUMMARY:Hair colouring/u)
  assert.match(calendar, /LOCATION:Sofia\\, Blvd\. Balgariya 2/u)
  assert.deepEqual(result.appointment, source.appointment)
  assert.equal(result.service.name, source.service.name)
})

test('postal transliteration only affects display; abbreviated street prefixes and Cyrillic proper names retain exact numbers', () => {
  assert.equal(postalDisplay('София, ж.к. Дианабад, ул. Русаля 2, вх. Б, ет. 3', 'en'), 'Sofia, District Dianabad, St. Rusalya 2, Entrance B, Floor 3')
  assert.equal(postalDisplay('ул. Пирин 83', 'bg'), 'ул. Пирин 83')
})

test('client presentation dependency never imports the heavy dictionary or server resolver; all main server projections decorate only after public eligibility', async () => {
  const shared = await readFile(new URL('../lib/locale/public-content.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(shared, /service-english\.json|public-content-server/u)
  const slug = await readFile(new URL('../app/api/public/[slug]/route.js', import.meta.url), 'utf8')
  assert.match(slug, /presentPublicBusiness\(toPublicBusiness\(business\)\)/u)
  const handler = await readFile(new URL('../lib/discovery/handler.mjs', import.meta.url), 'utf8')
  assert.ok(handler.indexOf('compactDiscoveryResponse(await discoverBusinesses') < handler.indexOf('map(presentPublicBusiness)'))
  const suggestions = await readFile(new URL('../lib/discovery/suggestions.mjs', import.meta.url), 'utf8')
  assert.match(suggestions, /query: service\.label/u, 'visible English does not replace the matching query or canonical IDs')
})

test('no public client entry can transitively import the catalogue-sized translation cache or server adapter', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url)), files = new Map()
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (/\.(?:[cm]?js|jsx|json)$/u.test(path)) files.set(path, await readFile(path, 'utf8'))
    }
  }
  for (const directory of ['app', 'components', 'hooks', 'lib']) await visit(resolve(root, directory))
  const forbidden = new Set(['lib/locale/service-english.json', 'lib/locale/public-content-server.mjs', 'lib/locale/public-content-resolver.mjs'].map(path => resolve(root, path)))
  const resolveImport = (parent, specifier) => {
    const base = resolve(dirname(parent), specifier)
    return [base, ...['.js', '.mjs', '.jsx', '.json', '/index.js'].map(suffix => base + suffix)].find(candidate => files.has(candidate))
  }
  const clients = [...files].filter(([, source]) => /^['"]use client['"]/mu.test(source)).map(([path]) => path)
  assert.ok(clients.length > 50, 'inspect the actual project client graph, not a hand-picked selector')
  for (const entry of clients) {
    const pending = [[entry, [entry]]], seen = new Set()
    while (pending.length) {
      const [path, chain] = pending.pop()
      if (seen.has(path)) continue
      seen.add(path)
      assert.equal(forbidden.has(path), false, chain.map(item => item.slice(root.length)).join(' -> '))
      for (const [, specifier] of files.get(path).matchAll(/\b(?:from\s*|import\s*\()\s*['"](\.[^'"]+)['"]/gu)) {
        const dependency = resolveImport(path, specifier)
        if (dependency && extname(dependency) !== '.json') pending.push([dependency, [...chain, dependency]])
        else if (dependency) assert.equal(forbidden.has(dependency), false, chain.join(' -> ') + ' -> ' + dependency)
      }
    }
  }
})
