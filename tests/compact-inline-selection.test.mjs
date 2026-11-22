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

test('summary is one compact wrapping row with 44px removable chips, not a multi-section sorting panel', async () => {
  const base = declarations(rules.find(rule => rule.selector === '.inline-summary' && declarations(rule).display))
  assert.equal(base.display, 'flex'); assert.equal(base['flex-wrap'], 'wrap')
  assert.equal(base.padding, '8px 10px'); assert.equal(base['border-radius'], '20px')
  assert.equal(base.background, 'var(--inline-summary-surface)')
  const chip = declarations(rules.find(rule => rule.selector === '.inline-summary-chip' && declarations(rule).display))
  assert.equal(chip['min-height'], '44px'); assert.equal(chip['max-width'], '100%')
  const label = declarations(rules.find(rule => rule.selector === '.inline-summary-chip-label'))
  assert.equal(label['white-space'], 'normal'); assert.equal(label['word-break'], 'normal')
  assert.equal(label.hyphens, 'none')
  const group = declarations(rules.find(rule => rule.selector === '.inline-summary-service' && declarations(rule).display))
  assert.equal(group.display, 'inline-flex'); assert.equal(group['max-width'], '100%')
  assert.equal(group['flex-wrap'], undefined, 'the decorative separator stays beside the service, not on an orphaned flex line')
  const source = await read('components/inline-discovery-summary.js')
  assert.doesNotMatch(source, /<select|inline-summary-(?:area|sort|context|meta)|copy\.all\b/)
  assert.match(source, /<p className="inline-summary-count" role="status" aria-live="polite" aria-atomic="true"/)
  assert.match(source, /--inline-summary-offset/)
  assert.match(source, /safe \? Math\.ceil\(height\) \+ 24 : 0/)
})

test('inline services have no All button or leftover full-width All CSS, while legacy non-home clearing remains', async () => {
  const source = await read('components/discovery-subcategories.js')
  const inline = source.slice(source.indexOf('  if (inline) {'), source.indexOf('  if (!category ||'))
  assert.doesNotMatch(inline, /inline-service-all|copy\.all\b|onSelect\(''\)/)
  assert.match(source.slice(source.indexOf('  if (!category ||')), /className="discovery-subcategory-all"/)
  assert.doesNotMatch(css, /inline-service-all|inline-summary-(?:area|sort|context|meta)/)
  const header = rules.find(rule => rule.selector === '.customer-home.quick-choice .discovery-subcategories.is-inline .inline-subcategories-header h2')
  assert.equal(declarations(header).margin, '0', 'the compact shared heading row overrides the older generic heading margin')
  const parent = declarations(rules.find(rule => rule.selector === '.inline-selected-parent' && declarations(rule).display))
  assert.equal(parent['min-height'], '44px'); assert.equal(parent.margin, '0')
})

test('first-business scrolling reserves a font-relative heading gap below the measured sticky breadcrumb', () => {
  const first = rules.find(rule => rule.selector === '.customer-home.quick-choice:has(.inline-discovery-categories) .home-business-grid > li:first-child')
  assert.equal(declarations(first)['scroll-margin-top'], 'calc(var(--inline-summary-offset,190px) + 3rem)')
  const heading = rules.find(rule => rule.selectors.includes('.customer-home.quick-choice:has(.inline-discovery-categories) .home-section-heading h2'))
  assert.equal(declarations(heading)['scroll-margin-top'], 'var(--inline-summary-offset,190px)', 'direct heading navigation retains its measured-only offset')
})
