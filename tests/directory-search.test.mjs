import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { directorySearchFilters, directorySearchHref, EMPTY_DIRECTORY_FILTERS, filterDirectory } from '../lib/directory.mjs'

test('homepage choices round-trip to a local results URL with locale and Cyrillic preserved', () => {
  const filters = { service: 'маникюр', city: 'София', neighborhood: 'Център' }
  for (const locale of ['bg', 'en']) {
    const url = new URL(directorySearchHref(filters, locale), 'https://www.gorez.co')
    assert.equal(url.pathname, '/businesses'); assert.equal(url.searchParams.get('lang'), locale)
    assert.deepEqual(directorySearchFilters(Object.fromEntries(url.searchParams)), filters)
    assert.equal(url.hash, '')
  }
  assert.equal(directorySearchHref(), '/businesses?lang=bg')
  assert.equal(directorySearchHref(EMPTY_DIRECTORY_FILTERS, 'unsupported'), '/businesses?lang=bg')
})

test('search parameters are bounded, whitelisted and never introduce an external destination', () => {
  const params = { service: '  Haircut  ', city: ['invalid', 'duplicate'], neighborhood: 'orphan', redirect: 'https://evil.example', owner_id: 'forged' }
  assert.deepEqual(directorySearchFilters(params), { service: 'haircut', city: '', neighborhood: '' })
  const url = new URL(directorySearchHref({ service: 'x'.repeat(1000), city: 'Sofia & city=Other', neighborhood: 'A/B?lang=other' }), 'https://www.gorez.co')
  assert.equal(url.origin, 'https://www.gorez.co')
  assert.equal(url.searchParams.get('service').length, 160)
  assert.equal(url.searchParams.get('city'), 'Sofia & city=Other')
  assert.equal(url.searchParams.get('neighborhood'), 'A/B?lang=other')
  assert.equal(url.searchParams.get('lang'), 'bg')
  assert.equal(url.searchParams.has('redirect'), false)
})

test('the selected service/location continue filtering real results after navigation', () => {
  const rows = [{ id: 'one', city: 'София', neighborhood: 'Център', services: [{ name: 'Маникюр' }, { name: 'Подстригване' }] }, { id: 'two', city: 'София', neighborhood: 'Лозенец', services: [{ name: 'Маникюр' }] }]
  const url = new URL(directorySearchHref({ service: 'Маникюр', city: 'София', neighborhood: 'Център' }), 'https://www.gorez.co')
  const results = filterDirectory(rows, directorySearchFilters(Object.fromEntries(url.searchParams)))
  assert.equal(results.length, 1); assert.equal(results[0].id, 'one')
  assert.deepEqual(results[0].services.map(service => service.name), ['Маникюр'])
})

test('home has no result cards; its finder, account actions and all booking entry links remain usable', async () => {
  const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
  const home = await read('components/home-page.js')
  assert.doesNotMatch(home, /BusinessDirectory|directory-business-card|id="clients"/)
  assert.match(home, /id="find-appointment"/)
  assert.match(home, /href=\{directorySearchHref\(filters, locale\)\}/)
  assert.match(home, /url\.hash === '#clients'/)
  assert.match(home, /<BookingStory/); assert.match(home, /home-client-profile/)
  assert.equal((home.match(/Добави бизнеса си/g) || []).length, 1)
  for (const path of ['components/marketing-navigation.js', 'components/site-footer.js', 'components/customer-account.js']) {
    const source = await read(path)
    assert.match(source, /\/businesses\?lang=/)
    assert.doesNotMatch(source, /#clients/)
  }
  const search = await read('components/business-search-page.js'), page = await read('app/businesses/page.js')
  assert.match(search, /<BusinessDirectory locale=\{locale\} filters=\{filters\}/)
  assert.match(search, /window\.history\.replaceState/)
  assert.match(page, /await searchParams/); assert.match(page, /pageMetadata\('\/businesses'/)
  assert.match(await read('components/business-directory.js'), /<h1 id="directory-title"/)
  assert.match(await read('app/sitemap.js'), /'\/businesses'/)
})
