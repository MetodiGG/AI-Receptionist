import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const css = await read('app/inline-discovery.css'), rules = []
parse(css).walkRules(rule => rules.push(rule))
const declarations = rule => Object.fromEntries(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]))
const dark = rule => /html\[data-theme=["']?dark/.test(rule.selector)
function tokens(isDark) {
  const values = {}
  for (const rule of rules) if (isDark || !dark(rule)) for (const [name, value] of Object.entries(declarations(rule))) if (name.startsWith('--inline-')) values[name] = value
  return values
}
function rgb(hex) { assert.match(hex, /^#[\da-f]{6}$/i); return hex.slice(1).match(/../g).map(value => parseInt(value, 16)) }
function luminance(channels) { const [r,g,b] = channels.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4); return .2126*r + .7152*g + .0722*b }
function contrast(first, second) { const [light, shade] = [luminance(first), luminance(second)].sort((a,b) => b-a); return (light+.05)/(shade+.05) }

test('compact breadcrumb text, counts, selected chip, hover and focus have AA contrast in both themes', () => {
  for (const isDark of [false, true]) {
    const values = tokens(isDark), foreground = rgb(values['--inline-summary-ink']), focus = rgb(values['--inline-accent'])
    for (const surface of ['--inline-summary-surface','--inline-summary-chip','--inline-selected','--inline-hover']) {
      const background = rgb(values[surface])
      assert.ok(contrast(foreground, background) >= 4.5, `${isDark ? 'dark' : 'light'} breadcrumb text / ${surface}`)
      assert.ok(contrast(focus, background) >= 3, `${isDark ? 'dark' : 'light'} breadcrumb focus / ${surface}`)
    }
    for (const endpoint of [0,255]) {
      const background = rgb(values['--inline-summary-surface']).map(value => value*.94 + endpoint*.06)
      assert.ok(contrast(foreground, background) >= 4.5, 'the real 94% glass surface keeps AA over either backdrop extreme')
    }
  }
})

test('stationary photographic summary is one wrapping selection/context surface with 44px labels, not a chip/sorting panel', async () => {
  const base = declarations(rules.find(rule => rule.selector === '.inline-summary' && declarations(rule).display))
  assert.equal(base.display, 'flex'); assert.equal(base['flex-wrap'], 'wrap')
  assert.equal(base.position, 'static'); assert.equal(base.padding, '14px 18px')
  assert.equal(base['border-radius'], 'var(--inline-radius-panel)')
  assert.match(base.background, /linear-gradient\(var\(--inline-summary-surface\)/)
  const action = declarations(rules.find(rule => rule.selector === '.inline-summary-selection-label' && declarations(rule).display))
  assert.equal(action['min-height'], '44px'); assert.equal(action['min-width'], '44px'); assert.equal(action['max-width'], 'calc(100% + 12px)')
  assert.equal(action['flex-wrap'], 'wrap', 'the close icon can move below a complete long word at enlarged text sizes')
  const label = declarations(rules.find(rule => rule.selectors.includes('.inline-summary-selection-label > span')))
  assert.equal(label['white-space'], 'normal'); assert.equal(label['word-break'], 'normal')
  assert.equal(label.hyphens, 'none')
  assert.equal(declarations(rules.find(rule => rule.selector === '.inline-summary-selection-label > span')).flex, '1 1 min-content')
  const group = declarations(rules.find(rule => rule.selector === '.inline-summary-labels'))
  assert.equal(group.display, 'flex'); assert.equal(group['flex-direction'], 'column'); assert.equal(group['min-width'], '0')
  assert.equal(group.flex, '1 1 10rem', 'enlarged whole-word labels receive their own readable row rather than a narrow leftover strip')
  assert.equal(declarations(rules.find(rule => rule.selector === '.inline-summary-selection'))['flex-wrap'], 'wrap')
  for (const rule of rules.filter(rule => rule.selector.includes('.inline-summary'))) {
    assert.notEqual(declarations(rule).position, 'sticky')
    assert.notEqual(declarations(rule).position, 'fixed')
  }
  const source = await read('components/inline-discovery-summary.js')
  assert.doesNotMatch(source, /<select|inline-summary-(?:area|sort|context|meta|chip|separator)|copy\.all\b|data-sticky-safe|setStickySafe/)
  assert.match(source, /<p className="inline-summary-count" role="status" aria-live="polite" aria-atomic="true"/)
  assert.match(source, /--inline-summary-offset/)
  assert.match(source, /Math\.min\(Math\.ceil\(height\) \+ 24, Math\.max\(0, viewport - 240\)\)/)
})

test('inline services have no All button or leftover full-width All CSS, while legacy non-home clearing remains', async () => {
  const source = await read('components/discovery-subcategories.js')
  const inline = source.slice(source.indexOf('  if (inline) {'), source.indexOf('  if (!category ||'))
  assert.doesNotMatch(inline, /inline-service-all|copy\.all\b|onSelect\(''\)/)
  assert.match(source.slice(source.indexOf('  if (!category ||')), /className="discovery-subcategory-all"/)
  assert.doesNotMatch(css, /inline-service-all|inline-summary-(?:area|sort|context|meta)/)
  const header = rules.find(rule => rule.selector === '.customer-home.quick-choice .discovery-subcategories.is-inline .inline-subcategories-header h2')
  assert.equal(declarations(header).margin, '0', 'the compact shared heading row overrides the older generic heading margin')
  assert.equal(declarations(header)['text-align'], 'center')
  assert.doesNotMatch(inline, /inline-selected-parent|inline-parent-photo|inline-category-clear/)
  assert.doesNotMatch(css, /inline-selected-parent|inline-parent-photo|inline-category-clear/)
})

test('first-business scrolling preserves the measured stationary summary above the first card without making headings sticky', () => {
  const first = rules.find(rule => rule.selector === '.customer-home.quick-choice:has(.inline-discovery-categories) .home-business-grid > li:first-child')
  assert.equal(declarations(first)['scroll-margin-top'], 'calc(var(--inline-summary-offset,0px) + 3rem)')
  const heading = rules.find(rule => rule.selectors.includes('.customer-home.quick-choice:has(.inline-discovery-categories) .home-section-heading h2'))
  assert.equal(declarations(heading)['scroll-margin-top'], '24px', 'a stationary summary needs no persistent heading offset when scrolling normally')
})
