import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import * as notices from '../lib/discovery/catalogue-attribution.mjs'
import * as official from '../lib/discovery/official-sofia-address-source.mjs'
import { cataloguePointCounts } from '../scripts/check-sofia-catalogue.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const code = (await transform(await readFile(new URL('../components/site-footer.js', import.meta.url), 'utf8'), {
  filename: 'components/site-footer.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
})).code
const mod = { exports: {} }
new Function('require', 'module', 'exports', code)(name => {
  if (name === 'next/link') return props => React.createElement('a', props)
  if (name.endsWith('/brand-logo')) return { BrandLogo: () => null }
  if (name.endsWith('/product-config.mjs')) return { SUPPORT_EMAIL: 'support@example.org' }
  if (name.endsWith('/product-measurement')) return { ProductMeasurement: () => null }
  if (name.endsWith('/catalogue-attribution.mjs')) return notices
  return require(name)
}, mod, mod.exports)

function elements(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, found))
  else if (React.isValidElement(node)) { if (predicate(node)) found.push(node); elements(node.props.children, predicate, found) }
  return found
}
const content = node => Array.isArray(node) ? node.map(content).join('') : React.isValidElement(node) ? content(node.props.children) : node == null || typeof node === 'boolean' ? '' : String(node)

test('public official notices reuse the source constants, while OSM remains a separate licence and credit', () => {
  assert.equal(notices.OFFICIAL_SOFIA_SOURCE_URL, official.OFFICIAL_SOFIA_SOURCE_URL)
  assert.equal(notices.OFFICIAL_SOFIA_LICENSE_URL, official.OFFICIAL_SOFIA_LICENSE_URL)
  assert.equal(notices.OFFICIAL_SOFIA_ATTRIBUTION, official.OFFICIAL_SOFIA_ATTRIBUTION)
  assert.equal(notices.OFFICIAL_SOFIA_PROCESSED_DATA_URL, '/catalogue-official-address-points-20261113.json')
  assert.equal(notices.OSM_ATTRIBUTION, '© OpenStreetMap contributors')
  assert.equal(notices.OSM_COPYRIGHT_URL, 'https://www.openstreetmap.org/copyright')
  assert.notEqual(notices.OFFICIAL_SOFIA_LICENSE_URL, notices.OSM_COPYRIGHT_URL)
})

test('the actual BG/EN compact and ordinary footers credit both sources once and link data without loading it', () => {
  for (const locale of ['bg', 'en']) for (const compact of [false, true]) {
    const tree = mod.exports.SiteFooter({ locale, compact })
    const credits = elements(tree, node => node.type === 'p' && node.props.className === 'site-location-credit')
    assert.equal(credits.length, 1)
    const links = elements(credits[0], node => node.type === 'a')
    assert.deepEqual(links.map(node => node.props.href), [notices.OSM_COPYRIGHT_URL, '/catalogue-location-data-20261106.json', notices.OFFICIAL_SOFIA_SOURCE_URL, notices.OFFICIAL_SOFIA_LICENSE_URL, notices.OFFICIAL_SOFIA_PROCESSED_DATA_URL])
    assert.equal(links.filter(node => content(node) === notices.OSM_ATTRIBUTION).length, 1)
    assert.equal(links.filter(node => content(node) === notices.OFFICIAL_SOFIA_ATTRIBUTION).length, 1)
    assert.equal(content(links[3]), 'CC BY 4.0')
    assert.match(content(links[4]), locale === 'en' ? /processed by GoRez/ : /обработени от GoRez/)
    assert.ok(links.every(node => node.props.target === '_blank' && node.props.rel === 'noopener noreferrer'))
    assert.ok(!elements(credits[0], node => node.type === 'iframe' || node.type === 'img' || node.type === 'script').length)
  }
})

test('public notice imports contain no dataset, index, geocoder, credential or browser-fetch path', async () => {
  for (const path of ['../components/site-footer.js', '../lib/discovery/catalogue-attribution.mjs', '../lib/discovery/official-sofia-address-source.mjs']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /import[^\n]*\.json|fetch\s*\(|process\.env|createOfficialSofiaAddressIndex|SOFIA_CATALOGUE|125245|nominatim/)
  }
})

test('offline reporting counts official points separately without reclassifying owner or OSM points', () => {
  const records = [{ coordinates: { method: 'first_party_coordinates' } }, { coordinates: { method: 'verified_address_geocode' } }, { coordinates: { method: 'verified_official_address' } }, { coordinates: { method: 'verified_official_address' } }, { coordinates: null }, {}]
  const before = JSON.stringify(records)
  assert.deepEqual(cataloguePointCounts(records), { firstParty: 1, reviewedOsm: 1, officialSofia: 2 })
  assert.equal(JSON.stringify(records), before)
})
