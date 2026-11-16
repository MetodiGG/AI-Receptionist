import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as theme from '../lib/theme-preference.mjs'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

function browser({ initial = 'light', stored = null, blockRead = false, blockWrite = false, blockAccess = false } = {}) {
  const attributes = new Map([['data-theme', initial]]), data = new Map(), listeners = new Map(), writes = []
  if (stored !== null) data.set(theme.THEME_STORAGE_KEY, stored)
  const localStorage = {
    getItem(key) { if (blockRead) throw new Error('Storage read is disabled'); return data.get(key) ?? null },
    setItem(key, value) { if (blockWrite) throw new Error('Storage write is disabled'); writes.push([key, value]); data.set(key, value) },
  }
  const documentElement = { getAttribute: key => attributes.get(key) ?? null, setAttribute: (key, value) => attributes.set(key, value), style: {} }
  const window = {
    document: { documentElement },
    get localStorage() { if (blockAccess) throw new Error('Storage access is disabled'); return localStorage },
    sessionStorage: {},
    Event: class Event { constructor(type) { this.type = type } },
    addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(callback) },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback) },
    dispatchEvent(event) { for (const listener of [...listeners.get(event.type) || []]) listener(event); return true },
  }
  return { window, attributes, data, localStorage, writes, listeners, emit: event => window.dispatchEvent(event) }
}

function bootstrap(fixture) {
  const context = { window: fixture.window, document: fixture.window.document }
  Object.defineProperty(context, 'localStorage', { get: () => fixture.window.localStorage })
  runInNewContext(theme.THEME_BOOTSTRAP_SCRIPT, context, { timeout: 1000 })
}

function withBrowser(fixture, callback) {
  const descriptors = ['window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  Object.defineProperty(globalThis, 'window', { configurable: true, value: fixture.window })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: fixture.window.document })
  try { return callback() } finally {
    for (const [key, descriptor] of descriptors) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]
  }
}

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const toggleSource = await read('components/theme-toggle.js')
const { code } = await transform(toggleSource, { filename: 'components/theme-toggle.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
function loadToggle(react = React) {
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name === 'react' ? react : name === '../lib/theme-preference.mjs' ? theme : name === './icon' ? { Icon: ({ name }) => React.createElement('svg', { 'data-icon': name, 'aria-hidden': true }) } : require(name), module, module.exports)
  return module.exports.ThemeToggle
}
const ThemeToggle = loadToggle()

test('the moon artwork is a stable solid crescent silhouette, not a platform emoji or the previous outline', async () => {
  const { code: iconCode } = await transform(await read('components/icon.js'), { filename: 'components/icon.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', iconCode)(require, module, module.exports)
  const html = renderToStaticMarkup(React.createElement(module.exports.Icon, { name: 'moon' }))
  assert.match(html, /M8\.2 2\.3A10 10 0 1 1 3\.2 18\.1A10\.4 10\.4 0 0 0 8\.2 2\.3Z/)
  assert.match(html, /fill="currentColor" stroke="none"/)
  assert.doesNotMatch(html, /20\.9 13\.2|<image|<img|🌙/)
})

test('theme preferences accept only explicit supported values and retain the original light default', () => {
  assert.equal(theme.THEME_STORAGE_KEY, 'gorez.theme')
  for (const value of [undefined, null, '', 'system', 'Dark', 'auto', 1, '<script>dark</script>']) assert.equal(theme.normalizeTheme(value), 'light')
  assert.equal(theme.normalizeTheme('dark'), 'dark')
  assert.equal(theme.normalizeTheme('light'), 'light')
  assert.equal(theme.getServerThemeSnapshot(), 'light')
  assert.equal(theme.getThemeSnapshot(), 'light', 'server imports do not need browser globals')
})

test('the before-paint bootstrap restores either stored preference without writing storage', () => {
  for (const value of ['light', 'dark']) {
    const fixture = browser({ initial: value === 'light' ? 'dark' : 'light', stored: value })
    bootstrap(fixture)
    assert.equal(fixture.attributes.get('data-theme'), value)
    assert.deepEqual(fixture.writes, [])
  }
})

test('missing, malformed and unavailable stored preferences bootstrap safely to light', () => {
  for (const options of [{}, { stored: 'invalid' }, { stored: 'dark; color:red' }, { blockRead: true }, { blockAccess: true }]) {
    const fixture = browser({ initial: 'dark', ...options })
    assert.doesNotThrow(() => bootstrap(fixture))
    assert.equal(fixture.attributes.get('data-theme'), 'light')
  }
})

test('a chosen theme updates the active document, persists for reload, and returns its normalized value', () => {
  const fixture = browser()
  assert.equal(theme.setTheme('dark', fixture.window), 'dark')
  assert.equal(fixture.attributes.get('data-theme'), 'dark')
  assert.deepEqual(fixture.writes, [[theme.THEME_STORAGE_KEY, 'dark']])
  const reloaded = browser({ stored: fixture.data.get(theme.THEME_STORAGE_KEY) })
  bootstrap(reloaded)
  assert.equal(reloaded.attributes.get('data-theme'), 'dark')
  assert.equal(theme.setTheme('light', fixture.window), 'light')
  assert.equal(fixture.attributes.get('data-theme'), 'light')
  assert.equal(fixture.data.get(theme.THEME_STORAGE_KEY), 'light')
})

test('changing themes stays functional for the current page when local storage is blocked', () => {
  for (const options of [{ blockWrite: true }, { blockAccess: true }]) {
    const fixture = browser(options)
    assert.doesNotThrow(() => theme.setTheme('dark', fixture.window))
    assert.equal(theme.getThemeSnapshot(fixture.window), 'dark')
    assert.doesNotThrow(() => theme.setTheme('light', fixture.window))
    assert.equal(theme.getThemeSnapshot(fixture.window), 'light')
  }
})

test('current theme snapshots come from the document even if storage is stale or unavailable', () => {
  assert.equal(theme.getThemeSnapshot(browser({ initial: 'dark', stored: 'light' }).window), 'dark')
  assert.equal(theme.getThemeSnapshot(browser({ initial: 'light', stored: 'dark' }).window), 'light')
  assert.equal(theme.getThemeSnapshot(browser({ initial: 'dark', blockAccess: true }).window), 'dark')
  assert.equal(theme.getThemeSnapshot(browser({ initial: 'invalid', stored: 'dark' }).window), 'light')
})

test('server-side preference helpers return harmless snapshots and cleanup functions without browser globals', () => {
  assert.equal(theme.setTheme('dark'), 'dark')
  assert.equal(theme.getThemeSnapshot(), 'light')
  const off = theme.subscribeTheme(() => assert.fail('a server snapshot must not notify browser listeners'))
  assert.equal(typeof off, 'function')
  assert.doesNotThrow(off)
})

test('invalid writes or cross-tab values can never become arbitrary root attributes or preference values', () => {
  const fixture = browser({ initial: 'dark' })
  assert.equal(theme.setTheme('sepia" data-injected="yes', fixture.window), 'light')
  assert.equal(fixture.attributes.get('data-theme'), 'light')
  assert.equal(fixture.data.get(theme.THEME_STORAGE_KEY), 'light')
  const off = theme.subscribeTheme(() => {}, fixture.window)
  fixture.emit({ type: 'storage', key: theme.THEME_STORAGE_KEY, newValue: 'DARK', storageArea: fixture.localStorage })
  assert.equal(fixture.attributes.get('data-theme'), 'light')
  assert.equal(fixture.attributes.size, 1)
  off()
})

test('same-tab controls synchronize immediately and unsubscribe without leaving active listeners', () => {
  const fixture = browser(), first = [], second = []
  const offFirst = theme.subscribeTheme(() => first.push(theme.getThemeSnapshot(fixture.window)), fixture.window)
  const offSecond = theme.subscribeTheme(() => second.push(theme.getThemeSnapshot(fixture.window)), fixture.window)
  theme.setTheme('dark', fixture.window)
  assert.deepEqual(first, ['dark']); assert.deepEqual(second, ['dark'])
  offFirst()
  theme.setTheme('light', fixture.window)
  assert.deepEqual(first, ['dark']); assert.deepEqual(second, ['dark', 'light'])
  offSecond()
  assert.ok([...fixture.listeners.values()].every(listeners => listeners.size === 0))
})

test('cross-tab preference updates change the current theme without writing back in a storage event loop', () => {
  const fixture = browser(), snapshots = []
  const off = theme.subscribeTheme(() => snapshots.push(theme.getThemeSnapshot(fixture.window)), fixture.window)
  fixture.emit({ type: 'storage', key: theme.THEME_STORAGE_KEY, newValue: 'dark', storageArea: fixture.localStorage })
  assert.equal(fixture.attributes.get('data-theme'), 'dark')
  assert.deepEqual(snapshots, ['dark'])
  fixture.emit({ type: 'storage', key: theme.THEME_STORAGE_KEY, newValue: 'light', storageArea: fixture.localStorage })
  assert.equal(fixture.attributes.get('data-theme'), 'light')
  assert.deepEqual(fixture.writes, [])
  off()
})

test('unrelated keys and session storage never alter the public theme', () => {
  const fixture = browser(), snapshots = []
  const off = theme.subscribeTheme(() => snapshots.push(theme.getThemeSnapshot(fixture.window)), fixture.window)
  fixture.emit({ type: 'storage', key: 'other.setting', newValue: 'dark', storageArea: fixture.localStorage })
  fixture.emit({ type: 'storage', key: theme.THEME_STORAGE_KEY, newValue: 'dark', storageArea: fixture.window.sessionStorage })
  assert.equal(fixture.attributes.get('data-theme'), 'light')
  assert.deepEqual(snapshots, [])
  off()
})

test('removed or cleared cross-tab preferences reset to the same light fallback as a fresh visit', () => {
  for (const key of [theme.THEME_STORAGE_KEY, null]) {
    const fixture = browser({ initial: 'dark', stored: 'dark' })
    const off = theme.subscribeTheme(() => {}, fixture.window)
    fixture.emit({ type: 'storage', key, newValue: null, storageArea: fixture.localStorage })
    assert.equal(fixture.attributes.get('data-theme'), 'light')
    off()
  }
})

test('server-rendered toggles are accessible localized native buttons with an identical light hydration snapshot', () => {
  for (const [locale, label] of [['bg', 'Включи тъмен режим'], ['en', 'Switch to dark mode']]) {
    const fixture = browser({ initial: 'dark', stored: 'dark' })
    const html = withBrowser(fixture, () => renderToStaticMarkup(React.createElement(ThemeToggle, { locale })))
    assert.match(html, /<button type="button" class="theme-toggle"/)
    assert.ok(html.includes(`aria-label="${label}"`))
    assert.ok(html.includes(`title="${label}"`))
    assert.match(html, /aria-pressed="false"/)
    assert.match(html, /data-icon="moon"/)
    assert.doesNotMatch(html, /disabled|tabindex|<input|<img|<canvas/)
  }
})

test('the actual toggle switches both ways with matching localized action names, pressed state and artwork', () => {
  const Toggle = loadToggle({ ...React, useSyncExternalStore: (_subscribe, snapshot) => snapshot() })
  for (const locale of ['bg', 'en']) {
    const fixture = browser()
    withBrowser(fixture, () => {
      let button = Toggle({ locale })
      assert.equal(button.props['aria-pressed'], false)
      assert.equal(button.props.children.props.name, 'moon')
      button.props.onClick()
      button = Toggle({ locale })
      assert.equal(button.props['aria-pressed'], true)
      assert.equal(button.props['aria-label'], locale === 'en' ? 'Switch to light mode' : 'Включи светъл режим')
      assert.equal(button.props.children.props.name, 'sun')
      button.props.onClick()
      button = Toggle({ locale })
      assert.equal(button.props['aria-pressed'], false)
      assert.equal(button.props['aria-label'], locale === 'en' ? 'Switch to dark mode' : 'Включи тъмен режим')
      assert.equal(button.props.children.props.name, 'moon')
      assert.equal(fixture.data.get(theme.THEME_STORAGE_KEY), 'light')
    })
  }
})

test('theme restoration and controls need no provider, paid integration, cookies, network request or booking mutation', async () => {
  const source = await read('lib/theme-preference.mjs')
  assert.doesNotMatch(source + toggleSource, /fetch\s*\(|XMLHttpRequest|WebSocket|document\.cookie|supabase|\/api\/|location\.href|setInterval|matchMedia|innerHTML|eval\s*\(/)
  assert.match(toggleSource, /useSyncExternalStore/)
  assert.doesNotMatch(toggleSource, /useState\s*\(|useEffect\s*\(|suppressHydrationWarning/)
  assert.doesNotMatch(theme.THEME_BOOTSTRAP_SCRIPT, /<\/script|https?:|setItem/)
})

test('the native head bootstrap precedes page content while the root layout remains a server component', async () => {
  const layout = await read('app/layout.js')
  const cssImports = [...layout.matchAll(/import '\.\/([^']+\.css)'/g)].map(match => match[1])
  assert.equal(cssImports.at(-1), 'dark-mode.css', 'dark overrides follow the original light styles in production too')
  assert.match(layout, /import \{ THEME_BOOTSTRAP_SCRIPT \} from '\.\.\/lib\/theme-preference\.mjs'/)
  assert.match(layout, /<html[^>]*data-theme="light"[^>]*suppressHydrationWarning/)
  assert.match(layout, /<head><script id="gorez-theme" dangerouslySetInnerHTML=\{\{ __html: THEME_BOOTSTRAP_SCRIPT \}\}\/\><\/head>/)
  assert.ok(layout.indexOf('id="gorez-theme"') < layout.indexOf('<body>'))
  assert.doesNotMatch(layout, /['"]use client['"]|await cookies\(|localStorage\.getItem/)
})

test('public headers place one theme control immediately beside the unchanged language switch, without adding controls to owner/admin shells', async () => {
  for (const file of ['marketing-navigation', 'public-booking-page', 'legal-page', 'business-login', 'password-recovery', 'customer-account', 'review-form']) {
    const source = await read(`components/${file}.js`)
    assert.match(source, /import \{ ThemeToggle \} from '\.\/theme-toggle'/, file)
    assert.match(source, /<ThemeToggle locale=\{(?:locale|language)\}\/\>\s*<LanguageSwitch locale=\{(?:locale|language)\}/, file)
    assert.equal((source.match(/<ThemeToggle /g) || []).length, 1, file)
  }
  for (const file of ['dashboard-shell', 'platform-admin', 'review-admin']) assert.doesNotMatch(await read(`components/${file}.js`), /ThemeToggle/, file)
  const language = await read('components/language-switch.js')
  assert.match(language, /<CountryFlag locale=\{locale\}/)
  assert.doesNotMatch(language, /ThemeToggle|localStorage|data-theme/)
})

test('the moon has a stable 44px native touch target, an independent focus ring and reduced-motion support', async () => {
  const css = await read('app/header-controls.css')
  const control = css.match(/^\.theme-toggle \{([^}]+)\}/m)?.[1]
  assert.ok(control)
  for (const declaration of ['flex:0 0 44px', 'width:44px', 'min-width:44px', 'height:44px', 'min-height:44px']) assert.ok(control.includes(declaration), declaration)
  assert.match(css, /\.theme-toggle > svg \{[^}]*width:22px; height:22px/)
  assert.match(css, /\.theme-toggle:focus-visible \{ outline:3px solid/)
  assert.match(css, /@media \(prefers-reduced-motion:reduce\) \{ \.theme-toggle \{ transition:none/)
  assert.match(css, /@media \(max-width:389px\)/)
  assert.match(css, /launch-nav-actions:has\(>\.theme-toggle\)/)
})

function contrast(first, second) {
  const luminance = hex => {
    const values = hex.replace('#', '').match(/.{2}/g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722
  }
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (values[0] + .05) / (values[1] + .05)
}

test('dark public text, price accents, booking actions and calendar states retain readable foreground contrast', async () => {
  const css = await read('app/dark-mode.css')
  const root = css.match(/html\[data-theme="dark"\] \{([^}]+)\}/)?.[1]
  assert.ok(root)
  const tokens = Object.fromEntries([...root.matchAll(/(--dm-[\w-]+):\s*(#[a-f\d]{6})/gi)].map(match => [match[1], match[2]]))
  for (const foreground of ['--dm-ink', '--dm-muted', '--dm-orange']) for (const background of ['--dm-paper', '--dm-surface', '--dm-raised']) {
    const ratio = contrast(tokens[foreground], tokens[background])
    assert.ok(ratio >= 4.5, `${foreground} on ${background}: ${ratio.toFixed(2)}`)
  }
  const actionColors = css.match(/--action-top:#edbd93; --action-bottom:#dca471;[^}]*--action-ink:#2b1d13/)
  assert.ok(actionColors, 'booking button uses a deliberately contrasted peach surface and dark text')
  for (const [foreground, background] of [
    ['#2b1d13', '#edbd93'], ['#2b1d13', '#dca471'],
    ['#f7d2ad', '#403025'], ['#f7d2ad', '#35271f'],
    [tokens['--dm-green-ink'], tokens['--dm-green']],
    ['#ffe1bd', '#654729'], ['#b2a79c', '#2f2a25'],
  ]) assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`)
})

test('dark service names override the list foreground itself while prices and service conditions keep their separate readable accents', async () => {
  const css = (await read('app/dark-mode.css')).replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim(), body }))
  const list = rules.find(rule => rule.selector === 'html[data-theme="dark"] .marketing-page .home-business-services')
  assert.ok(list, 'a light-text card is insufficient when the service list owns a hard-coded dark foreground')
  assert.match(list.body, /(?:^|;)\s*color:\s*var\(--dm-ink\)\s*;/)
  const price = rules.find(rule => rule.selector.includes('.home-business-services .home-service-price'))
  const condition = rules.find(rule => rule.selector.includes('.home-business-services :is(.home-service-condition,.service-price-unit)'))
  assert.ok(price); assert.match(price.body, /(?:^|;)\s*color:\s*var\(--dm-orange\)\s*;/)
  assert.ok(condition); assert.match(condition.body, /(?:^|;)\s*color:\s*var\(--dm-muted\)\s*;/)
  const root = rules.find(rule => rule.selector === 'html[data-theme="dark"]')
  const tokens = Object.fromEntries([...root.body.matchAll(/(--dm-[\w-]+):\s*(#[a-f\d]{6})/gi)].map(match => [match[1], match[2]]))
  for (const foreground of ['--dm-ink', '--dm-orange', '--dm-muted']) {
    const ratio = contrast(tokens[foreground], tokens['--dm-surface'])
    assert.ok(ratio >= 4.5, `service foreground ${foreground} on the actual card surface: ${ratio.toFixed(2)}`)
  }
})

test('dark styling is opt-in, public-scoped and color-only, preserving artwork, geometry and disabled calendar semantics', async () => {
  const css = await read('app/dark-mode.css'), clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const root = clean.match(/html\[data-theme="dark"\] \{([^}]+)\}/)?.[1]
  assert.doesNotMatch(root, /--(?:ink|paper|surface|forest):|color-scheme:/, 'owner/admin compatibility tokens are not changed globally')
  assert.match(clean, /html\[data-theme="dark"\] :is\(\.marketing-page,\.public-booking-page/)
  assert.doesNotMatch(clean, /\.dashboard|\.app-shell|\.platform-admin|\.admin-console/)
  assert.doesNotMatch(clean, /filter\s*:|\bimg\b|\.gorez-mark-image|\.booking-calendar-icon/)
  assert.doesNotMatch(clean, /(?:^|[;{])\s*(?:display|position|width|height|min-width|max-width|min-height|max-height|padding|margin|gap|grid-template-columns|grid-template-rows|transform|pointer-events|visibility|overflow)\s*:/)
  assert.match(clean, /\.monthly-calendar-day\.is-available/)
  assert.match(clean, /\.monthly-calendar-day\.is-selected/)
  assert.match(clean, /\.monthly-calendar-day\.is-unavailable/)
  assert.match(clean, /linear-gradient\(135deg,transparent calc\(50% - \.6px\),#81766c 50%,transparent calc\(50% \+ \.6px\)\)/, 'unavailable dates keep a diagonal visual strike')
})
