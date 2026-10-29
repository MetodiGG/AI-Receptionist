import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { readDirectoryRows } from '../lib/public-directory.mjs'

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
function database(rows, failAt = -1) {
  const calls = []
  return { calls, from(table) {
    const call = { table, filters: [], orders: [] }; calls.push(call)
    const query = {
      select(fields) { call.fields = fields; return query },
      eq(...filter) { call.filters.push(filter); return query },
      order(field) { call.orders.push(field); return query },
      async range(start, end) {
        call.range = [start, end]
        if (start === failAt) return { data: null, error: new Error('DATABASE_UNAVAILABLE') }
        return { data: rows.filter(row => call.filters.every(([field, value]) => row[field] === value)).slice(start, end + 1), error: null }
      },
    }
    return query
  } }
}

test('partners are all published active GoRez businesses, including beyond the default database row limit', async () => {
  const rows = Array.from({ length: 1103 }, (_, id) => ({ id: String(id), name: `Business ${id}`, active: true, platform_status: 'enabled' }))
  const db = database([...rows, { id: 'inactive', active: false, platform_status: 'enabled' }, { id: 'pending', active: true, platform_status: 'pending' }, { id: 'disabled', active: true, platform_status: 'disabled' }])
  assert.deepEqual(await readDirectoryRows(db), rows)
  assert.deepEqual(db.calls.map(call => call.range), [[0, 499], [500, 999], [1000, 1499]])
  for (const call of db.calls) {
    assert.equal(call.table, 'businesses')
    assert.deepEqual(call.filters, [['active', true], ['platform_status', 'enabled']])
    assert.deepEqual(call.orders, ['name', 'id'])
    assert.doesNotMatch(call.fields, /\*|owner_id|contact_email|public_profile|token|bot_instructions|customers|appointments/)
  }
})

test('empty partners and database failures never produce invented or misleading partial lists', async () => {
  assert.deepEqual(await readDirectoryRows(database([])), [])
  const rows = Array.from({ length: 500 }, () => ({ active: true, platform_status: 'enabled' }))
  await assert.rejects(readDirectoryRows(database(rows, 500)), /DATABASE_UNAVAILABLE/)
})

test('the localized partners link follows Terms, while the homepage stays AI-only', async () => {
  const footer = await read('components/site-footer.js'), home = await read('components/home-page.js')
  assert.match(footer, /href=\{`\/terms\?lang=\$\{locale\}`\}[\s\S]*?<\/Link><Link href=\{`\/partners\?lang=\$\{locale\}`\}>\{en \? 'GoRez partners' : 'GoRez партньори'\}/)
  assert.doesNotMatch(home, /BusinessDirectory|PartnersPage|useDirectory/)
  assert.match(await read('app/sitemap.js'), /'\/partners'/)
})

test('partners reuses real public cards, images and booking links without search fees or forced city filters', async () => {
  const page = await read('app/partners/page.js'), ui = await read('components/partners-page.js'), cards = await read('components/business-directory.js'), api = await read('app/api/public/businesses/route.js')
  assert.match(page, /await searchParams/)
  assert.match(page, /pageMetadata\('\/partners'/)
  assert.match(ui, /<MarketingNavigation locale=\{locale\} setLocale=\{setLocale\}/)
  assert.match(ui, /<BusinessDirectory locale=\{locale\} partners showFilters=\{false\}/)
  assert.match(ui, /usePublicLocale\(initialLocale, true\)/)
  assert.doesNotMatch(ui, /initialFilters|preview|mock|google|DiscoverySearch|supabase-admin/)
  assert.match(cards, /'GoRez partners' : 'GoRez партньори'/)
  assert.match(cards, /BusinessPhotoGallery photos=\{row\.photos\}/)
  assert.match(cards, /href=\{`\/book\/\$\{row\.slug\}\?lang=\$\{locale\}`\}/)
  assert.match(api, /consumeRateLimit[\s\S]*scope: 'business-directory'/)
  assert.match(api, /readDirectoryRows\(supabase\)/)
  assert.match(api, /'Cache-Control': 'no-store'/)
  assert.match(api, /filter\(\(service\) => service\.active\)/)
})
