import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { focusDiscoveryResults, focusDiscoverySubcategories, focusFirstDiscoveryBusiness } from '../lib/discovery/results-navigation.mjs'

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
test('completed search focuses the results heading then scrolls it into view', () => {
  const calls = [], heading = { focus: value => calls.push(['focus', value]), scrollIntoView: value => calls.push(['scroll', value]) }
  assert.equal(focusDiscoveryResults(heading), true)
  assert.deepEqual(calls, [['focus', { preventScroll: true }], ['scroll', { behavior: 'smooth', block: 'start', inline: 'nearest' }]])
})
test('reduced motion jumps directly, and an unmounted result is ignored', () => {
  let behavior
  assert.equal(focusDiscoveryResults({ focus() {}, scrollIntoView(value) { behavior = value.behavior } }, true), true)
  assert.equal(behavior, 'instant'); assert.equal(focusDiscoveryResults(null), false)
})
test('results navigation waits for a committed user search and never jumps on initial automatic browsing', async () => {
  const source = await read('components/discovery-search.js')
  assert.match(source, /if \(compact \|\| loading \|\| !scrollAfterSearch.current \|\| \(!result && !error\)\) return/)
  assert.match(source, /search\(input, \{ navigate: Boolean\(initial\) \}\)/)
  assert.match(source, /focusDiscoveryResults\(resultHeading.current, reduceMotion\)/)
  assert.match(source, /scrollAfterSearch.current = false/)
  assert.match(source, /\}, \[result, error, loading, compact\]\)/)
  assert.match(source, /cancelAnimationFrame\(frame\)/)
  assert.match(await read('app/solar.css'), /\.discovery-results-title \{ scroll-margin-block-start: 24px;/)
})

test('a chosen category focuses and reveals its committed children with reduced-motion support', () => {
  for (const reduced of [false, true]) {
    const calls = [], section = { focus: options => calls.push(['focus', options]), scrollIntoView: options => calls.push(['scroll', options]) }
    assert.equal(focusDiscoverySubcategories(section, reduced), true)
    assert.deepEqual(calls, [['focus', { preventScroll: true }], ['scroll', { behavior: reduced ? 'instant' : 'smooth', block: 'start', inline: 'nearest' }]])
  }
  assert.equal(focusDiscoverySubcategories(null), false)
})

test('a chosen subcategory scrolls to the first actual business and focuses its real control', () => {
  const calls = [], first = { querySelector(selector) { assert.equal(selector, 'a[href], button:not(:disabled)'); return { focus: value => calls.push(['focus', value]) } }, scrollIntoView: value => calls.push(['scroll', value]) }
  const heading = { closest(selector) { assert.equal(selector, '.home-businesses'); return { querySelector(selector) { assert.equal(selector, '.home-business-grid > li:first-child'); return first } } } }
  assert.equal(focusFirstDiscoveryBusiness(heading), true)
  assert.deepEqual(calls, [['focus', { preventScroll: true }], ['scroll', { behavior: 'smooth', block: 'start', inline: 'nearest' }]])
})

test('empty results or unmounted cards use the result heading, not a fabricated first business', () => {
  const calls = [], heading = { closest: () => ({ querySelector: () => null }), focus() { calls.push('focus') }, scrollIntoView(options) { calls.push(options.behavior) } }
  assert.equal(focusFirstDiscoveryBusiness(heading, true), true)
  assert.deepEqual(calls, ['focus', 'instant'])
  assert.equal(focusFirstDiscoveryBusiness(null), false)
})
test('automatic results scrolling cannot reveal or bill the farther widget without actual scroll intent', async () => {
  const source = await read('components/discovery-nearby-more.js')
  assert.match(source, /let startY = null/)
  assert.match(source, /startY !== null && window.scrollY > startY \+ 120/)
  assert.match(source, /addEventListener\('wheel', onWheel/)
  assert.match(source, /addEventListener\('touchmove', onTouchMove/)
  assert.match(source, /addEventListener\('keydown', onKey/)
  assert.match(source, /removeEventListener\('keydown', onKey\)/)
})
