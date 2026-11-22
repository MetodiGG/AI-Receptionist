import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RESPONSIVE_PREVIEW_FILES, COMPACT_SELECTION_CHANGED_FILES, CAR_WASH_REFINEMENT_NEW_MEDIA } from './discovery-refinement-20261122-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const BASE = '1dfb751f48af0c1b5794e8b276e23fe0ddc95d3b'
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const productionPath = path => path !== 'node_modules' && !/^(?:tests|docs)\//.test(path) && !/\.(?:md|txt)$/i.test(path)
const baseline = git('ls-tree', '-r', '-z', BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob' && productionPath(record.path))

test('the responsive wrapper and later approved compact selection add only exact review/media files while keeping all unrelated production bytes frozen', async () => {
  assert.deepEqual(RESPONSIVE_PREVIEW_FILES, ['app/dev/site-preview/page.js', 'app/dev/site-preview/preview.js', 'app/dev/site-preview/preview.css'])
  const stillFrozen = baseline.filter(record => !COMPACT_SELECTION_CHANGED_FILES.has(record.path))
  for (let offset = 0; offset < stillFrozen.length; offset += 32) await Promise.all(stillFrozen.slice(offset, offset + 32).map(async record => {
    const path = new URL('../' + record.path, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), record.oid, `${record.path} must stay byte-identical to ${BASE}`)
  }))
  const actual = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(path => path && productionPath(path))
  assert.deepEqual([...new Set(actual)].sort(), [...baseline.map(record => record.path), ...RESPONSIVE_PREVIEW_FILES, ...CAR_WASH_REFINEMENT_NEW_MEDIA].sort(), 'only the three reviewed dev wrapper files and three car-wash media siblings can enter the inventory')
})

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const source = await read('app/dev/site-preview/preview.js')
const { code } = await transform(source, { filename: 'app/dev/site-preview/preview.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
function client(react) {
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name === 'react' ? react : name === './preview.css' ? {} : name === '../../../components/icon' ? { Icon: ({ name }) => React.createElement('svg', { 'data-icon': name, 'aria-hidden': true }) } : require(name), module, module.exports)
  return module.exports
}
function elements(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, found))
  else if (React.isValidElement(node)) { if (predicate(node)) found.push(node); elements(node.props.children, predicate, found) }
  return found
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('')
  if (React.isValidElement(node)) return text(node.props.children)
  return typeof node === 'string' || typeof node === 'number' ? String(node) : ''
}
const classed = (tree, name) => elements(tree, node => node.props.className?.split(' ').includes(name))
function harness(props = {}) {
  let stateCursor = 0, refCursor = 0, effectCursor = 0, layoutCursor = 0
  const state = [], refs = [], effects = [], layouts = []
  const exports = client({ ...React,
    useState(initial) {
      const index = stateCursor++
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value }]
    },
    useRef(initial) { const index = refCursor++; return refs[index] ||= { current: initial } },
    useEffect(callback) { const index = effectCursor++; effects[index] ||= callback },
    useLayoutEffect(callback) { const index = layoutCursor++; layouts[index] ||= callback },
  })
  const render = patch => {
    stateCursor = refCursor = effectCursor = layoutCursor = 0
    return exports.ResponsiveSitePreview({ ...props, ...patch })
  }
  return { ...exports, render, refs, effects, layouts, state }
}
const iframe = tree => elements(tree, node => node.type === 'iframe')[0]
const button = (tree, label) => elements(tree, node => node.type === 'button' && (text(node) === label || node.props['aria-label'] === label))[0]

test('the dev-only page fails closed before rendering, accepts only BG/EN and phone/laptop, and is excluded from indexing', async () => {
  const filename = 'app/dev/site-preview/page.js'
  const { code: pageCode } = await transform(await read(filename), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
  let enabled = false, checked = 0
  const module = { exports: {} }, Marker = () => null
  new Function('require', 'module', 'exports', pageCode)(name => name === 'next/navigation' ? { notFound() { throw Error('NOT_FOUND') } } : name === '../../../lib/discovery/config.mjs' ? { discoveryConfig() { checked++; return { devMock: enabled } } } : name === './preview' ? { ResponsiveSitePreview: Marker } : require(name), module, module.exports)
  const Page = module.exports.default
  await assert.rejects(Page({ searchParams: Promise.resolve({}) }), /NOT_FOUND/)
  assert.equal(checked, 1)
  assert.deepEqual(module.exports.metadata.robots, { index: false, follow: false })
  enabled = true
  for (const [params, expected] of [[{}, { locale: 'bg', initialDevice: 'phone' }], [{ lang: 'en', device: 'laptop' }, { locale: 'en', initialDevice: 'laptop' }], [{ lang: 'script', device: 'external', src: 'https://example.invalid/' }, { locale: 'bg', initialDevice: 'phone' }]]) {
    const tree = await Page({ searchParams: Promise.resolve(params) })
    assert.equal(tree.type, Marker); assert.deepEqual(tree.props, expected)
  }
})

test('viewport presets and fit/zoom calculations use real CSS widths without silently resizing the inner document', () => {
  const { PREVIEW_DEVICES, previewFitScale, previewZoomStep } = harness()
  assert.deepEqual(PREVIEW_DEVICES, { phone: { widths: [320, 390, 430], width: 390, height: 844 }, laptop: { widths: [1280, 1440], width: 1440, height: 900 } })
  assert.equal(previewFitScale(422, 390), 1)
  assert.equal(previewFitScale(752, 1440), .5)
  assert.equal(previewFitScale(2000, 1440), 1)
  assert.equal(previewFitScale(0, 1440), .1)
  assert.equal(previewZoomStep(1, .25), 1.25)
  assert.equal(previewZoomStep(2, .25), 2)
  assert.equal(previewZoomStep(.5, -.25), .5)
})

test('BG and EN controls have full accessible labels, 44px targets, explicit pressed states and a meaningful iframe title', () => {
  for (const [locale, phone, laptop, fit, note] of [['bg', 'Телефон', 'Лаптоп', 'Побери', 'Само локално'], ['en', 'Phone', 'Laptop', 'Fit', 'Local only']]) {
    const tree = harness({ locale }).render(), frame = iframe(tree)
    assert.equal(button(tree, phone).props['aria-pressed'], true)
    assert.equal(button(tree, laptop).props['aria-pressed'], false)
    assert.equal(button(tree, fit).props['aria-pressed'], true)
    assert.ok(text(tree).includes(note))
    assert.equal(tree.props.lang, locale)
    const groups = elements(tree, node => node.props.role === 'group')
    assert.equal(groups.length, 2)
    assert.ok(groups.every(group => group.props['aria-label']))
    const label = elements(tree, node => node.type === 'label')[0]
    assert.ok(label && elements(label, node => node.type === 'select').length === 1, 'the width selector has a real associated label')
    assert.ok(elements(tree, node => node.type === 'button').every(node => node.props.type === 'button'))
    assert.match(frame.props.title, /GoRez/); assert.match(frame.props.title, /390 × 844 px/)
    assert.equal(elements(tree, node => node.type === 'output')[0].props['aria-live'], 'polite')
    assert.ok(renderToStaticMarkup(tree).includes('iframe'))
  }
})

test('device, size, fit and zoom interactions preserve one unkeyed iframe src and retain each device width and loaded state', () => {
  const fixture = harness(), first = fixture.render(), src = iframe(first).props.src
  assert.equal(src, '/dev/inline-discovery?lang=bg')
  iframe(first).props.onLoad()
  let tree = fixture.render()
  assert.equal(classed(tree, 'gorez-review-loading').length, 0)
  const choose = value => {
    const select = elements(tree, node => node.type === 'select')[0]
    select.props.onChange({ target: { value: String(value) } }); tree = fixture.render()
  }
  choose(430); assert.equal(iframe(tree).props.width, 430)
  choose(9999); assert.equal(iframe(tree).props.width, 430, 'unsupported arbitrary dimensions are ignored')
  button(tree, 'Лаптоп').props.onClick(); tree = fixture.render()
  assert.equal(iframe(tree).props.width, 1440); assert.equal(iframe(tree).props.height, 900)
  choose(1280); assert.equal(iframe(tree).props.width, 1280)
  button(tree, '100%').props.onClick(); tree = fixture.render()
  assert.equal(button(tree, '100%').props['aria-pressed'], true)
  assert.equal(iframe(tree).props.style.transform, 'scale(1)')
  button(tree, 'Увеличи').props.onClick(); tree = fixture.render()
  assert.equal(iframe(tree).props.style.transform, 'scale(1.25)')
  button(tree, 'Намали').props.onClick(); tree = fixture.render()
  assert.equal(iframe(tree).props.style.transform, 'scale(1)')
  button(tree, 'Телефон').props.onClick(); tree = fixture.render()
  assert.equal(iframe(tree).props.width, 430, 'phone selection survives a laptop round trip')
  button(tree, 'Побери').props.onClick(); tree = fixture.render()
  assert.equal(iframe(tree).props.src, src)
  assert.equal(iframe(tree).key, null)
  assert.equal(classed(tree, 'gorez-review-loading').length, 0, 'resizing never remounts/reloads the selected service')
  assert.doesNotMatch(source, /contentWindow\.location|\.src\s*=|<iframe[^>]*\bkey=|postMessage|window\.location|history\.(?:pushState|replaceState)/)
})

test('a single fixed same-origin fixture iframe blocks permissions/forms/popups and adds no fetch, booking or external service integration', async () => {
  for (const locale of ['bg', 'en']) {
    const tree = harness({ locale }).render(), frame = iframe(tree)
    assert.equal(frame.props.src, `/dev/inline-discovery?lang=${locale}`)
    assert.equal(frame.props.sandbox, 'allow-scripts allow-same-origin')
    assert.equal(frame.props.allow, "geolocation 'none'; camera 'none'; microphone 'none'")
    assert.equal(elements(tree, node => node.type === 'iframe').length, 1)
    const [link] = elements(tree, node => node.type === 'a')
    assert.equal(link.props.href, frame.props.src)
    assert.equal(link.props.target, '_blank'); assert.equal(link.props.rel, 'noopener noreferrer')
    assert.equal(elements(tree, node => node.type === 'form').length, 0)
  }
  assert.doesNotMatch(source, /\bfetch\s*\(|https?:\/\/|\.post\s*\(|getSupabase|createPublicBooking|trackSearchEvent|trackProductEvent|allow-forms|allow-popups|allow-top-navigation/)
  const existing = await read('app/dev/guided-discovery/preview.js')
  assert.match(existing, /<DiscoveryPage initialLocale=\{locale\} home preview cataloguePreview previewSearchEndpoint="\/dev\/guided-discovery\/search"/)
})

test('measurement observes only the host stage, updates fit scale and cleans up without accessing or replacing the iframe document', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver')
  let notify, observed, disconnected = false
  Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: class {
    constructor(callback) { notify = callback }
    observe(node) { observed = node }
    disconnect() { disconnected = true }
  } })
  try {
    const fixture = harness({ initialDevice: 'laptop' })
    fixture.render()
    const stage = { clientWidth: 752 }
    fixture.refs[1].current = stage
    const cleanup = fixture.layouts[0]()
    let tree = fixture.render()
    assert.equal(observed, stage)
    assert.equal(iframe(tree).props.width, 1440)
    assert.equal(iframe(tree).props.style.transform, 'scale(0.5)')
    assert.deepEqual(classed(tree, 'gorez-review-canvas')[0].props.style, { width: 720, height: 450 })
    stage.clientWidth = 1472; notify(); tree = fixture.render()
    assert.equal(iframe(tree).props.style.transform, 'scale(1)')
    assert.equal(iframe(tree).props.src, '/dev/inline-discovery?lang=bg')
    cleanup(); assert.equal(disconnected, true)
  } finally { if (previous) Object.defineProperty(globalThis, 'ResizeObserver', previous); else delete globalThis.ResizeObserver }
})

test('an already-loaded child clears the hydration-race loader, while about:blank waits and a pending real child installs one cleaned-up ready listener', () => {
  for (const readyState of ['complete', 'interactive']) {
    const fixture = harness(); fixture.render()
    const events = []
    fixture.refs[2].current = { contentDocument: { URL: 'http://127.0.0.1:30827/dev/inline-discovery?lang=bg', readyState,
      addEventListener: (...args) => events.push(['add', ...args]), removeEventListener: (...args) => events.push(['remove', ...args]),
    } }
    const cleanup = fixture.effects[1]()
    assert.equal(classed(fixture.render(), 'gorez-review-loading').length, 0)
    assert.equal(events.length, 0, 'a usable already-loaded child does not wait for another load event')
    cleanup(); assert.equal(events[0][0], 'remove')
  }
  for (const doc of [undefined, { URL: 'about:blank', readyState: 'complete' }]) {
    const fixture = harness(); fixture.render(); fixture.refs[2].current = { contentDocument: doc }
    assert.equal(fixture.effects[1](), undefined)
    assert.equal(classed(fixture.render(), 'gorez-review-loading').length, 1)
  }
  const fixture = harness(); fixture.render()
  let listener, removed = false
  fixture.refs[2].current = { contentDocument: { URL: 'http://127.0.0.1:30827/dev/inline-discovery?lang=bg', readyState: 'loading',
    addEventListener(name, callback, options) { assert.equal(name, 'DOMContentLoaded'); assert.deepEqual(options, { once: true }); listener = callback },
    removeEventListener(name, callback) { assert.equal(name, 'DOMContentLoaded'); assert.equal(callback, listener); removed = true },
  } }
  const cleanup = fixture.effects[1]()
  assert.equal(classed(fixture.render(), 'gorez-review-loading').length, 1)
  listener(); assert.equal(classed(fixture.render(), 'gorez-review-loading').length, 0)
  cleanup(); assert.equal(removed, true)
})

test('fullscreen requires a click, reports denial, and back-to-top resets both the child website and host stage without navigating', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const listeners = new Map(), calls = [], doc = { fullscreenEnabled: true, fullscreenElement: null,
    addEventListener(name, callback) { listeners.set(name, callback) }, removeEventListener(name, callback) { assert.equal(listeners.get(name), callback); listeners.delete(name) },
    async exitFullscreen() { calls.push('exit'); doc.fullscreenElement = null; listeners.get('fullscreenchange')() },
  }
  Object.defineProperty(globalThis, 'document', { configurable: true, value: doc })
  try {
    const fixture = harness(); fixture.render()
    const rootNode = { async requestFullscreen() { calls.push('enter'); doc.fullscreenElement = rootNode; listeners.get('fullscreenchange')() } }
    fixture.refs[0].current = rootNode
    fixture.refs[1].current = { scrollTo: options => calls.push({ target: 'stage', ...options }) }
    fixture.refs[2].current = { contentWindow: { scrollTo: options => calls.push({ target: 'site', ...options }) } }
    const cleanup = fixture.effects[0]()
    let tree = fixture.render()
    assert.equal(calls.length, 0, 'mount never requests full screen or moves the child')
    assert.equal(button(tree, 'Цял екран').props.disabled, false)
    await button(tree, 'Цял екран').props.onClick(); tree = fixture.render()
    assert.equal(text(button(tree, 'Изход от цял екран')), 'Изход от цял екран')
    await button(tree, 'Изход от цял екран').props.onClick(); tree = fixture.render()
    rootNode.requestFullscreen = async () => { throw Error('DENIED') }
    await button(tree, 'Цял екран').props.onClick(); tree = fixture.render()
    assert.match(text(classed(tree, 'gorez-review-message')[0]), /не е достъпен/)
    assert.equal(classed(tree, 'gorez-review-message')[0].props.role, 'status')
    button(tree, 'Най-горе').props.onClick()
    assert.deepEqual(calls, ['enter', 'exit', { target: 'site', top: 0, behavior: 'instant' }, { target: 'stage', top: 0, left: 0, behavior: 'instant' }])
    assert.equal(iframe(tree).props.src, '/dev/inline-discovery?lang=bg', 'scrolling to the top never reloads the inner application')
    cleanup(); assert.equal(listeners.size, 0)
  } finally { if (previous) Object.defineProperty(globalThis, 'document', previous); else delete globalThis.document }
})

test('review-only CSS remains host-scoped, keyboard-visible, touch-sized, scrollable at 100% and dark-theme aware without motion', async () => {
  const css = await read('app/dev/site-preview/preview.css')
  const { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
  const ast = parse(css)
  ast.walkRules(rule => {
    assert.ok(rule.selectors.every(selector => /\.gorez-(?:responsive-review|review-)/.test(selector)), rule.selector)
    assert.doesNotMatch(rule.selector, /\.discovery-query|\.discovery-form|\.home-business-card|\.inline-category-option/)
  })
  assert.match(css, /min-height:\s*44px/)
  assert.match(css, /:focus-visible/)
  assert.match(css, /\.gorez-review-stage[^}]*overflow:\s*auto/s)
  assert.match(css, /transform-origin:\s*top left/)
  assert.match(css, /html\[data-theme="dark"\]/)
  assert.doesNotMatch(css, /(?:animation|transition)\s*:/, 'the wrapper introduces no motion that needs a reduced-motion exception')
  ast.walkDecls('font', declaration => { if (/\binherit\b/.test(declaration.value)) assert.equal(declaration.value, 'inherit', 'inherit alone is valid, but cannot be mixed into a font shorthand') })
})
