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
function elements(node, predicate, values = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, values))
  else if (React.isValidElement(node)) { if (predicate(node)) values.push(node); elements(node.props.children, predicate, values) }
  return values
}
const rows = tree => elements(tree, node => node.type === Card).map(node => node.props.row)
const expand = tree => elements(tree.props.footer, node => node.props.className === 'home-business-show-more')[0]
const result = (ids = ['hair-first', 'hair-second', 'hair-third'], patch = {}) => ({ results: ids.map(id => Object.freeze({ id, source: 'catalogue', name: id })), externalStatus: 'catalogue', checkedAt: 'first', cataloguePage: { nextOffset: null }, ...patch })

// Run the actual client renderer with hook-state persistence. Network, cards,
// and the list are boundaries; the real ranking/copy helpers stay in use.
function fixture(patch = {}) {
  const slots = [], effects = [], props = { locale: 'bg', filters: { cityCode: '68134', category: 'hair' }, initialPreview: true, resultKey: 'entry-hair', result: result(), directoryEnabled: false, ...patch }
  let index = 0, dirty = false, tree
  const stubs = {
    react: { ...React,
      useState(initial) { const at = index++; slots[at] ||= { value: initial }; return [slots[at].value, value => { if (!Object.is(value, slots[at].value)) { slots[at].value = value; dirty = true } }] },
      useMemo: fn => fn(),
      useEffect(create, deps) { const at = index++; if (!slots[at] || deps.some((dep, i) => !Object.is(dep, slots[at].deps[i]))) { slots[at] = { deps }; effects.push(create) } },
    },
    'next/link': () => null, 'next/dynamic': () => () => null,
    './brand-loading': { BrandLoading: () => null }, './icon': { Icon: () => null },
    './discovery-business-list': { DiscoveryBusinessList: List }, './discovery-business-card': { DiscoveryBusinessCard: Card },
    '../hooks/use-directory': { useDirectory: () => ({ businesses: [], status: 'ready' }) },
    '../lib/discovery/home.mjs': home, '../lib/discovery/rail.mjs': rail,
    '../lib/discovery/copy.mjs': copy, '../lib/discovery/distance-origin.mjs': distanceOrigin,
  }
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name in stubs ? stubs[name] : require(name), module, module.exports)
  function render() { index = 0; dirty = false; tree = module.exports.DiscoveryHomeBusinesses(props); return tree }
  function flush() { let turns = 0; while (dirty || effects.length) { assert.ok(++turns < 20); while (effects.length) effects.shift()(); if (dirty) render() } return tree }
  render(); flush()
  return { get tree() { return tree }, props, update(patch) { Object.assign(props, patch); render(); return flush() }, expand() { expand(tree).props.onClick(); return flush() } }
}

for (const [locale, label] of [['bg', 'Още бизнеси'], ['en', 'More businesses']]) test(`${locale}: first visit shows the actual first ranked business, with explicit expansion and no automatic advance`, () => {
  const current = result(), f = fixture({ locale, result: current }), initial = f.tree
  assert.equal(initial.type, List)
  assert.deepEqual(rows(initial).map(row => row.id), ['hair-first'])
  assert.equal(rows(initial)[0], current.results[0], 'the real row object and booking identifiers are preserved')
  assert.equal(current.results.length, 3, 'the source result set is not truncated')
  assert.equal(initial.props.onNearEnd, undefined, 'the list cannot install its automatic observer while collapsed')
  assert.equal(initial.props.hasMore, true, 'the list cannot claim all businesses are loaded while two rows are hidden')
  assert.equal(expand(initial).props.children[0], label)
  assert.equal(expand(initial).props.type, 'button')
  const expanded = f.expand()
  assert.deepEqual(rows(expanded).map(row => row.id), ['hair-first', 'hair-second', 'hair-third'])
  assert.equal(expand(expanded), undefined)
  assert.equal(expanded.props.hasMore, false, 'a fully expanded finite result set is now complete')
})

test('expanding a one-row first page restores real pagination instead of generating or guessing additional rows', () => {
  let pages = 0
  const f = fixture({ result: result(['real-first'], { cataloguePage: { nextOffset: 1 } }), onLoadMore: () => pages++ })
  assert.equal(f.tree.props.onNearEnd, undefined)
  assert.ok(expand(f.tree))
  f.expand()
  assert.equal(typeof f.tree.props.onNearEnd, 'function')
  assert.equal(pages, 0, 'the visible button only expands; the existing paging mechanism remains authoritative')
  f.tree.props.onNearEnd()
  assert.equal(pages, 1)
  f.update({ result: result(['real-first', 'real-next'], { checkedAt: 'next-page' }) })
  assert.deepEqual(rows(f.tree).map(row => row.id), ['real-first', 'real-next'])
  assert.equal(expand(f.tree), undefined, 'a response timestamp change does not collapse the expanded session')
})

test('an explicit category/filter change immediately restores the full vertical result set', () => {
  const f = fixture()
  const tree = f.update({ initialPreview: false, result: result(['nails-first', 'nails-second']), resultKey: 'nails-search' })
  assert.deepEqual(rows(tree).map(row => row.id), ['nails-first', 'nails-second'])
  assert.equal(expand(tree), undefined)
  const normal = fixture({ initialPreview: undefined })
  assert.equal(rows(normal.tree).length, 3, 'other callers retain the non-preview default')
})

test('a genuine one-business result has no unnecessary show-more action, and an empty catalogue remains an empty state', () => {
  const only = fixture({ result: result(['only-real-business']) })
  assert.equal(rows(only.tree).length, 1)
  assert.equal(expand(only.tree), undefined)
  assert.equal(only.tree.props.hasMore, false)
  const empty = fixture({ result: result([]) })
  assert.equal(rows(empty.tree).length, 0)
  assert.equal(expand(empty.tree), undefined)
  assert.ok(elements(empty.tree.props.message, node => node.props.className === 'home-browse-empty').length)
})

test('loading, technical errors and clarifications keep their existing feedback and do not reveal a misleading expansion action', () => {
  for (const patch of [{ loading: true }, { error: 'SEARCH_UNAVAILABLE' }, { result: result([], { clarification: { message: 'Избери услуга' } }) }]) {
    const f = fixture(patch)
    assert.equal(expand(f.tree), undefined)
    assert.ok(React.isValidElement(f.tree.props.message))
  }
  const retry = () => {}, f = fixture({ moreError: 'SEARCH_UNAVAILABLE', onLoadMore: retry })
  const retryButton = elements(f.tree.props.footer, node => node.type === 'button' && node.props.className === 'secondary-button')[0]
  assert.equal(retryButton.props.onClick, retry)
  assert.equal(f.tree.props.onNearEnd, undefined)
})
