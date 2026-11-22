import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { reviewedDiscoveryFileChange, DISCOVERY_NEW_MEDIA } from './discovery-refinement-20261122-scope.mjs'
import { nextSecurityUpgradeAllowsFileChange } from './next-security-upgrade-scope.mjs'
import { stationaryDiscoveryAllowsFileChange } from './stationary-discovery-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const baseline = 'c9e525b'
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const require = createRequire(import.meta.url)
const { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
const inline = parse(await read('app/inline-discovery.css'))
const cards = parse(await read('app/premium-discovery-cards.css'))
const darkSelector = /(?:^|,\s*)html\[data-theme=["']?dark["']?\]/
const declarations = rule => Object.fromEntries(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]))
const rules = ast => { const found = []; ast.walkRules(rule => found.push(rule)); return found }
const inlineRules = rules(inline), cardRules = rules(cards)
function tokens(astRules, prefix, dark = false) {
  const found = {}
  for (const rule of astRules) {
    if (!dark && darkSelector.test(rule.selector)) continue
    for (const [name, value] of Object.entries(declarations(rule))) if (name.startsWith(prefix)) found[name] = value
  }
  return found
}
const inlineLight = tokens(inlineRules, '--inline-'), inlineDark = tokens(inlineRules, '--inline-', true)
const cardLight = tokens(cardRules, '--premium-card-'), cardDark = tokens(cardRules, '--premium-card-', true)
function resolve(value, values) {
  const variable = value?.match(/^var\((--[\w-]+)\)$/)
  return variable ? resolve(values[variable[1]], values) : value
}
function rgba(hex) {
  assert.match(hex, /^#[\da-f]{6}(?:[\da-f]{2})?$/i)
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16))
  return [...channels.slice(0, 3), channels.length === 4 ? channels[3] / 255 : 1]
}
function luminance(color) {
  const [r, g, b] = (typeof color === 'string' ? rgba(color) : color).slice(0, 3).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  return .2126 * r + .7152 * g + .0722 * b
}
function contrast(first, second) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (light + .05) / (dark + .05)
}
function composite(foreground, background, opacity) {
  const over = typeof foreground === 'string' ? rgba(foreground) : foreground
  const under = typeof background === 'string' ? rgba(background) : background
  const alpha = opacity ?? over[3]
  return over.slice(0, 3).map((value, index) => value * alpha + under[index] * (1 - alpha))
}
function readable(foreground, background, label, minimum = 4.5) {
  const actual = contrast(foreground, background)
  assert.ok(actual >= minimum, `${label}: ${actual.toFixed(3)}:1 must reach ${minimum}:1`)
}

test('existing light/dark semantic panel text and focus tokens retain normal-text AA', () => {
  for (const [theme, values] of [['light', inlineLight], ['dark', inlineDark]]) {
    for (const foreground of ['--inline-ink', '--inline-muted']) {
      for (const background of ['--inline-surface', '--inline-raised', '--inline-selected', '--inline-hover']) readable(values[foreground], values[background], `${theme} ${foreground} / ${background}`)
    }
    for (const background of ['--inline-surface', '--inline-selected', '--inline-hover']) readable(values['--inline-accent'], values[background], `${theme} tile focus`, 3)
  }
})

test('photo-forward captions and localized small counts retain AA over the brightest/darkest possible photos', () => {
  const hasCaption = selector => /\.inline-(?:category|service)-caption/.test(selector)
  const background = rule => resolve(declarations(rule).background, inlineLight)
  const captionRule = inlineRules.find(rule => hasCaption(rule.selector) && !rule.selector.includes('aria-pressed') && /^#[\da-f]{8}$/i.test(background(rule) || ''))
  const selectedRule = inlineRules.find(rule => hasCaption(rule.selector) && rule.selector.includes('aria-pressed') && /^#[\da-f]{8}$/i.test(background(rule) || ''))
  assert.ok(captionRule); assert.ok(selectedRule)
  const caption = declarations(captionRule), selected = declarations(selectedRule)
  assert.equal(background(captionRule).toUpperCase(), '#2F211B99')
  assert.equal(background(selectedRule).toUpperCase(), '#432318B3')
  const scrim = inlineRules.find(rule => /::(?:before|after)/.test(rule.selector) && /--inline-photo-scrim-start|#2f211b26/i.test(declarations(rule).background || ''))
  assert.ok(scrim, 'the full-tile scrim is separate from the stable text backplate')
  const gradient = declarations(scrim).background.replace(/var\((--[\w-]+)\)/g, (_match, name) => inlineLight[name])
  const stops = [...gradient.matchAll(/#[\da-f]{8}\b/gi)].map(match => match[0])
  assert.deepEqual([stops[0], stops.at(-1)].map(stop => stop.toUpperCase()), ['#2F211B26', '#2F211BB3'])
  const count = declarations(inlineRules.find(rule => rule.selector === '.inline-service-count'))
  const label = declarations(inlineRules.find(rule => rule.selectors.includes('.inline-category-label')))
  const tile = declarations(inlineRules.find(rule => rule.selectors.includes('.inline-category-option') && declarations(rule).color))
  const primary = resolve([label.color, caption.color, tile.color].find(color => color && color !== 'inherit'), inlineLight)
  const secondary = resolve(count.color, inlineLight)
  assert.equal(primary.toUpperCase(), '#FFF4E8')
  assert.equal(secondary.toUpperCase(), '#FFF2E7')
  assert.equal(count.opacity || '1', '1', 'localized small counts must not fade below their verified contrast')
  assert.equal(count['font-size'], '.75rem', 'localized small counts keep normal-text AA, not a large-text exemption')
  for (const backdrop of ['#000000', '#FFFFFF']) for (const stop of stops) {
    const photo = composite(stop, backdrop)
    for (const [state, plate] of [['default', background(captionRule)], ['selected', background(selectedRule)]]) {
      const composed = composite(plate, photo)
      readable(primary, composed, `${state} caption over ${backdrop} / ${stop}`)
      readable(secondary, composed, `${state} small count over ${backdrop} / ${stop}`)
    }
  }
})

test('the compact menu removes the All row while retaining contrasted selected photo rings and vector checks', () => {
  assert.ok(!inlineRules.some(rule => /\.inline-service-all\b/.test(rule.selector)), 'the removed full-width action cannot leave stale selected styling')
  const selectedFrame = inlineRules.find(rule => rule.selectors.includes('.inline-service-tile[aria-pressed="true"]::after') && declarations(rule).padding === '2px')
  assert.ok(selectedFrame)
  assert.equal(declarations(selectedFrame).background, 'var(--inline-photo-selected-edge)')
  const check = declarations(inlineRules.find(rule => rule.selector === '.inline-tile-check'))
  const stops = [...check.background.matchAll(/#[\da-f]{6}\b/gi)].map(match => rgba(match[0]))
  assert.equal(stops.length, 2)
  for (let step = 0; step <= 100; step++) {
    const background = stops[0].slice(0, 3).map((value, index) => value + (stops[1][index] - value) * step / 100)
    readable(check.color, background, `selected vector check ${step}%`)
  }
})

test('glass panels retain AA at both actual opacity endpoints, including conservative backdrop extremes', () => {
  const glass = inlineRules.find(rule => rule.selector.includes('.inline-discovery-categories') && /color-mix/.test(declarations(rule).background || ''))
  const alpha = [...declarations(glass).background.matchAll(/var\(--inline-surface\)\s*(\d+)%/g)].map(match => Number(match[1]) / 100)
  assert.deepEqual(alpha, [.89, .94])
  for (const [theme, values] of [['light', inlineLight], ['dark', inlineDark]]) {
    for (const opacity of alpha) for (const backdrop of ['#000000', '#FFFFFF']) {
      const background = composite(values['--inline-surface'], backdrop, opacity)
      for (const foreground of ['--inline-ink', '--inline-muted']) readable(values[foreground], background, `${theme} glass ${opacity} over ${backdrop}`)
    }
  }
})

test('photographic stationary selection labels, real counts and focus retain AA in both themes', () => {
  const base = declarations(inlineRules.find(rule => rule.selector === '.inline-summary' && declarations(rule).color))
  const label = declarations(inlineRules.find(rule => rule.selector === '.inline-summary-selection-label' && declarations(rule).color))
  const primary = declarations(inlineRules.find(rule => rule.selector === '.inline-summary-selection-label.is-primary'))
  const count = declarations(inlineRules.find(rule => rule.selector === '.inline-summary-count'))
  assert.match(base.background, /linear-gradient\(var\(--inline-summary-surface\)/)
  assert.equal(base.color, 'var(--inline-ink)')
  assert.equal(label.color, 'var(--inline-summary-ink)')
  assert.equal(primary.color, 'var(--inline-ink)')
  assert.equal(count.color, 'var(--inline-summary-ink)')
  for (const [theme, values] of [['light', inlineLight], ['dark', inlineDark]]) {
    for (const surface of ['--inline-summary-surface', '--inline-summary-chip', '--inline-selected', '--inline-hover']) {
      readable(values['--inline-summary-ink'], values[surface], `${theme} compact breadcrumb text / ${surface}`)
      readable(values['--inline-ink'], values[surface], `${theme} primary selection and count / ${surface}`)
      readable(values['--inline-accent'], values[surface], `${theme} compact breadcrumb focus / ${surface}`, 3)
    }
    for (const backdrop of ['#000000', '#FFFFFF']) for (const foreground of ['--inline-summary-ink', '--inline-ink']) readable(values[foreground], composite(values['--inline-summary-surface'], backdrop, .94), `${theme} compact glass over ${backdrop}`)
  }
  assert.ok(!inlineRules.some(rule => /\.inline-summary-(?:sort|area|context|meta)\b/.test(rule.selector)), 'removed sorting and duplicate controls leave no misleading visual controls')
})

test('actual card labels, service chips and all booking gradients retain normal-text AA in both themes', () => {
  for (const [theme, values] of [['light', cardLight], ['dark', cardDark]]) {
    for (const foreground of ['--premium-card-ink', '--premium-card-muted', '--premium-card-accent']) {
      for (const background of ['--premium-card-surface', '--premium-card-raised']) readable(values[foreground], values[background], `${theme} card ${foreground} / ${background}`)
    }
    for (const background of ['--premium-card-surface', '--premium-card-raised']) readable(values['--premium-card-focus'], values[background], `${theme} card focus`, 3)
    const gradients = cardRules.filter(rule => rule.selector.includes('.home-reserve') && /^linear-gradient/.test(declarations(rule).background || ''))
    assert.equal(gradients.length, 2, 'test the real default and hover/focus/active booking fills')
    for (const rule of gradients) {
      const style = declarations(rule)
      assert.equal(style.color.toLowerCase(), '#2f211b', 'booking text stays espresso in dark mode too')
      const colors = [...style.background.matchAll(/#[\da-f]{6,8}\b|var\(--[\w-]+\)/gi)].map(match => rgba(resolve(match[0], values)))
      assert.equal(colors.length, 2)
      for (let step = 0; step <= 100; step++) {
        const background = colors[0].slice(0, 3).map((value, index) => value + (colors[1][index] - value) * step / 100)
        readable(style.color, background, `${theme} booking gradient ${step}%`)
      }
    }
  }
  assert.equal(cardLight['--premium-card-booking'].toUpperCase(), '#F47A36')
  assert.equal(cardDark['--premium-card-booking'].toUpperCase(), '#FDB681')
})

function ancestorsApply(rule, viewport, container, font) {
  for (let parent = rule.parent; parent?.type !== 'root'; parent = parent.parent) {
    if (parent.type !== 'atrule') continue
    if (parent.name === 'media') for (const [, bound, pixels] of parent.params.matchAll(/(min|max)-width:\s*(\d+)px/g)) {
      if (bound === 'min' && viewport < Number(pixels) || bound === 'max' && viewport > Number(pixels)) return false
    }
    if (parent.name === 'container') {
      const max = parent.params.match(/max-width:\s*([\d.]+)rem/)
      if (max && container > Number(max[1]) * font) return false
    }
  }
  return true
}
function columns(selector, viewport, container, font = 16) {
  let count
  for (const rule of inlineRules) {
    if (!rule.selectors.includes(selector) || !ancestorsApply(rule, viewport, container, font)) continue
    const value = declarations(rule)['grid-template-columns']
    if (value) count = Number(value.match(/^repeat\((\d+),/)?.[1] || (value === 'minmax(0,1fr)' ? 1 : NaN))
  }
  return count
}

test('CSS declares matching 2/3/4 category and child columns with font-relative escape routes', () => {
  assert.deepEqual([columns('.inline-category-grid', 390, 334), columns('.inline-category-grid', 820, 740), columns('.inline-category-grid', 1280, 1080)], [2, 3, 4])
  assert.deepEqual([columns('.inline-service-grid', 390, 334), columns('.inline-service-grid', 820, 740), columns('.inline-service-grid', 1280, 1080)], [2, 3, 4])
  assert.equal(columns('.inline-category-grid', 1100, 900, 32), 2, 'enlarged root font triggers the 32rem category reflow')
  for (const selector of ['.inline-category-grid', '.inline-service-grid']) assert.equal(columns(selector, 320, 252, 24), 1, `${selector}: larger default type wins over fixed column count`)
  for (const selector of ['.inline-category-label', '.inline-service-label', '.inline-summary-selection-label > span']) {
    const style = declarations(inlineRules.find(rule => rule.selectors.includes(selector)))
    assert.equal(style['white-space'], 'normal'); assert.equal(style['word-break'], 'normal')
    assert.notEqual(style['text-overflow'], 'ellipsis')
  }
})

test('stationary photographic glass and 44px selection controls are scoped away from the unchanged main search form', async () => {
  const summary = declarations(inlineRules.find(rule => rule.selector === '.inline-summary' && declarations(rule).position))
  assert.equal(summary.position, 'static'); assert.equal(summary.top, undefined)
  assert.ok(!inlineRules.some(rule => rule.selector.includes('data-sticky-safe')))
  for (const rule of inlineRules.filter(rule => rule.selector.includes('.inline-summary'))) assert.ok(!['sticky', 'fixed'].includes(declarations(rule).position))
  const offsets = inlineRules.filter(rule => declarations(rule)['scroll-margin-top'])
  for (const selector of ['.home-business-grid > li', '.home-section-heading h2']) {
    const offset = offsets.find(rule => rule.selector.includes(selector))
    assert.ok(offset)
    assert.equal(declarations(offset)['scroll-margin-top'], '24px', 'ordinary scrolling is not offset by a nonexistent sticky bar')
  }
  const first = offsets.find(rule => rule.selector.endsWith('.home-business-grid > li:first-child'))
  assert.equal(declarations(first)['scroll-margin-top'], 'calc(var(--inline-summary-offset,0px) + 3rem)', 'deliberate service selection keeps its measured context and heading above the first actual business')
  const shell = declarations(inlineRules.find(rule => rule.selector === '.marketing-page.customer-home.quick-choice:has(.inline-discovery-categories)'))
  assert.equal(shell['overflow-x'], 'clip'); assert.equal(shell['overflow-y'], 'visible')
  const chips = declarations(inlineRules.find(rule => rule.selectors.includes('.inline-summary-selection-label') && declarations(rule)['min-height']))
  assert.equal(chips['min-height'], '44px'); assert.equal(chips['min-width'], '44px')
  assert.ok(!inlineRules.some(rule => rule.selector === '.inline-summary-sort select'), 'the removed non-functional sort is not a phantom touch target')
  // Match actual tag selectors, not the word "form" within the explicitly
  // scoped existing .outbound-booking-form class inside business actions.
  const searchSelector = /(?:^|[\s,>+~(])(?:h1|form)(?![\w-])|\.discovery-query|\.discovery-form|\.home-search|\.home-discovery-heading/
  for (const selector of ['form', '.card form.outbound-booking-form', ':is(form,.other)', 'h1.hero', '.discovery-form']) assert.match(selector, searchSelector)
  assert.doesNotMatch('.home-business-actions > .outbound-booking-form', searchSelector)
  for (const rule of [...inlineRules, ...cardRules]) {
    assert.doesNotMatch(rule.selector, searchSelector)
    for (const name of Object.keys(declarations(rule))) assert.doesNotMatch(name, /^--(?:paper|ink|ink-soft|surface|line|accent|forest)$/)
  }
  const source = await read('components/discovery-search.js')
  const form = value => { const start = value.indexOf('<form className="discovery-form"'); const end = value.indexOf('</form>', start) + 7; assert.ok(start >= 0 && end > start); return value.slice(start, end) }
  const original = execFileSync('git', ['show', `${baseline}:components/discovery-search.js`], { cwd: root, encoding: 'utf8' })
  assert.equal(form(source), form(original))
  assert.equal(createHash('sha256').update(form(source)).digest('hex'), '8ba0c17fc09aede40e70af62f168f90ec900f5f3e08870d4ac0ef22090f6c89a')
  const summarySource = await read('components/inline-discovery-summary.js')
  assert.doesNotMatch(summarySource, /data-sticky-safe|setStickySafe|position:\s*(?:sticky|fixed)/)
  assert.match(summarySource, /Math\.min\(Math\.ceil\(height\) \+ 24, Math\.max\(0, viewport - 240\)\)/)
  assert.match(summarySource, /observer\?\.disconnect\(\)/)
})

test('homepage categories and inline children have no hidden More, stage, next-step or collapsed slice', async () => {
  const categories = await read('components/inline-category-grid.js')
  assert.match(categories, /homeCategories\(language\)\.map/)
  assert.doesNotMatch(categories, /\.slice\(|collapsedLimit|aria-expanded|More \(|Още \(|Next|Назад|guide-panel/)
  const children = await read('components/discovery-subcategories.js')
  const inlineBranch = children.slice(children.indexOf('  if (inline) {'), children.indexOf('  if (!category ||'))
  assert.match(inlineBranch, /choices\.map/)
  assert.doesNotMatch(inlineBranch, /\.slice\(|collapsedLimit|aria-expanded|subcategory-more|More \(|Още \(|Next|Назад/)
  const search = await read('components/discovery-search.js')
  assert.match(search, /\{home && !compact && <InlineCategoryGrid/)
  assert.match(search, /\{home && !compact && <InlineDiscoveryPanel open=\{inlinePanelOpen\}>\{inlinePanelOpen \? <DiscoverySubcategories inline/)
  assert.match(search, /initialPreview=\{false\}/)
  assert.doesNotMatch(search, /GuidedServiceDiscovery|guideStage|setGuideStage/)
})

const baselineTree = execFileSync('git', ['ls-tree', '-r', '-z', baseline], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob')
const imagePath = path => /^public\//.test(path) && /\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i.test(path)
function frozenPath(path) {
  return /^app\/api\//.test(path) || /^hooks\//.test(path)
    || /^lib\//.test(path) && path !== 'lib/discovery/guided-navigation.mjs'
    || /^app\/.*\.css$/.test(path)
    || /^components\/(?:.*booking.*|monthly-booking-calendar|business-photo-gallery|business-cover-photo|service-thumbnail)\.js$/.test(path)
    || /^(?:package\.json|pnpm-lock\.yaml|next\.config\.mjs)$/.test(path)
}
async function identicalBlobs(entries) {
  for (let offset = 0; offset < entries.length; offset += 32) await Promise.all(entries.slice(offset, offset + 32).map(async record => {
    const path = new URL(`../${record.path}`, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    const oid = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
    assert.equal(oid, record.oid, `${record.path} must remain byte-identical to ${baseline}`)
  }))
}

test('historical APIs, hooks, data/taxonomy, booking/media/config/dependencies and CSS stay frozen outside the exact approved 2026-11-22 paths', async () => {
  await identicalBlobs(baselineTree.filter(record => frozenPath(record.path) && !reviewedDiscoveryFileChange(record.path) && !nextSecurityUpgradeAllowsFileChange(record.path) && !stationaryDiscoveryAllowsFileChange(record.path)))
  const rail = await read('lib/discovery/rail.mjs')
  assert.match(rail, /export const SERVICE_PREVIEW_LIMIT = 2/)
  assert.match(rail, /\.slice\(0, SERVICE_PREVIEW_LIMIT\)/)
})

test('homepage card polish preserves vector booking artwork, exact action destinations/eligibility, profile analytics and original service-price rendering', async () => {
  const current = await read('components/discovery-business-card.js')
  const original = execFileSync('git', ['show', `${baseline}:components/discovery-business-card.js`], { cwd: root, encoding: 'utf8' })
  const section = (source, startMarker, endMarker) => {
    const start = source.indexOf(startMarker), end = source.indexOf(endMarker, start)
    assert.ok(start >= 0 && end > start, `${startMarker} remains a distinct reviewed block`)
    return source.slice(start, end)
  }
  assert.equal(section(current, '  const actions =', '  return <article'), section(original, '  const actions =', '  return <article'), 'native, external and telephone actions, trusted URLs, disabled preview controls and labels are unchanged')
  assert.equal(section(current, '  const openDetails =', '  const photo ='), section(original, '  const openDetails =', '  const photo ='), 'only actual profile opening records the same profile event')
  assert.equal(section(current, '  const distance =', '  const serviceList ='), section(original, '  const distance =', '  const serviceList ='), 'original photo containment, partner identity and location wording are intact')
  assert.equal(section(current, '  const serviceList =', '  const reviews ='), section(original, '  const serviceList =', '  const reviews ='), 'service names, thumbnails, published prices, units and conditions remain exact')
  assert.match(current, /const services = railServiceItems\(row\)/)
  assert.match(current, /const reserve = quickChoice\s*\? <span className="booking-button-content"><Icon name="calendar"\/><span className="booking-button-label">\{copy\.reserveAppointment\}<\/span><\/span>\s*: <BookingButtonContent>\{copy\.reserveAppointment\}<\/BookingButtonContent>/)
})

test('all historical public image bytes stay frozen; only the fifteen explicitly approved versioned category siblings are added', async () => {
  const images = baselineTree.filter(record => imagePath(record.path))
  assert.equal(images.length, 1889, 'reviewed baseline public-image inventory')
  const current = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', 'public'], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }).split('\0').filter(imagePath)
  assert.deepEqual([...new Set(current)].sort(), [...images.map(record => record.path), ...DISCOVERY_NEW_MEDIA].sort())
  await identicalBlobs(images)
})
