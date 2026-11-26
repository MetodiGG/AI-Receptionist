import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import { installPublicActionMotion } from '../lib/public-action-motion.mjs'

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

test('only decorative glass layers use native per-card and independent dialog timelines, with a static fallback', () => {
  assert.match(preview, /\.action::before,\s*[^{]+\.action::after \{[^}]*pointer-events: none;/)
  assert.match(declarations('\\.action::before'), /transform: translateX\(-24%\);/)
  assert.match(declarations('\\.action::after'), /var\(--discovery-glass-warm\)[\s\S]*opacity: \.15;/)
  assert.match(preview, /@supports \(view-timeline-name: --go-action-view\)[\s\S]*@media \(prefers-reduced-motion:no-preference\)[\s\S]*animation-timeline: --go-action-view;/)
  assert.match(preview, /:global\(\.discovery-business-details\)[^\n]+\.action::after \{\s*animation-timeline: scroll\(nearest block\);/)
  assert.match(preview, /@keyframes glass-reflection\s*\{\s*from \{ transform: translateX\(-24%\); \}\s*to \{ transform: translateX\(24%\); \}/)
  assert.match(preview, /@keyframes glass-tint\s*\{\s*from, to \{ opacity: \.15; \}\s*50% \{ opacity: \.64; \}/)
  assert.match(preview, /\[data-public-action-press\]\) \{[^}]*transform: translateY\(1px\) scale\(\.96\)/)
  assert.match(preview, /\[data-public-action-press\]\)::after \{\s*animation: none;\s*opacity: \.76;/)
  assert.match(preview, /@media \(prefers-reduced-motion:reduce\) \{[\s\S]*transform: none;/)
  assert.doesNotMatch(preview, /\bbackground-position\b|\binfinite\b|--gorez-(?:page|dialog)-action-phase/)
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

test('no page or dialog scroll JavaScript; passive press keeps normal pointer and gesture cancellation', () => {
  const win = target(), doc = target()
  const clean = installPublicActionMotion(win, doc)
  assert.deepEqual([...win.events.keys()], ['blur'])
  assert.deepEqual([...doc.events.keys()], ['pointerdown', 'pointerup', 'pointercancel'])
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
  doc.dispatch('pointerdown', { target: child, button: 0, isPrimary: true, pointerId: 4 })
  win.dispatch('blur')
  assert.equal(attributes.has('data-public-action-press'), false)
  doc.dispatch('pointerdown', { target: child, button: 0, isPrimary: true, pointerId: 5 })
  clean()
  assert.equal(attributes.has('data-public-action-press'), false)
  assert.equal(win.events.size + doc.events.size, 0)
})

test('touch removes layered panel/chevron blur and keeps the lighter tinted caption filter', async () => {
  const inline = await readFile(new URL('../app/inline-discovery.css', import.meta.url), 'utf8')
  assert.match(inline, /@media \(max-width:699px\), \(hover:none\) and \(pointer:coarse\) \{\s*\.inline-discovery-categories[\s\S]*?\.inline-tile-chevron \{ -webkit-backdrop-filter: none; backdrop-filter: none; \}/)
  assert.match(inline, /\.inline-category-caption,\.inline-service-caption \{ -webkit-backdrop-filter: blur\(8px\); backdrop-filter: blur\(8px\); \}/)
})
