import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import * as home from '../lib/discovery/home.mjs'
import * as rail from '../lib/discovery/rail.mjs'
import * as copy from '../lib/discovery/copy.mjs'
import * as distanceOrigin from '../lib/discovery/distance-origin.mjs'

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = 'components/discovery-home-browse.js'
const { code } = await transform(await readFile(new URL(`../${filename}`, import.meta.url), 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
function Card() { return null }
function List() { return null }
const stubs = {
  react: { ...React, useEffect() {}, useMemo: fn => fn(), useState: initial => [initial, () => {}] },
  'next/link': () => null, 'next/dynamic': () => () => null,
  './brand-loading': { BrandLoading: () => null }, './icon': { Icon: () => null },
  './discovery-business-list': { DiscoveryBusinessList: List }, './discovery-business-card': { DiscoveryBusinessCard: Card },
  '../hooks/use-directory': { useDirectory: () => ({ businesses: [], status: 'ready' }) },
  '../lib/discovery/home.mjs': home, '../lib/discovery/rail.mjs': rail,
  '../lib/discovery/copy.mjs': copy, '../lib/discovery/distance-origin.mjs': distanceOrigin,
}
const module = { exports: {} }
new Function('require', 'module', 'exports', code)(name => name in stubs ? stubs[name] : require(name), module, module.exports)
function renderedRows(node, rows = []) {
  if (Array.isArray(node)) node.forEach(child => renderedRows(child, rows))
  else if (React.isValidElement(node)) { if (node.type === Card) rows.push(node.props.row.id); renderedRows(node.props.children, rows) }
  return rows
}
const row = (id, proximityBand, source = 'catalogue') => ({ id, source, name: id, proximityBand })
const render = result => module.exports.DiscoveryHomeBusinesses({ locale: 'bg', filters: { cityCode: '68134' }, result, directoryEnabled: false })

for (const externalStatus of ['catalogue', 'sofia_only']) test(`actual homepage renderer preserves globally ranked relevance across distance bands in ${externalStatus}`, () => {
  const results = [row('exact-farther', 'further'), row('strong-near', 'primary', 'gorez'), row('related-farther', 'further'), row('weak-near', 'primary')]
  const tree = render({ results, externalStatus })
  assert.equal(tree.type, List)
  assert.deepEqual(renderedRows(tree), results.map(item => item.id))
  assert.equal(tree.props.hasMore, false, 'a distance band cannot hide an already accepted catalogue result')
})

test('actual homepage renderer retains the legacy Google primary/further disclosure boundary', () => {
  const tree = render({ results: [row('farther', 'further', 'gorez'), row('near', 'primary', 'gorez')], externalStatus: 'ready' })
  assert.deepEqual(renderedRows(tree), ['near'])
  assert.equal(tree.props.hasMore, true)
  assert.equal(typeof tree.props.onNearEnd, 'function')
})
