import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

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

test('the glass All row keeps AA text/focus and its selected-only frame never highlights an unselected action', () => {
  const base = declarations(inlineRules.find(rule => rule.selector === '.inline-service-all' && declarations(rule).color))
  const ordinary = declarations(inlineRules.find(rule => rule.selector === '.inline-service-all' && /color-mix/.test(declarations(rule).background || '')))
  const selected = declarations(inlineRules.find(rule => rule.selector === '.inline-service-all[aria-pressed="true"]' && /color-mix/.test(declarations(rule).background || '')))
  assert.equal(base.color, 'var(--inline-ink)')
  for (const [name, actual, variable, opacity] of [['ordinary', ordinary, '--inline-surface', .9], ['selected', selected, '--inline-selected', .92]]) {
    assert.match(actual.background, new RegExp(`var\\(${variable}\\)\\s*${opacity * 100}%`))
    for (const [theme, values] of [['light', inlineLight], ['dark', inlineDark]]) for (const backdrop of ['#000000', '#FFFFFF']) {
      const background = composite(values[variable], backdrop, opacity)
      readable(resolve(base.color, values), background, `${theme} ${name} glass All text over ${backdrop}`)
      readable(values['--inline-accent'], background, `${theme} ${name} All focus over ${backdrop}`, 3)
    }
  }
  const selectedFrame = inlineRules.find(rule => rule.selectors.includes('.inline-service-all[aria-pressed="true"]::after') && declarations(rule).padding === '2px')
  assert.ok(selectedFrame)
  assert.equal(declarations(selectedFrame).background, 'var(--inline-photo-selected-edge)')
  assert.ok(!inlineRules.some(rule => rule.selectors.includes('.inline-service-all::after')), 'the strong frame is conditional on the same aria-pressed state as the single visible check')
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

test('translucent espresso summary, chip states, secondary captions and native sort retain AA', () => {
  const glass = inlineRules.find(rule => rule.selector === '.inline-summary' && /^#[\da-f]{8}$/i.test(declarations(rule).background || ''))
  const glassFill = declarations(glass).background
  assert.equal(glassFill.toUpperCase(), '#2F211BF2')
  const chip = declarations(inlineRules.find(rule => rule.selector.includes('.inline-summary-chip,') && declarations(rule).color))
  const service = declarations(inlineRules.find(rule => rule.selector === '.inline-summary-chip--service'))
  const hover = declarations(inlineRules.find(rule => rule.selector.includes('.inline-summary-chip:hover')))
  const select = declarations(inlineRules.find(rule => rule.selector === '.inline-summary-sort select'))
  for (const backdrop of ['#000000', '#FFFFFF']) {
    const espresso = composite(glassFill, backdrop)
    for (const foreground of [inlineLight['--inline-on-espresso'], '#E9CBB3']) readable(foreground, espresso, `espresso text over ${backdrop}`)
    readable(inlineLight['--inline-on-espresso'], composite(chip.background, espresso), 'translucent category/area chip')
    readable(inlineLight['--inline-on-espresso'], composite(service.background, espresso), 'translucent service chip')
    readable(inlineLight['--inline-on-espresso'], espresso, 'summary focus', 3)
  }
  readable(inlineLight['--inline-on-espresso'], hover.background, 'summary chip hover')
  readable(select.color, select['background-color'], 'actual disabled sort label')
  assert.equal(select.opacity, '1', 'the disabled native select must not silently fade its contrasted text')
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
  for (const selector of ['.inline-category-label', '.inline-service-label', '.inline-summary-chip-label']) {
    const style = declarations(inlineRules.find(rule => rule.selectors.includes(selector)))
    assert.equal(style['white-space'], 'normal'); assert.equal(style['word-break'], 'normal')
    assert.notEqual(style['text-overflow'], 'ellipsis')
  }
})

test('measured-safe sticky glass and 44px controls are scoped away from the unchanged main search form', async () => {
  const summary = declarations(inlineRules.find(rule => rule.selector === '.inline-summary' && declarations(rule).position))
  assert.equal(summary.position, 'relative'); assert.equal(summary.top, '8px')
  const sticky = declarations(inlineRules.find(rule => rule.selector === '.inline-summary[data-sticky-safe="true"]'))
  assert.equal(sticky.position, 'sticky', 'only a measured-safe summary may cover the scrolling viewport')
  const offsets = inlineRules.filter(rule => declarations(rule)['scroll-margin-top'])
  for (const selector of ['.home-business-grid > li', '.home-section-heading h2']) {
    const offset = offsets.find(rule => rule.selector.includes(selector))
    assert.ok(offset)
    assert.equal(declarations(offset)['scroll-margin-top'], 'var(--inline-summary-offset,190px)', 'following results use the measured bar height rather than a stale fixed offset')
  }
  const shell = declarations(inlineRules.find(rule => rule.selector === '.marketing-page.customer-home.quick-choice:has(.inline-discovery-categories)'))
  assert.equal(shell['overflow-x'], 'clip'); assert.equal(shell['overflow-y'], 'visible')
  const chips = declarations(inlineRules.find(rule => rule.selector.includes('.inline-summary-chip,') && declarations(rule)['min-height']))
  assert.equal(chips['min-height'], '44px'); assert.equal(chips['min-width'], '44px')
  const sort = declarations(inlineRules.find(rule => rule.selector === '.inline-summary-sort select'))
  assert.equal(sort['min-height'], '44px')
  for (const rule of [...inlineRules, ...cardRules]) {
    assert.doesNotMatch(rule.selector, /\bh1\b|\bform\b|\.discovery-query|\.discovery-form|\.home-search|\.home-discovery-heading/)
    for (const name of Object.keys(declarations(rule))) assert.doesNotMatch(name, /^--(?:paper|ink|ink-soft|surface|line|accent|forest)$/)
  }
  const source = await read('components/discovery-search.js')
  const form = value => { const start = value.indexOf('<form className="discovery-form"'); const end = value.indexOf('</form>', start) + 7; assert.ok(start >= 0 && end > start); return value.slice(start, end) }
  const original = execFileSync('git', ['show', `${baseline}:components/discovery-search.js`], { cwd: root, encoding: 'utf8' })
  assert.equal(form(source), form(original))
  assert.equal(createHash('sha256').update(form(source)).digest('hex'), '8ba0c17fc09aede40e70af62f168f90ec900f5f3e08870d4ac0ef22090f6c89a')
  const summarySource = await read('components/inline-discovery-summary.js')
  assert.match(summarySource, /data-sticky-safe=\{stickySafe \? 'true' : undefined\}/)
  assert.match(summarySource, /Math\.min\(240, viewport \* \.3\)/)
  assert.match(summarySource, /safe \? Math\.ceil\(height\) \+ 24 : 0/)
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

test('all existing APIs, hooks, data/taxonomy, booking/media/config/dependency files and legacy CSS remain frozen to c9e525b', async () => {
  await identicalBlobs(baselineTree.filter(record => frozenPath(record.path)))
  const rail = await read('lib/discovery/rail.mjs')
  assert.match(rail, /export const SERVICE_PREVIEW_LIMIT = 2/)
  assert.match(rail, /\.slice\(0, SERVICE_PREVIEW_LIMIT\)/)
})

test('homepage booking artwork uses the existing vector calendar without changing labels, destinations, analytics or eligibility', async () => {
  const current = await read('components/discovery-business-card.js')
  const original = execFileSync('git', ['show', `${baseline}:components/discovery-business-card.js`], { cwd: root, encoding: 'utf8' })
  const before = '  const reserve = <BookingButtonContent>{copy.reserveAppointment}</BookingButtonContent>'
  const after = `  const reserve = quickChoice
    ? <span className="booking-button-content"><Icon name="calendar"/><span className="booking-button-label">{copy.reserveAppointment}</span></span>
    : <BookingButtonContent>{copy.reserveAppointment}</BookingButtonContent>`
  assert.ok(original.includes(before))
  assert.equal(current, original.replace(before, after), 'only the visual quick-choice icon may differ from the reviewed card')
})

test('every tracked public image and its path remains frozen to c9e525b, with no replacement image inventory', async () => {
  const images = baselineTree.filter(record => imagePath(record.path))
  assert.equal(images.length, 1889, 'reviewed baseline public-image inventory')
  const current = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', 'public'], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }).split('\0').filter(imagePath)
  assert.deepEqual([...new Set(current)].sort(), images.map(record => record.path).sort())
  await identicalBlobs(images)
})
