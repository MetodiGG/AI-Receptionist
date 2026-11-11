import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { BGN_PER_EUR, BGN_EUR_RATE_SOURCE, bgnToEuroDisplayAmount, servicePriceForDisplay } from '../lib/currency-display.mjs'
import { detailPriceLabel, catalogueBusinessDetails, currentPublishedFact } from '../lib/discovery/business-details.mjs'
import { profileServicePrice } from '../lib/business-profile-ui.mjs'
import { withServicePricing } from '../lib/service-pricing.mjs'
import { servicePresentation } from '../lib/discovery/service-presentation.mjs'
import { serviceFitsBudget } from '../lib/discovery/internal-search.mjs'
import { servicePriceLabel } from '../lib/booking-mode.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { normalizeImportedServices, servicesForApplication } from '../lib/onboarding-catalogue-draft.mjs'
import { guidedServiceMenu } from '../lib/guided-assistant.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'

test('official full fixed rate divides BGN and rounds to cents without a shortened reciprocal or float tie error', () => {
  assert.equal(BGN_PER_EUR, 1.95583)
  assert.match(BGN_EUR_RATE_SOURCE, /^https:\/\/economy-finance\.ec\.europa\.eu\//)
  for (const [bgn, eur] of [[80, 40.90], [47, 24.03], [100, 51.13], [1.95583, 1], [0, 0], [0.00977915, .01], [0.009779149, 0], ['999999.99', 511291.88], [1e-8, 0]]) assert.equal(bgnToEuroDisplayAmount(bgn), eur, String(bgn))
  for (const invalid of [null, undefined, '', ' ', NaN, Infinity, -1, {}, 'not-money']) assert.equal(bgnToEuroDisplayAmount(invalid), null)
})

for (const locale of ['bg', 'en']) test(`${locale}: actual MG source80/47BGN becomes40.90/24.03EUR in shared public, profile and assistant labels without source edits`, () => {
  const record = SOFIA_CATALOGUE.find(row => row.name === 'MG The Art of Beauty')
  assert.ok(record)
  const before = JSON.stringify(record), details = catalogueBusinessDetails(record, Date.parse('2026-11-11T12:00:00Z'))
  for (const [bgn, eur] of [[80, 40.90], [47, 24.03]]) {
    const source = record.services.find(service => service.price?.amount === bgn && service.price.currency === 'BGN')
    const normalized = details.services.find(service => service.name === source.name)
    const label = new Intl.NumberFormat(locale === 'en' ? 'en-IE' : 'bg-BG', { style: 'currency', currency: 'EUR' }).format(eur)
    assert.equal(detailPriceLabel(normalized, locale), label)
    assert.equal(detailPriceLabel(normalized, locale, { compact: true }), label)
    assert.equal(profileServicePrice(normalized, locale), label)
    assert.equal(guidedServiceMenu({ services: [normalized] }, locale)[0].priceLabel, label)
    assert.equal(source.price.amount, bgn); assert.equal(source.price.currency, 'BGN')
  }
  assert.equal(JSON.stringify(record), before)
})

for (const locale of ['bg', 'en']) test(`${locale}: FROM, both range bounds, units, zero and same-cent ranges preserve their meaning after conversion`, () => {
  const number = value => new Intl.NumberFormat(locale === 'en' ? 'en-IE' : 'bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  const source = Object.freeze({ price: 80, currency: 'BGN', priceKind: 'range', priceMaximum: 100, priceUnit: 'процедура', description: 'Само при онлайн записване.' })
  const range = detailPriceLabel(source, locale)
  assert.ok(range.includes(number(40.90))); assert.ok(range.includes(number(51.13))); assert.match(range, /€.*процедура|процедура/)
  assert.doesNotMatch(range, /BGN|лв/)
  const minimum = detailPriceLabel({ ...source, priceKind: 'from', priceMaximum: null }, locale)
  assert.match(minimum, locale === 'en' ? /^from / : /^от /)
  assert.ok(minimum.includes(number(40.90)))
  const zero = detailPriceLabel({ price: 0, currency: 'BGN' }, locale, { compact: true })
  assert.ok(zero.includes(number(0))); assert.match(zero, /€/)
  const tiny = detailPriceLabel({ price: 1, priceMaximum: 1.00001, priceKind: 'range', currency: 'BGN' }, locale)
  assert.equal(tiny.split(number(.51)).length - 1, 2, 'keep both originally distinct bounds, even if both round to the same cent')
  assert.match(tiny, /–/)
})

test('derived conversion is idempotent, including canonical stored range metadata; EUR/other currencies are not converted', () => {
  const source = Object.freeze({ price: 80, currency: 'BGN', price_details: Object.freeze({ kind: 'range', maximum: 100, unit: 'процедура' }) })
  const once = servicePriceForDisplay(withServicePricing(source)), twice = servicePriceForDisplay(once)
  assert.deepEqual(twice, once)
  assert.equal(once.price, 40.90); assert.equal(once.priceMaximum, 51.13); assert.equal(once.price_details.maximum, 51.13)
  assert.equal(profileServicePrice(once, 'en'), profileServicePrice(source, 'en'))
  assert.equal(detailPriceLabel(once, 'en', { compact: true }), detailPriceLabel(withServicePricing(source), 'en', { compact: true }))
  assert.equal(source.price, 80); assert.equal(source.price_details.maximum, 100)
  for (const currency of ['EUR', 'USD', 'GBP']) {
    const unchanged = servicePriceForDisplay({ price: 80, currency })
    assert.equal(unchanged.price, 80); assert.equal(unchanged.currency, currency)
  }
  assert.match(detailPriceLabel({ price: 80, currency: 'USD' }, 'en'), /80/)
  assert.doesNotMatch(detailPriceLabel({ price: 80, currency: 'USD' }, 'en'), /€/)
  assert.equal(detailPriceLabel({ price: null, currency: 'BGN' }), null)
})

test('presentation replaces only obsolete currency audit narration and retains substantive conditions/source prose unchanged', () => {
  const description = 'Публикувано в лева; тарифата и валутата се потвърждават при записване. Косата се оценява след диагностика.'
  const source = Object.freeze({ price: 80, currency: 'BGN', description })
  const result = servicePresentation(source)
  assert.equal(result.description, 'Косата се оценява след диагностика.')
  assert.deepEqual(result.conditions, ['Преизчислено в евро по фиксирания курс'])
  assert.equal(source.description, description)
  const realTerms = 'Само при онлайн записване. Допълнителните материали са30лв. Не е единична цена.'
  assert.equal(servicePresentation({ price: 80, currency: 'BGN', description: realTerms }).description, realTerms, 'never regex-convert arbitrary factual prose or surcharges')
  assert.equal(servicePresentation({ price: 80, currency: 'EUR', description }).description, description)
  assert.equal(servicePresentation({ price: null, currency: 'BGN', description }).description, description)
})

test('EUR budget matches the derived price while source/API values and conservative FROM/unit/condition rules remain intact', () => {
  const source = Object.freeze({ price: 80, currency: 'BGN', name: 'Подстригване' })
  assert.equal(serviceFitsBudget(source, { currency: 'EUR', max: 50 }), true)
  assert.equal(serviceFitsBudget(source, { currency: 'EUR', max: 30 }), false)
  assert.equal(serviceFitsBudget(source, { currency: 'EUR', max: 40.90 }), true)
  assert.equal(serviceFitsBudget({ ...source, price_details: { kind: 'range', maximum: 100 } }, { currency: 'EUR', max: 50 }), false)
  assert.equal(serviceFitsBudget({ ...source, price_details: { kind: 'range', maximum: 100 } }, { currency: 'EUR', max: 52 }), true)
  for (const patch of [{ price_details: { kind: 'from' } }, { price_details: { unit: 'час' } }, { description: 'Само при онлайн записване.' }]) assert.equal(serviceFitsBudget({ ...source, ...patch }, { currency: 'EUR', max: 50 }), false)
  assert.equal(source.price, 80); assert.equal(source.currency, 'BGN')
  const mg = SOFIA_CATALOGUE.find(row => row.name === 'MG The Art of Beauty')
  const intent = { browse: true, searchV2: true, requirements: [], category: 'hair', service: 'Дамско подстригване', budget: { currency: 'EUR', max: 50 } }
  const rows = normalizeCatalogueBusinesses([mg], intent, { now: Date.parse('2026-11-11T12:00:00Z') })
  const actual = rows[0].services.find(service => service.name === 'Дамско подстригване, сешоар и стайлинг')
  assert.equal(actual.price, 80); assert.equal(actual.currency, 'BGN', 'catalogue API still preserves literal source amounts')
  assert.equal(profileServicePrice(actual, 'en'), '€40.90')
  assert.equal(normalizeCatalogueBusinesses([mg], { ...intent, budget: { currency: 'EUR', max: 30 } }, { now: Date.parse('2026-11-11T12:00:00Z') })[0]?.services.some(service => service.name === actual.name) || false, false)
})

test('all current catalogue BGN prices have derived EUR labels and none of the audited records or import payload values are rewritten', () => {
  const now = Date.parse('2026-11-11T12:00:00Z'), hash = () => createHash('sha256').update(JSON.stringify(SOFIA_CATALOGUE)).digest('hex'), before = hash()
  let converted = 0
  for (const record of SOFIA_CATALOGUE) {
    const details = catalogueBusinessDetails(record, now)
    for (const source of record.services.filter(service => service.price?.currency === 'BGN' && currentPublishedFact(service.price, now))) {
      const flat = details.services.find(service => service.name === source.name)
      for (const locale of ['bg', 'en']) { const label = detailPriceLabel(flat, locale); assert.match(label, /€/); assert.doesNotMatch(label, /BGN|лв/) }
      converted++
    }
  }
  assert.equal(converted, 46)
  const mg = SOFIA_CATALOGUE.find(row => row.name === 'MG The Art of Beauty'), dto = catalogueOnboardingDetail(SOFIA_CATALOGUE, mg.id, { now })
  const imported = normalizeImportedServices(dto.services), payload = servicesForApplication(imported)
  const importedHaircut = payload.find(service => service.name === 'Дамско подстригване, сешоар и стайлинг')
  assert.equal(importedHaircut.price, '80'); assert.equal(importedHaircut.currency, 'BGN')
  assert.equal(hash(), before, 'presentation must not change source fingerprints, currencies, dates or amounts')
})

test('legacy scalar helper and owner service overview share derived labels, not a raw BGN amount labelled EUR', async () => {
  assert.equal(servicePriceLabel(80, 'BGN', 'en'), '€40.90')
  assert.equal(servicePriceLabel(null, 'BGN', 'en'), 'Ask the business')
  const dashboard = await readFile(new URL('../app/dashboard/page.js', import.meta.url), 'utf8')
  assert.match(dashboard, /profileServicePrice\(service, locale\)/)
  assert.match(dashboard, /select\('id,name,description,duration_min,price,currency,price_details'\)/)
  assert.doesNotMatch(dashboard, /formatPrice\(service\.price|currency: 'EUR'/)
})
