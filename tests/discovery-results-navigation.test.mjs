import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { focusDiscoveryResults } from '../lib/discovery/results-navigation.mjs'

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
test('results navigation waits for the committed response, never loading or category/source toggles', async () => {
  const source = await read('components/discovery-search.js')
  assert.match(source, /if \(compact \|\| loading \|\| \(!result && !error\)\) return/)
  assert.match(source, /focusDiscoveryResults\(resultHeading.current, window.matchMedia/)
  assert.match(source, /\}, \[result, error, loading, compact\]\)/)
  assert.match(source, /cancelAnimationFrame\(frame\)/)
  assert.match(await read('app/solar.css'), /\.discovery-results-title \{ scroll-margin-block-start: 24px;/)
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
