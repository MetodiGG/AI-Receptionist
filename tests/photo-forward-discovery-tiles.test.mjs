import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
const css = await readFile(new URL('../app/inline-discovery.css', import.meta.url), 'utf8')
const rules = []
parse(css).walkRules(rule => rules.push(rule))
const declarations = rule => Object.fromEntries(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]))
function applies(rule, viewport, container, font) {
  for (let parent = rule.parent; parent?.type !== 'root'; parent = parent.parent) {
    if (parent.type !== 'atrule') continue
    if (parent.name === 'media') {
      if (/prefers-reduced-motion|hover:|pointer:/.test(parent.params)) return false
      for (const [, bound, value] of parent.params.matchAll(/(min|max)-width:\s*(\d+)px/g)) {
        if (bound === 'min' && viewport < Number(value) || bound === 'max' && viewport > Number(value)) return false
      }
    }
    if (parent.name === 'container') for (const [, bound, value] of parent.params.matchAll(/(min|max)-width:\s*([\d.]+)rem/g)) {
      if (bound === 'min' && container < Number(value) * font || bound === 'max' && container > Number(value) * font) return false
    }
  }
  return true
}
function style(selector, viewport, container, font = 16, suffix = false, longLabels = false) {
  const found = {}, variables = {}
  for (const rule of rules) {
    if (/html\[data-theme=["']?dark/.test(rule.selector) || !applies(rule, viewport, container, font)) continue
    const values = declarations(rule)
    for (const [name, value] of Object.entries(values)) if (name.startsWith('--')) variables[name] = value
    if (rule.selectors.some(actual => {
      if (actual.includes('[data-long-label="true"]')) {
        if (!longLabels) return false
        actual = actual.replace('[data-long-label="true"]', '')
      }
      return actual === selector || suffix && actual.endsWith(' ' + selector)
    })) Object.assign(found, values)
  }
  for (const [name, value] of Object.entries(found)) {
    found[name] = value.replace(/var\((--[\w-]+)(?:,\s*([^)]*))?\)/g, (original, variable) => variables[variable] || original)
  }
  return found
}
function numericRatio(value) {
  assert.ok(value && value !== 'auto', 'photographic tiles need a fixed aspect ratio')
  const parts = value.split('/').map(part => Number(part.trim()))
  assert.ok(parts.length <= 2 && parts.every(part => Number.isFinite(part) && part > 0), value)
  return parts[0] / (parts[1] || 1)
}

test('category and service photographs share fixed square mobile and 4:3 tablet/desktop tile ratios', () => {
  for (const [viewport, container, expected] of [[320, 252, 1], [390, 334, 1], [699, 640, 1], [700, 640, 4 / 3], [820, 740, 4 / 3], [1000, 920, 4 / 3], [1280, 1080, 4 / 3]]) {
    const actual = []
    for (const [tileSelector, frameSelector] of [['.inline-category-option', '.inline-category-photo-frame'], ['.inline-service-tile', '.inline-service-photo-frame']]) {
      const tile = style(tileSelector, viewport, container), frame = style(frameSelector, viewport, container)
      actual.push(numericRatio(tile['aspect-ratio'] || frame['aspect-ratio']))
      assert.ok(!tile['min-height'] || parseFloat(tile['min-height']) <= 44, `${tileSelector}: a large pixel minimum cannot stretch a narrow square tile`)
      assert.equal(tile.width, '100%')
      assert.equal(tile.overflow, 'hidden', 'the tile itself clips its full-bleed photo and overlay to the shared radius')
      assert.equal(frame.position, 'absolute')
      assert.equal(frame.inset, '0')
      assert.equal(frame.width, '100%')
      assert.equal(frame.height, '100%')
    }
    assert.deepEqual(actual, [expected, expected], `${viewport}px: both tile levels share the same ratio`)
  }
})

test('tile images cover the entire frame and use only the approved presentation focal variable', () => {
  for (const selector of ['.inline-category-photo', '.discovery-subcategory-photo']) {
    const image = style(selector, 390, 334, 16, true)
    assert.equal(image.width, '100%')
    assert.equal(image.height, '100%')
    assert.equal(image['object-fit'], 'cover')
    assert.match(image['object-position'], /var\(--inline-photo-position(?:,\s*center)?\)/)
    assert.equal(image.border, '0')
    assert.equal(image['border-radius'], '0')
  }
})

test('All is a full-width 56px row with equal 40px side tracks, never a photographic-ratio tile', () => {
  for (const [viewport, container] of [[320, 252], [390, 334], [820, 740], [1280, 1080]]) {
    const all = style('.inline-service-all', viewport, container)
    assert.equal(all.display, 'grid')
    assert.equal(all.width, '100%')
    assert.ok(parseFloat(all['min-height']) >= 56, 'the full row remains a generous action target')
    assert.match(all['grid-template-columns'], /^40px\s+minmax\(0,\s*1fr\)\s+40px$/)
    assert.ok(!all['aspect-ratio'] || all['aspect-ratio'] === 'auto')
    const photo = style('.inline-parent-photo', viewport, container, 16, true)
    assert.equal(photo.width, '40px')
    assert.equal(photo.height, '40px')
    assert.equal(photo['object-fit'], 'cover')
    assert.equal(photo['object-position'] || 'center', 'center')
  }
})

test('photo captions retain full words and font-relative narrow-container reflow rather than clipping enlarged text', () => {
  for (const selector of ['.inline-category-label', '.inline-service-label']) {
    const label = style(selector, 390, 334)
    assert.equal(label['white-space'], 'normal')
    assert.equal(label['word-break'], 'normal')
    assert.notEqual(label['overflow-wrap'], 'anywhere')
    assert.notEqual(label['text-overflow'], 'ellipsis')
  }
  for (const selector of ['.inline-category-grid', '.inline-service-grid']) {
    assert.equal(style(selector, 320, 252, 24)['grid-template-columns'], 'minmax(0,1fr)')
  }
  assert.doesNotMatch(css, /line-clamp|text-overflow:\s*ellipsis|word-break:\s*break-all|overflow-x:\s*(?:auto|scroll)/)
})

test('only marked service grids use the narrow long-word fallback, with normal 390px two-column presentation retained', () => {
  assert.equal(style('.inline-service-grid', 320, 268, 16, false, true)['grid-template-columns'], 'minmax(0,1fr)')
  assert.equal(style('.inline-service-grid', 320, 268)['grid-template-columns'], 'repeat(2,minmax(0,1fr))')
  assert.equal(style('.inline-category-grid', 320, 268, 16, false, true)['grid-template-columns'], 'repeat(2,minmax(0,1fr))')
  assert.equal(style('.inline-service-grid', 390, 340, 16, false, true)['grid-template-columns'], 'repeat(2,minmax(0,1fr))')
  assert.equal(style('.inline-service-grid', 820, 740, 16, false, true)['grid-template-columns'], 'repeat(3,minmax(0,1fr))')
  assert.equal(style('.inline-service-grid', 1280, 1080, 16, false, true)['grid-template-columns'], 'repeat(4,minmax(0,1fr))')
  assert.equal(style('.inline-service-label', 320, 268)['font-size'], '.9375rem', 'preserve readable 15px-at-default text instead of shrinking names')
  for (const selector of ['.inline-category-option', '.inline-service-tile']) assert.equal(numericRatio(style(selector, 320, 268, 16, false, true)['aspect-ratio']), 1)
  const enlargedAll = style('.inline-service-all', 320, 252, 24)
  assert.equal(enlargedAll['padding-inline'], '4px')
  assert.equal(enlargedAll.gap, '0')
  assert.match(enlargedAll['grid-template-columns'], /^40px\s+minmax\(0,\s*1fr\)\s+40px$/)
})
