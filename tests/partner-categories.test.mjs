import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { INDUSTRY_KEYS, getIndustryLabel } from '../lib/public-locale.mjs'
import { partnerIndustry, partnerCategories, partnerCategorySelection, partnersInCategory, partnerCategoryHref } from '../lib/partner-categories.mjs'

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
const businesses = Object.freeze([
  Object.freeze({ id: 'hair', industry: 'beauty', name: 'Salon' }),
  Object.freeze({ id: 'repair', industry: 'auto', name: 'Garage' }),
  Object.freeze({ id: 'nails', industry: 'beauty', name: 'Studio' }),
  Object.freeze({ id: 'sport', industry: 'fitness', name: 'Court' }),
])

test('partner categories use exact onboarding labels and accurate counts, not a hardcoded catalogue', () => {
  assert.deepEqual(partnerCategories(businesses), [
    { id: 'beauty', label: 'Бръснарници и красота', count: 2 },
    { id: 'auto', label: 'Автосервизи', count: 1 },
    { id: 'fitness', label: 'Спорт', count: 1 },
  ])
  assert.deepEqual(partnerCategories([]), [])
  for (const locale of ['bg', 'en']) {
    const rows = INDUSTRY_KEYS.map(industry => ({ industry }))
    assert.deepEqual(partnerCategories(rows, locale).map(row => row.label), INDUSTRY_KEYS.map(id => getIndustryLabel(id, locale)))
  }
})

test('category clicks include every matching partner and never unrelated businesses', () => {
  assert.deepEqual(partnersInCategory(businesses, 'beauty').map(row => row.id), ['hair', 'nails'])
  assert.deepEqual(partnersInCategory(businesses, 'auto').map(row => row.id), ['repair'])
  assert.deepEqual(partnersInCategory(businesses, 'education'), [])
  assert.deepEqual(partnersInCategory(businesses, 'all'), businesses)
  assert.deepEqual(partnersInCategory(businesses), [])
  const many = Array.from({ length: 1103 }, (_, id) => ({ id, industry: id % 2 ? 'auto' : 'beauty' }))
  assert.equal(partnerCategories(many).reduce((total, row) => total + row.count, 0), 1103)
  assert.equal(partnersInCategory(many, 'beauty').length, 552)
})

test('new businesses automatically appear in their category without modifying existing rows', () => {
  const next = [...businesses, { id: 'pet', industry: 'pets' }]
  assert.equal(partnerCategories(next).find(row => row.id === 'pets').count, 1)
  assert.equal(partnerCategories(businesses).some(row => row.id === 'pets'), false)
  assert.equal(businesses.length, 4)
})

test('unrecognized industries remain discoverable under Other, including prototype-like strings', () => {
  const legacy = [null, undefined, '', 'new-industry', '__proto__', 'constructor', 'toString'].map((industry, id) => ({ id, industry }))
  assert.deepEqual(partnerCategories(legacy), [{ id: 'other', label: 'Други услуги', count: legacy.length }])
  assert.deepEqual(partnersInCategory(legacy, 'other'), legacy)
  for (const row of legacy) assert.equal(partnerIndustry(row.industry), 'other')
})

test('URL selection accepts only known categories and supports shareable localized links', () => {
  for (const category of [...INDUSTRY_KEYS, 'all']) {
    assert.equal(partnerCategorySelection(category), category)
    assert.equal(partnerCategoryHref(category, 'en'), `/partners?lang=en&category=${category}`)
  }
  for (const invalid of [undefined, null, [], ['auto'], {}, 'constructor', 'BEAUTY', 'https://example.com', '<script>']) {
    assert.equal(partnerCategorySelection(invalid), '')
    assert.equal(partnerCategoryHref(invalid, 'invalid'), '/partners?lang=bg')
  }
  assert.equal(partnerCategoryHref('', 'bg'), '/partners?lang=bg')
  assert.equal(partnerCategoryHref('auto', 'bg', '//evil.example'), '/partners?lang=bg&category=auto')
})

test('category-first browsing is opt-in, uses real partner cards and does not add paid searches or database writes', async () => {
  const ui = await read('components/partner-categories.js')
  const page = await read('app/partners/page.js')
  const cards = await read('components/business-directory.js')
  const locale = await read('hooks/use-public-locale.js')
  assert.match(cards, /browseCategories = partners && categoryBrowsing/)
  assert.match(cards, /!showCategoryOverview && <div className="directory-results-grid"/)
  assert.match(ui, /aria-label=\{en \? 'Partner categories' : 'Категории партньори'\}/)
  assert.match(ui, /prefetch=\{false\}/)
  assert.match(page, /partnerCategorySelection\(params\?\.category\)/)
  assert.match(locale, /url\.searchParams\.set\('lang', nextLocale\)/)
  assert.doesNotMatch(ui, /fetch\(|supabase|google|DiscoverySearch|localStorage/)
})

test('QA fixture is unavailable unless development mock mode is explicitly enabled', async () => {
  const fixture = await read('app/dev/partner-categories/page.js')
  const preview = await read('app/dev/partner-categories/preview.js')
  assert.match(fixture, /if \(!discoveryConfig\(process\.env\)\.devMock\) notFound\(\)/)
  assert.match(fixture, /Измислен пример/)
  assert.match(preview, /bookingDisabled categoryBrowsing/)
  assert.doesNotMatch(fixture + preview, /supabase|googleapis|\/api\/public\/discovery|sendEmail/)
})
