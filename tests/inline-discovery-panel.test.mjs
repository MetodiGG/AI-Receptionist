import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const source = await readFile(new URL('../components/inline-discovery-panel.js', import.meta.url), 'utf8')
const css = await readFile(new URL('../app/inline-discovery-panel.css', import.meta.url), 'utf8')
const { code } = await transform(source, { filename: 'components/inline-discovery-panel.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })

function load(react = React) {
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name === 'react' ? react : name === '../app/inline-discovery-panel.css' ? {} : require(name), module, module.exports)
  return module.exports.InlineDiscoveryPanel
}

function harness(initial = {}, reduced = false) {
  const slots = [], effects = [], pending = [], timers = new Map(), listeners = new Set()
  let cursor = 0, effectCursor = 0, nextTimer = 0, dirty = false
  const media = { matches: reduced, addEventListener(type, callback) { assert.equal(type, 'change'); listeners.add(callback) }, removeEventListener(type, callback) { assert.equal(type, 'change'); listeners.delete(callback) } }
  const react = { ...React,
    useState(initialValue) {
      const at = cursor++
      if (!(at in slots)) slots[at] = typeof initialValue === 'function' ? initialValue() : initialValue
      return [slots[at], next => { const value = typeof next === 'function' ? next(slots[at]) : next; if (!Object.is(value, slots[at])) { slots[at] = value; dirty = true } }]
    },
    useRef(initialValue) { const at = cursor++; return slots[at] ||= { current: initialValue } },
    useLayoutEffect(callback, dependencies) {
      const at = effectCursor++, previous = effects[at]
      if (!previous || dependencies.some((value, index) => !Object.is(value, previous.dependencies[index]))) {
        pending.push({ at, callback, dependencies, cleanup: previous?.cleanup })
      }
    },
  }
  const Component = load(react), props = { open: false, children: null, ...initial }
  const f = { tree: null, timers, listeners,
    render(patch = {}) { Object.assign(props, patch); cursor = 0; effectCursor = 0; f.tree = Component(props); return f.tree },
    withBrowser(callback) {
      const saved = ['window', 'setTimeout', 'clearTimeout'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
      Object.defineProperty(globalThis, 'window', { configurable: true, value: { matchMedia(query) { assert.equal(query, '(prefers-reduced-motion: reduce)'); return media } } })
      globalThis.setTimeout = (callback, delay) => { const id = ++nextTimer; timers.set(id, { callback, delay }); return id }
      globalThis.clearTimeout = id => timers.delete(id)
      try { return callback() } finally { for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] } }
    },
    commit() {
      return f.withBrowser(() => {
        let iterations = 0
        do {
          assert.ok(++iterations < 10, 'effects settle')
          dirty = false
          for (const effect of pending.splice(0)) {
            effect.cleanup?.()
            const cleanup = effect.callback()
            effects[effect.at] = { dependencies: effect.dependencies, cleanup }
          }
          if (dirty) f.render()
        } while (dirty || pending.length)
        return f.tree
      })
    },
    update(patch) { f.render(patch); return f.commit() },
    content() { return f.tree.props.children.props.children },
    expire() { f.withBrowser(() => { for (const [id, timer] of [...timers]) { timers.delete(id); timer.callback() } }); if (dirty) { f.render(); f.commit() } },
    finish(propertyName = 'grid-template-rows', bubble = false) {
      const currentTarget = {}, target = bubble ? {} : currentTarget
      f.withBrowser(() => f.tree.props.onTransitionEnd({ currentTarget, target, propertyName }))
      if (dirty) { f.render(); f.commit() }
    },
    reduce(value) { media.matches = value; for (const listener of listeners) listener(); if (dirty) { f.render(); f.commit() } },
    unmount() { f.withBrowser(() => { for (const effect of effects) effect?.cleanup?.() }); },
  }
  f.render()
  return f
}

test('closed presence immediately removes interaction and accessibility while retaining only committed open content for 200ms', () => {
  const child = React.createElement('button', null, 'Real existing child'), f = harness({ open: true, children: child })
  f.commit()
  assert.equal(f.tree.props.inert, undefined)
  assert.equal(f.tree.props['aria-hidden'], undefined)
  assert.equal(f.content(), child)
  f.update({ open: false, children: null })
  assert.equal(f.tree.props.inert, true)
  assert.equal(f.tree.props['aria-hidden'], true)
  assert.equal(f.tree.props['data-open'], 'false')
  assert.equal(f.content(), child)
  assert.equal(f.timers.size, 1)
  assert.equal([...f.timers.values()][0].delay, 200)
  f.expire()
  assert.equal(f.content(), null)
  assert.equal(f.timers.size, 0)
  f.unmount()
})

test('open category switches use fresh children immediately and close snapshots are not replaced by closed updates', () => {
  const first = React.createElement('div', null, 'First category'), second = React.createElement('div', null, 'Second category'), uncommitted = React.createElement('div', null, 'Never committed')
  const f = harness({ open: true, children: first }); f.commit()
  f.render({ children: second })
  assert.equal(f.content(), second, 'the old snapshot never replaces fresh open content')
  f.commit()
  f.update({ open: false, children: null })
  assert.equal(f.content(), second)
  const timer = [...f.timers.keys()][0]
  f.update({ children: uncommitted })
  assert.equal(f.content(), second)
  assert.equal([...f.timers.keys()][0], timer, 'closed parent rerenders do not extend visual retention')
  f.finish(); assert.equal(f.content(), null)
  f.unmount()
})

test('a quick reopen cancels exit cleanup and never loses the new category to an old timer or transition event', () => {
  const first = React.createElement('div', null, 'First'), next = React.createElement('div', null, 'Next')
  const f = harness({ open: true, children: first }); f.commit()
  f.update({ open: false, children: null }); assert.equal(f.timers.size, 1)
  f.update({ open: true, children: next })
  assert.equal(f.timers.size, 0)
  assert.equal(f.content(), next)
  f.finish(); assert.equal(f.content(), next)
  f.update({ open: false, children: null })
  f.finish('opacity'); assert.equal(f.content(), next)
  f.finish('grid-template-rows', true); assert.equal(f.content(), next)
  f.finish(); assert.equal(f.content(), null)
  assert.equal(f.timers.size, 0)
  f.unmount()
})

test('reduced motion closes immediately, preference changes remove a pending exit, and every listener/timer is cleaned up', () => {
  const child = React.createElement('div', null, 'Existing content')
  const reduced = harness({ open: true, children: child }, true); reduced.commit()
  assert.equal(reduced.listeners.size, 1)
  reduced.update({ open: false, children: null })
  assert.equal(reduced.content(), null)
  assert.equal(reduced.timers.size, 0)
  reduced.unmount(); assert.equal(reduced.listeners.size, 0)
  const f = harness({ open: true, children: child }); f.commit()
  f.update({ open: false, children: null }); f.reduce(true)
  assert.equal(f.content(), null)
  assert.equal(f.timers.size, 0)
  f.reduce(false); f.update({ open: true, children: child }); f.update({ open: false, children: null })
  assert.equal(f.timers.size, 1)
  f.unmount()
  assert.equal(f.timers.size, 0)
  assert.equal(f.listeners.size, 0)
})

test('wrapper styles animate natural grid height and a small fade/offset without scroll regions, spacing or selection dependencies', () => {
  assert.match(css, /grid-template-rows:\s*0fr/)
  assert.match(css, /\[data-open="true"\]\s*\{\s*grid-template-rows:\s*1fr/)
  assert.match(css, /transition:\s*grid-template-rows 200ms ease-out, opacity 200ms ease-out, transform 200ms ease-out/)
  assert.match(css, /translateY\(8px\)/)
  assert.match(css, /\.inline-discovery-panel-inner\s*\{[^}]*min-height:\s*0;[^}]*overflow:\s*hidden;/s)
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*transition:\s*none/)
  assert.doesNotMatch(css, /overflow[^:]*:\s*(?:auto|scroll)|max-height:|animation:|@keyframes|view-transition/)
  assert.doesNotMatch(source, /fetch\(|router|history|searchParams|category|onSelect|requestAnimationFrame|startViewTransition/)
  const Component = load()
  assert.match(renderToStaticMarkup(React.createElement(Component, { open: false }, 'Hidden child')), /inert="" aria-hidden="true"/)
})
