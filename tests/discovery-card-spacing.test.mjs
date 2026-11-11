import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'

const baseCss = await readFile(new URL('../app/discovery-home.css', import.meta.url), 'utf8')
const photoCss = await readFile(new URL('../app/service-photo-surfaces.css', import.meta.url), 'utf8')
const fixtureSource = await readFile(new URL('../app/dev/business-cards/page.js', import.meta.url), 'utf8')
const withoutComments = value => value.replace(/\/\*[\s\S]*?\*\//g, '')
function declarations(css, selector) {
  const rules = [...withoutComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(match => match[1].split(',').some(value => value.trim() === selector))
  return Object.fromEntries(rules.flatMap(match => match[2].split(';').filter(value => value.trim()).map(value => {
    const separator = value.indexOf(':')
    return [value.slice(0, separator).trim(), value.slice(separator + 1).trim()]
  })))
}
const uniform = '.home-businesses[data-uniform-cards="true"]'

test('local cards use a modest shared floor and natural height, never the tallest off-screen sibling', () => {
  assert.equal(declarations(baseCss, '.home-businesses .home-discovery-rail')['align-items'], 'flex-start')
  assert.notEqual(declarations(baseCss, `${uniform} .home-discovery-rail`)['align-items'], 'stretch')
  const card = { ...declarations(baseCss, '.home-business-card'), ...declarations(baseCss, `${uniform} .home-business-card`) }
  assert.equal(card.display, 'flex')
  assert.equal(card['flex-direction'], 'column')
  assert.equal(card.height, 'auto', 'a percentage/fixed card height would recreate global stretching')
  const floor = card['min-height']?.match(/^(\d+(?:\.\d+)?)rem$/)
  assert.ok(floor && Number(floor[1]) >= 24 && Number(floor[1]) <= 30, 'compact floor may be calibrated, not an oversized fixed panel')
  assert.equal(card['max-height'], undefined, 'long cards must be allowed to grow')
  assert.equal(declarations(baseCss, `${uniform} .home-business-footer`)['margin-top'], 'auto', 'ordinary cards retain their shared action baseline')
  assert.equal(declarations(baseCss, `${uniform} .home-business-actions`)['margin-top'], 'auto', 'existing action alignment contract is preserved')
})

test('compact spacing introduces no clipping, ellipsis, internal scrolling or loss of shrinkable full price columns', () => {
  for (const selector of ['.home-business-card', '.home-business-services', `${uniform} .home-business-card`, `${uniform} .home-business-footer`]) {
    const rule = declarations(baseCss, selector)
    assert.doesNotMatch(rule.overflow || '', /hidden|clip|scroll|auto/, selector)
    assert.equal(rule['max-height'], undefined, selector)
  }
  const name = declarations(photoCss, '.home-business-services .home-service-name')
  assert.equal(name['-webkit-line-clamp'], 'unset')
  assert.equal(name.overflow, 'visible')
  assert.equal(name['white-space'], 'normal')
  assert.equal(declarations(photoCss, '.home-business-services > li')['grid-template-columns'], 'minmax(0,1fr) minmax(0,42%)')
  const price = declarations(photoCss, '.home-business-services .home-service-price')
  assert.equal(price['white-space'], 'normal')
  assert.equal(price['overflow-wrap'], 'anywhere')
  assert.equal(price['min-width'], '0')
  assert.equal(price['max-width'], '100%')
})

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = '../app/dev/business-cards/page.js'
const { code } = await transform(fixtureSource, {
  filename,
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
})
const Card = () => null, module = { exports: {} }
new Function('require', 'module', 'exports', code)(name => {
  if (name === 'next/navigation') return { notFound: () => { throw Error('LOCAL_FIXTURE_NOT_FOUND') } }
  if (name === '../../../components/discovery-business-card') return { DiscoveryBusinessCard: Card }
  if (name === '../../../lib/business-photos.mjs') return { getBusinessPhotos: () => [] }
  return require(name)
}, module, module.exports)
function elements(node, predicate, result = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, result))
  else if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node)
    elements(node.props.children, predicate, result)
  }
  return result
}
async function preview(locale) {
  const previous = process.env.NODE_ENV
  process.env.NODE_ENV = 'development'
  try { return await module.exports.default({ searchParams: Promise.resolve({ case: 'spacing', lang: locale }) }) }
  finally { process.env.NODE_ENV = previous }
}

for (const locale of ['bg', 'en']) {
  test(`${locale}: spacing preview starts with two short priced partners without reviews and places a long card beyond the initial neighbors`, async () => {
    const tree = await preview(locale), cards = elements(tree, node => node.type === Card)
    assert.equal(cards.length, 7)
    assert.equal(elements(tree, node => node.props['data-uniform-cards'] === 'true').length, 1)
    for (const [index, card] of cards.entries()) {
      assert.equal(card.props.preview, true, 'booking and review requests are disabled')
      assert.equal(card.props.nearby, true)
      assert.equal(card.props.row.source, 'gorez')
      assert.match(card.props.row.id, /^local-spacing-/)
      assert.deepEqual(card.props.row.reviews, { summary: { count: 0 }, items: [] })
      assert.equal(card.props.row.services.length, 2)
      assert.equal(card.props.row.photos, undefined, 'spacing fixture never presents production gallery photos')
      if (index < 2) {
        assert.ok(card.props.row.name.length < 30)
        assert.deepEqual(card.props.row.services.map(service => service.price), [30, 36])
        assert.ok(card.props.row.services.every(service => service.currency === 'EUR' && service.name.length < 15))
      }
    }
    const long = cards.at(-1).props.row
    assert.equal(long.id, 'local-spacing-long-offscreen')
    assert.ok(long.name.length > 80)
    assert.ok(long.services[0].name.length > 90)
    assert.equal(long.services[0].priceKind, 'range')
    assert.equal(long.services[0].priceMaximum, 1400)
    assert.ok(long.services.every(service => service.priceUnit.length > 40), 'mandatory full tariff qualifications exercise real wrapping')
    assert.equal(elements(tree, node => node.props['aria-label'] === 'Умишлено висок тестов блок').length, 0, 'spacing uses a real long card, not a synthetic height spacer')
  })
}

test('spacing fixture stays development-only, fictional and inert without provider scripts or requests', async () => {
  assert.match(fixtureSource, /NODE_ENV !== 'development'\) notFound\(\)/)
  assert.match(fixtureSource, /ДЕМО · измислени бизнеси, отзиви и разстояния/)
  assert.doesNotMatch(fixtureSource, /fetch\(|supabase\.from\(|loadPlacesLibrary|<script|trackProductEvent/)
  const previous = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  try { await assert.rejects(module.exports.default({ searchParams: Promise.resolve({ case: 'spacing' }) }), /LOCAL_FIXTURE_NOT_FOUND/) }
  finally { process.env.NODE_ENV = previous }
})
