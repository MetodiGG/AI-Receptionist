import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import { installPublicActionMotion, publicActionScrollPhase } from '../lib/public-action-motion.mjs'

const css = await readFile(new URL('../components/public-action.module.css', import.meta.url), 'utf8')
const preview = css.split('/* The discovery action pair uses the approved glass finish')[1]
const scopedSelector = '\\.pair:global\\(\\.home-business-actions\\)'
const declarations = selector => [...preview.matchAll(new RegExp(`^${scopedSelector} ${selector} \\{([^}]*)\\}`, 'gm'))].map(match => match[1]).join('\n')

test('only the discovery pair gets left icons, balanced labels and reliable hit areas', () => {
  assert.match(declarations('\\.action'), /min-height: 50px;/)
  assert.match(declarations('\\.content'), /grid-template-columns: var\(--discovery-glass-slot\) minmax\(min-content, 1fr\) var\(--discovery-glass-slot\);/)
  assert.match(declarations('\\.chip'), /grid-column: 1;[\s\S]*grid-row: 1;/)
  assert.match(declarations('\\.label'), /grid-column: 2;[\s\S]*justify-self: center;[\s\S]*inset-inline-start: 6px;/)
  assert.match(preview, / > \* \{[\s\S]*flex: 46 1 min-content;[\s\S]*min-inline-size: min-content;/)
  assert.match(preview, / > :is\(\.primary, \.outboundForm\) \{\s*flex-grow: 54;/)
  assert.doesNotMatch(preview, /\bprofile-action-modes\b|\bdirectory-reservation-action\b/)
})

test('glass tint and reflection follow page and dialog independently; press feedback respects reduced motion', () => {
  assert.match(preview, /\.action::before,\s*[^{]+\.action::after \{[^}]*pointer-events: none;/)
  assert.match(declarations('\\.action'), /--discovery-glass-phase: var\(--gorez-page-action-phase, 0\)/)
  assert.match(preview, /:global\(\.discovery-business-details\)[^\n]+\.action \{[^}]*--discovery-glass-phase: var\(--gorez-dialog-action-phase, 0\)/)
  assert.match(declarations('\\.action::before'), /transform: translateX\(calc\(-24% \+ var\(--discovery-glass-phase\) \* 48%\)\)/)
  assert.match(declarations('\\.action::after'), /var\(--discovery-glass-warm\)[\s\S]*opacity: calc\(\.15 \+ var\(--discovery-glass-phase\) \* \.49\)/)
  assert.match(preview, /\[data-public-action-press\]\) \{[^}]*transform: translateY\(1px\) scale\(\.96\)/)
  assert.match(preview, /@media \(prefers-reduced-motion:reduce\) \{[\s\S]*--discovery-glass-phase: 0;[\s\S]*transform: none;/)
  assert.doesNotMatch(preview, /\banimation-timeline\b|\binfinite\b/)
})

function target() {
  const events = new Map()
  return {
    addEventListener: (type, callback, options) => events.set(type, { callback, options }),
    removeEventListener: (type, callback) => {
      assert.equal(events.get(type)?.callback, callback)
      events.delete(type)
    },
    dispatch: (type, event = {}) => events.get(type)?.callback(event),
    events,
  }
}

function styleTarget() {
  const values = new Map(), writes = []
  return { values, writes, setProperty: (key, value) => { values.set(key, value); writes.push([key, value]) }, removeProperty: key => values.delete(key) }
}

function setupMotion() {
  const win = target(), doc = target(), media = target()
  const frames = new Map()
  let nextFrame = 0
  Object.assign(win, {
    scrollY: 0, innerHeight: 800, matchMedia: () => media,
    requestAnimationFrame: callback => { const id = nextFrame++; frames.set(id, callback); return id },
    cancelAnimationFrame: id => frames.delete(id),
  })
  doc.documentElement = { style: styleTarget() }
  const flush = () => { const queued = [...frames.values()]; frames.clear(); queued.forEach(run => run()) }
  return { win, doc, media, frames, flush, clean: installPublicActionMotion(win, doc) }
}

test('a single passive frame coalesces scroll and updates only the page or open dialog that moved', () => {
  const { win, doc, frames, flush, clean } = setupMotion()
  const root = doc.documentElement.style
  const dialog = { isConnected: true, open: true, scrollTop: 120, clientHeight: 400, style: styleTarget(), matches: value => value === 'dialog.discovery-business-details[open]' }
  assert.equal(win.events.get('scroll').options.passive, true)
  assert.deepEqual(doc.events.get('scroll').options, { capture: true, passive: true })
  assert.equal(publicActionScrollPhase(-30, 900), 0)
  assert.equal(publicActionScrollPhase(240, 400), 1)
  assert.equal(publicActionScrollPhase(480, 400), 0)
  win.scrollY = 232
  win.dispatch('scroll')
  win.dispatch('scroll')
  doc.dispatch('scroll', { target: dialog })
  assert.equal(frames.size, 1)
  flush()
  assert.deepEqual(root.writes, [['--gorez-page-action-phase', '0.5']])
  assert.deepEqual(dialog.style.writes, [['--gorez-dialog-action-phase', '0.5']])
  win.scrollY = 233
  win.dispatch('scroll')
  flush()
  assert.equal(root.writes.length, 1, 'a one-pixel change does not write another style')
  dialog.scrollTop = 240
  doc.dispatch('scroll', { target: dialog })
  flush()
  assert.equal(dialog.style.values.get('--gorez-dialog-action-phase'), '1')
  assert.equal(root.writes.length, 1, 'dialog movement never changes the page style')
  clean()
  assert.equal(root.values.size, 0)
  assert.equal(recognizedListeners(win, doc), 0)
})

function recognizedListeners(win, doc) { return win.events.size + doc.events.size }

test('reduced motion suppresses phase updates but keeps ordinary touch feedback and cancellation', () => {
  const { win, doc, media, frames, flush, clean } = setupMotion()
  media.matches = true
  flush()
  win.dispatch('scroll')
  assert.equal(frames.size, 0)
  assert.equal(doc.documentElement.style.writes.length, 0)
  const attributes = new Map()
  const action = { setAttribute: (name, value) => attributes.set(name, value), removeAttribute: name => attributes.delete(name) }
  const child = { closest: selector => selector.includes(':not([aria-disabled="true"])') ? action : null }
  assert.deepEqual(doc.events.get('pointerdown').options, { capture: true, passive: true })
  doc.dispatch('pointerdown', { target: child, button: 0, isPrimary: true, pointerId: 2 })
  assert.equal(attributes.has('data-public-action-press'), true)
  doc.dispatch('pointerup', { pointerId: 3 })
  assert.equal(attributes.has('data-public-action-press'), true)
  doc.dispatch('pointercancel', { pointerId: 2 })
  assert.equal(attributes.has('data-public-action-press'), false)
  media.matches = false
  win.scrollY = 232
  media.dispatch('change')
  flush()
  assert.deepEqual(doc.documentElement.style.writes, [['--gorez-page-action-phase', '0.5']])
  clean()
  assert.equal(media.events.size, 0)
})
