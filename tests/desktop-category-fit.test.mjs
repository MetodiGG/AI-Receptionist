import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, readlink } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const BASE = '4be84916a4e2699e00e73243208c88f5aab1aae7'
const CSS = 'app/inline-discovery.css'
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const frozenPath = path => path !== CSS && !/^(?:tests|docs)\//.test(path) && !/\.(?:md|txt)$/i.test(path)
const baseline = git('ls-tree', '-r', '-z', BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob' && frozenPath(record.path))

test('the desktop-only fit pass freezes every other production file, including components, focal maps, images, APIs, booking and data', async () => {
  assert.equal(baseline.length, 2811)
  assert.equal(createHash('sha256').update(JSON.stringify(baseline)).digest('hex'), '43e47bf817bc8b6503d789cf5accfb749754f9c34e2323f24c8a32fe61497509')
  for (let offset = 0; offset < baseline.length; offset += 32) await Promise.all(baseline.slice(offset, offset + 32).map(async record => {
    const path = new URL('../' + record.path, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), record.oid, `${record.path} must remain byte-identical to ${BASE}`)
  }))
  const roots = ['app', 'components', 'hooks', 'lib', 'public', 'scripts', 'supabase']
  const belongs = path => roots.some(prefix => path.startsWith(prefix + '/'))
  const expected = baseline.filter(record => belongs(record.path)).map(record => record.path).sort()
  const actual = git('ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', ...roots).split('\0').filter(path => path && frozenPath(path))
  assert.deepEqual([...new Set(actual)].sort(), expected, 'This CSS-only pass cannot add, remove or rename production files')
})

const require = createRequire(import.meta.url)
const { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
const source = await read(CSS), tree = parse(source), before = parse(git('show', BASE + ':' + CSS))
const rules = []
tree.walkRules(rule => rules.push(rule))
const declarations = rule => Object.fromEntries(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]))
function isDesktop(rule) {
  for (let parent = rule.parent; parent?.type !== 'root'; parent = parent.parent) {
    if (parent.type === 'atrule' && parent.name === 'media') {
      const widths = [...parent.params.matchAll(/min-width:\s*(\d+)px/g)].map(match => Number(match[1]))
      if (widths.some(width => width >= 1000)) return true
    }
  }
  return false
}
function categoryOnly(rule) {
  return rule.selectors.every(selector => /\.inline-category-(?:option|photo-frame|photo|caption|label)\b/.test(selector)
    && !/\.inline-(?:service|summary|discovery-panel)|\.home-business/.test(selector))
}
function canonical(node) {
  if (node.type === 'comment') return null
  if (node.type === 'rule' && isDesktop(node) && categoryOnly(node)) return null
  const children = node.nodes?.map(canonical).filter(Boolean)
  if (children && !children.length) return null
  if (node.type === 'root') return children
  if (node.type === 'atrule') return { type: node.type, name: node.name, params: node.params, children }
  if (node.type === 'rule') return { type: node.type, selectors: node.selectors, children }
  if (node.type === 'decl') return { type: node.type, prop: node.prop, value: node.value, important: Boolean(node.important) }
  return { type: node.type, value: node.toString() }
}

test('only category-targeted rules inside a desktop min-width of at least 1000px may differ from the approved CSS', () => {
  assert.deepEqual(canonical(tree), canonical(before), 'Mobile/tablet rules, service tiles, All, loading placeholders, results, motion and summary CSS remain unchanged')
  const changes = rules.filter(rule => isDesktop(rule) && categoryOnly(rule))
  assert.ok(changes.length > 0, 'a category-only desktop fit treatment is present')
  for (const rule of changes) {
    assert.doesNotMatch(rule.selector, /:has\(\.inline-discovery-categories\)/, 'the shared category/service ratio must not be overwritten globally')
    for (const property of Object.keys(declarations(rule))) assert.notEqual(property, '--inline-tile-ratio', 'do not silently change service or skeleton ratios through their shared variable')
  }
})

function applies(rule, viewport, hover) {
  for (let parent = rule.parent; parent?.type !== 'root'; parent = parent.parent) {
    if (parent.type !== 'atrule') continue
    if (parent.name === 'container') return false
    if (parent.name !== 'media') continue
    if (/prefers-reduced-motion/.test(parent.params)) return false
    if (/hover:|pointer:/.test(parent.params) && !hover) return false
    for (const [, bound, value] of parent.params.matchAll(/(min|max)-width:\s*(\d+)px/g)) {
      if (bound === 'min' && viewport < Number(value) || bound === 'max' && viewport > Number(value)) return false
    }
  }
  return true
}
function style(selector, viewport, hover = false) {
  const found = {}, variables = {}
  for (const rule of rules) {
    if (/html\[data-theme=["']?dark/.test(rule.selector) || !applies(rule, viewport, hover)) continue
    for (const [name, value] of Object.entries(declarations(rule))) if (name.startsWith('--')) variables[name] = value
    if (rule.selectors.some(actual => {
      if (/:hover|:active|aria-pressed/.test(actual) && !hover) return false
      return actual === selector || actual.endsWith(' ' + selector)
    })) Object.assign(found, declarations(rule))
  }
  for (const [name, value] of Object.entries(found)) found[name] = value.replace(/var\((--[\w-]+)(?:,\s*([^)]*))?\)/g, (original, variable) => variables[variable] || original)
  return found
}
const ratio = value => {
  assert.ok(value && value !== 'auto', 'the original photograph keeps a fixed square presentation area')
  const [width, height = 1] = value.split('/').map(part => Number(part.trim()))
  return width / height
}

test('1000px+ categories reserve a separate caption below a square contained photo instead of cropping the original scene', () => {
  for (const viewport of [1000, 1280, 1440]) {
    const tile = style('.inline-category-option', viewport)
    const photo = style('.inline-category-photo-frame', viewport)
    const image = style('.inline-category-photo', viewport)
    const caption = style('.inline-category-caption', viewport)
    assert.equal(tile['aspect-ratio'], 'auto', 'outer height grows to include both the photo and caption')
    assert.equal(tile.height, 'auto')
    assert.equal(photo.position, 'relative', 'the image participates in the first grid row, not an absolute underlay')
    assert.equal(ratio(photo['aspect-ratio']), 1)
    assert.equal(photo['grid-row'], '1')
    assert.equal(photo.width, '100%')
    assert.equal(photo.height, 'auto')
    assert.equal(image['object-fit'], 'contain')
    assert.equal(caption.position, 'relative')
    assert.equal(caption['grid-row'], '2')
    assert.ok(!caption['margin-top'] || !caption['margin-top'].startsWith('-'))
    assert.equal(style('.inline-category-grid', viewport)['grid-template-columns'], 'repeat(4,minmax(0,1fr))')
    assert.equal(style('.inline-service-grid', viewport)['grid-template-columns'], 'repeat(4,minmax(0,1fr))')
    assert.equal(ratio(style('.inline-service-tile', viewport)['aspect-ratio']), 4 / 3)
    assert.equal(style('.inline-service-photo-frame', viewport).position, 'absolute')
    assert.equal(style('.discovery-subcategory-photo', viewport)['object-fit'], 'cover')
  }
})

test('desktop category image hover cannot re-crop the scene, while existing tile lift and arrow movement stay available', () => {
  for (const viewport of [1000, 1280, 1440]) {
    const zoom = rules.filter(rule => applies(rule, viewport, true) && isDesktop(rule)
      && rule.selectors.some(selector => selector.includes('.inline-category-option:hover') && selector.endsWith(' .inline-category-photo')))
    assert.ok(zoom.some(rule => ['none', 'scale(1)'].includes(declarations(rule).transform)), 'an effective desktop hover override prevents image zoom')
    const lift = rules.filter(rule => applies(rule, viewport, true) && rule.selectors.includes('.inline-category-option:hover:not(:disabled)')).at(-1)
    assert.equal(declarations(lift).transform, 'translateY(-2px)')
    const arrow = rules.filter(rule => applies(rule, viewport, true) && rule.selectors.includes('.inline-category-option:hover .inline-tile-chevron svg')).at(-1)
    assert.equal(declarations(arrow).translate, '2px 0')
  }
})
