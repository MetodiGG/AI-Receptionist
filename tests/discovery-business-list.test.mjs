import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as pagination from '../lib/discovery/list-pagination.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const source = await readFile(new URL('../components/discovery-business-list.js', import.meta.url), 'utf8')
const { code } = await transform(source, {
  filename: 'discovery-business-list.js',
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
})
const sameDependencies = (before, after) => before && after && before.length === after.length && before.every((value, index) => Object.is(value, after[index]))
function elements(node, predicate, result = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, result))
  else if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node)
    elements(node.props.children, predicate, result)
  }
  return result
}

// Actual SWC-compiled client component and actual pagination helpers, with only
// hooks and browser transport replaced. Refs commit before effects as in React.
function listHarness() {
  const hooks = [], observers = [], sentinel = {}, stubs = {}
  let index = 0, pending = [], props, tree
  const env = {
    IntersectionObserver: class {
      constructor(callback, options) { this.callback = callback; this.options = options; this.observed = []; this.disconnected = 0; observers.push(this) }
      observe(node) { this.observed.push(node) }
      disconnect() { this.disconnected++ }
    },
  }
  stubs.react = {
    ...React,
    useId() { const slot = index++; return `business-list-${slot}` },
    useRef(initial) { const slot = index++; return (hooks[slot] ||= { current: initial }) },
    useEffect(create, dependencies) {
      const slot = index++
      if (!hooks[slot] || !sameDependencies(hooks[slot].dependencies, dependencies)) pending.push({ slot, create, dependencies })
    },
  }
  stubs['../lib/discovery/list-pagination.mjs'] = pagination
  const module = { exports: {} }
  new Function('require', 'module', 'exports', 'window', code)(name => name in stubs ? stubs[name] : require(name), module, module.exports, env)
  function commit() {
    const effects = pending; pending = []
    for (const effect of effects) hooks[effect.slot]?.cleanup?.()
    for (const effect of effects) hooks[effect.slot] = { dependencies: effect.dependencies, cleanup: effect.create() }
  }
  return {
    observers, sentinel,
    render(next, { deferEffects = false } = {}) {
      props = next; index = 0; pending = []
      tree = module.exports.DiscoveryBusinessList(props)
      const end = elements(tree, node => node.props.className === 'home-business-list-end')[0]
      end.props.ref.current = sentinel
      if (!deferEffects) commit()
      return tree
    },
    commit,
    intersect(observer = observers.at(-1)) { observer.callback([{ target: sentinel, isIntersecting: true }]) },
    dispose() { for (const hook of hooks) hook?.cleanup?.() },
  }
}
const loadButton = tree => elements(tree, node => node.type === 'button' && node.props.className === 'home-business-list-keyboard-load')[0]
const base = {
  title: 'Разгледай бизнеси', hasMore: true, resetKey: 'search-1', pageKey: 'page-1',
  children: [React.createElement('li', { key: 'first' }, 'Първи бизнес'), React.createElement('li', { key: 'second' }, 'Втори бизнес')],
}

test('actual list preserves semantic section/list structure, child order and accessible heading/action references', () => {
  const h = listHarness(), headingRef = { current: null }, action = React.createElement('a', { href: '#all' }, 'Всички')
  try {
    const tree = h.render({ ...base, headingRef, action, message: React.createElement('p', {}, 'Информация'), footer: React.createElement('p', {}, 'Край'), onNearEnd: () => {} })
    assert.equal(tree.type, 'section'); assert.equal(tree.props['data-layout'], 'vertical'); assert.equal(tree.props['aria-busy'], false)
    const heading = elements(tree, node => node.type === 'h2')[0]
    const list = elements(tree, node => node.type === 'ul')[0]
    assert.equal(tree.props['aria-labelledby'], heading.props.id)
    assert.equal(heading.props.ref, headingRef); assert.equal(heading.props.tabIndex, -1)
    assert.equal(list.props.className, 'home-business-grid'); assert.equal(list.props.role, 'list'); assert.equal(list.props['aria-label'], base.title)
    assert.deepEqual(elements(list, node => node.type === 'li').map(node => node.props.children), ['Първи бизнес', 'Втори бизнес'])
    assert.equal(loadButton(tree).props['aria-controls'], list.props.id)
    assert.equal(loadButton(tree).props.type, 'button')
    assert.equal(loadButton(tree).props['aria-disabled'], false); assert.equal(loadButton(tree).props.tabIndex, 0)
    assert.equal(loadButton(tree).props.children, 'Зареди следващите бизнеси')
    const end = elements(tree, node => node.props.className === 'home-business-list-end')[0]
    assert.equal(end.props['aria-hidden'], 'true')
    const html = renderToStaticMarkup(tree)
    assert.match(html, /<ul/); assert.match(html, /<li>Първи бизнес<\/li><li>Втори бизнес<\/li>/)
    assert.match(html, /Информация/); assert.match(html, /Край/); assert.match(html, /href="#all"/)
    assert.doesNotMatch(html, /home-discovery-rail|home-rail-arrows|overflow-x/)
    assert.equal(h.observers.length, 1)
    assert.deepEqual(h.observers[0].observed, [h.sentinel])
  } finally { h.dispose() }
})

test('actual list shares one synchronous duplicate gate between observer events and the keyboard action', () => {
  const h = listHarness()
  let calls = 0
  try {
    const tree = h.render({ ...base, onNearEnd: () => calls++ })
    h.intersect(); h.intersect(); loadButton(tree).props.onClick(); h.intersect()
    assert.equal(calls, 1)
  } finally { h.dispose() }
})

test('same-key callback changes use the latest callback without re-registering the observer', () => {
  const h = listHarness(), calls = []
  try {
    h.render({ ...base, onNearEnd: () => calls.push('old') })
    const observer = h.observers[0]
    h.render({ ...base, onNearEnd: () => calls.push('latest') })
    assert.equal(h.observers.length, 1); assert.equal(observer.disconnected, 0)
    h.intersect(observer)
    assert.deepEqual(calls, ['latest'])
  } finally { h.dispose() }
})

test('new page cursors and result generations permit one request each; stale closures cannot load another generation', () => {
  const h = listHarness(), calls = []
  try {
    const firstTree = h.render({ ...base, onNearEnd: () => calls.push('first') })
    const firstObserver = h.observers[0], firstAction = loadButton(firstTree).props.onClick
    firstAction()
    const nextTree = h.render({ ...base, pageKey: 'page-2', onNearEnd: () => calls.push('second') }, { deferEffects: true })
    h.intersect(firstObserver); firstAction()
    assert.deepEqual(calls, ['first'], 'old observer/button closures are ignored even before effect cleanup')
    h.commit()
    assert.equal(firstObserver.disconnected, 1); assert.equal(h.observers.length, 2)
    h.intersect(); loadButton(nextTree).props.onClick()
    assert.deepEqual(calls, ['first', 'second'])
    h.render({ ...base, resetKey: 'search-2', onNearEnd: () => calls.push('new-search') })
    h.intersect(); h.intersect()
    assert.deepEqual(calls, ['first', 'second', 'new-search'])
    h.intersect(firstObserver)
    assert.equal(calls.length, 3)
  } finally { h.dispose() }
})

test('loading disables advancing immediately, unregisters observation and keeps existing businesses visible', () => {
  const h = listHarness()
  let calls = 0
  try {
    const first = h.render({ ...base, onNearEnd: () => calls++ })
    const observer = h.observers[0], action = loadButton(first).props.onClick
    const busy = h.render({ ...base, onNearEnd: () => calls++, busy: true, pending: true }, { deferEffects: true })
    h.intersect(observer); action()
    assert.equal(calls, 0); assert.equal(busy.props['aria-busy'], true)
    assert.equal(loadButton(busy).props['aria-disabled'], true)
    assert.equal(loadButton(busy).props.tabIndex, -1)
    assert.equal(loadButton(busy).props.children, 'Зареждаме бизнеси…')
    assert.equal(loadButton(busy).type, loadButton(first).type)
    assert.equal(loadButton(busy).key, loadButton(first).key)
    assert.equal(loadButton(busy).props.disabled, undefined, 'do not detach keyboard focus through native disabling')
    assert.equal(elements(busy, node => node.type === 'li').length, 2)
    h.commit(); assert.equal(observer.disconnected, 1)
    h.render({ ...base, onNearEnd: () => calls++, busy: false })
    h.intersect(); assert.equal(calls, 1)
  } finally { h.dispose() }
})

test('exhausted results unregister observation and retain one inert keyboard control for focus stability', () => {
  const h = listHarness()
  let calls = 0
  try {
    const first = h.render({ ...base, onNearEnd: () => calls++ })
    const observer = h.observers[0], action = loadButton(first).props.onClick
    const end = h.render({ ...base, hasMore: false, onNearEnd: undefined })
    assert.equal(observer.disconnected, 1)
    assert.equal(loadButton(end).props['aria-disabled'], true); assert.equal(loadButton(end).props.tabIndex, -1)
    assert.equal(loadButton(end).props.children, 'Всички бизнеси са заредени')
    assert.equal(loadButton(end).type, loadButton(first).type); assert.equal(loadButton(end).key, loadButton(first).key)
    assert.equal(loadButton(end).props.disabled, undefined)
    h.intersect(observer); action(); loadButton(end).props.onClick()
    assert.equal(calls, 0)
    assert.equal(elements(end, node => node.type === 'li').length, 2)
    const disabled = listHarness()
    try { disabled.render(base); assert.equal(disabled.observers.length, 0) } finally { disabled.dispose() }
  } finally { h.dispose() }
})

test('pending/error/terminal renders retain the same control position/type/key without dispatching stale loads', () => {
  for (const locale of ['bg', 'en']) {
    const h = listHarness(), calls = [], props = { ...base, locale, onNearEnd: () => calls.push('next') }
    try {
      const first = h.render(props), firstButton = loadButton(first)
      const firstIndex = first.props.children.findIndex(child => child === firstButton)
      const previousObserver = h.observers[0]
      const phases = [
        { pending: true, hasMore: true, message: React.createElement('p', { role: 'status' }, 'Loading fixture') },
        { pending: false, hasMore: true, message: React.createElement('p', { role: 'alert' }, 'Retry fixture') },
        { pending: false, hasMore: false, message: null },
      ]
      for (const phase of phases) {
        const tree = h.render({ ...props, ...phase, onNearEnd: undefined })
        const button = loadButton(tree)
        assert.equal(button.type, firstButton.type); assert.equal(button.key, firstButton.key)
        assert.equal(tree.props.children.findIndex(child => child === button), firstIndex)
        assert.equal(button.props['aria-controls'], firstButton.props['aria-controls'])
        assert.equal(button.props['aria-disabled'], true); assert.equal(button.props.tabIndex, -1)
        button.props.onClick(); firstButton.props.onClick(); h.intersect(previousObserver)
        if (phase.pending) assert.equal(button.props.children, locale === 'en' ? 'Loading businesses…' : 'Зареждаме бизнеси…')
        else if (phase.hasMore) assert.equal(button.props.children, locale === 'en' ? 'Load the next businesses' : 'Зареди следващите бизнеси')
        else assert.equal(button.props.children, locale === 'en' ? 'All businesses are loaded' : 'Всички бизнеси са заредени')
      }
      assert.deepEqual(calls, [])
    } finally { h.dispose() }
  }
})

test('unmount prevents late observer callbacks, and English keyboard action stays localized', () => {
  const h = listHarness()
  let calls = 0
  const tree = h.render({ ...base, title: 'Explore businesses', locale: 'en', onNearEnd: () => calls++ })
  assert.equal(loadButton(tree).props.children, 'Load the next businesses')
  h.dispose()
  assert.equal(h.observers[0].disconnected, 1)
  h.intersect()
  assert.equal(calls, 0)
})
