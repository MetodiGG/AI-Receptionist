import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { scrollTopDockInset, scrollTopOptions, shouldShowScrollTop } from '../lib/scroll-top.mjs'

test('back-to-top stays out of the initial viewport and appears after meaningful scrolling on any screen', () => {
  for (const [height, threshold] of [[400, 240], [800, 440], [1100, 480]]) {
    assert.equal(shouldShowScrollTop(0, height), false)
    assert.equal(shouldShowScrollTop(threshold - 1, height), false)
    assert.equal(shouldShowScrollTop(threshold, height), true)
  }
})

test('back-to-top scrolls instantly for reduced motion and otherwise scrolls smoothly', () => {
  assert.deepEqual(scrollTopOptions(true), { top: 0, behavior: 'instant' })
  assert.deepEqual(scrollTopOptions(false), { top: 0, behavior: 'smooth' })
})

test('the inset clears a visible bottom navigation and adapts to a larger dock', () => {
  assert.equal(scrollTopDockInset(800, 726), 88)
  assert.equal(scrollTopDockInset(800, 695.5), 119)
  assert.equal(scrollTopDockInset(800, 800), null)
  assert.equal(scrollTopDockInset(800, -10), null)
})

test('activation moves focus before the animated scroll for pointer and keyboard alike', () => {
  const component = readFileSync(new URL('../components/go-rez-scroll-top.js', import.meta.url), 'utf8')
  // A pointer-focused control hiding at the reveal threshold otherwise stops
  // Chrome's smooth scroll before the page reaches the top.
  assert.match(component, /function goToTop\(\) \{\s*focusPageStart\(\)\s+window\.scrollTo\(/)
})

test('the root mounts one localized button with keyboard focus return, theme and modal treatment', () => {
  const source = path => readFileSync(new URL(path, import.meta.url), 'utf8')
  const layout = source('../app/layout.js')
  const component = source('../components/go-rez-scroll-top.js')
  const style = source('../components/go-rez-scroll-top.module.css')
  assert.equal((layout.match(/<GoRezScrollTop\s*\/>/g) || []).length, 1)
  assert.match(component, /aria-label=\{LABEL\[locale\]\}/)
  assert.match(component, /<Icon name="arrow"/)
  assert.match(component, /focus\(\{ preventScroll: true \}\)/)
  assert.match(component, /hidden=\{!visible\}/)
  assert.match(style, /safe-area-inset-bottom/)
  assert.match(style, /dialog\[open\]/)
  assert.match(style, /data-theme="dark"/)
  assert.match(style, /prefers-reduced-motion: reduce/)
})
