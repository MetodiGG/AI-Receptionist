import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
const css = await readFile(new URL('../app/premium-discovery-cards.css', import.meta.url), 'utf8')
const ast = parse(css), rules = []
ast.walkRules(rule => rules.push(rule))
const declarations = rule => Object.fromEntries(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]))
const find = predicate => rules.find(predicate)

test('homepage action labels have mathematically equal side tracks and exactly aligned existing vector icons', () => {
  const grid = find(rule => rule.selector.includes('.home-directions,') && rule.selector.includes('.booking-button-content'))
  assert.ok(grid)
  assert.equal(declarations(grid).display, 'grid')
  assert.equal(declarations(grid)['grid-template-columns'], 'var(--premium-action-slot) minmax(min-content,1fr) var(--premium-action-slot)')
  const label = find(rule => rule.selector.includes(':is(.home-maps-label,.booking-button-label)'))
  assert.equal(declarations(label)['grid-column'], '2')
  assert.equal(declarations(label)['text-align'], 'center')
  assert.equal(declarations(label)['overflow-wrap'], 'normal')
  assert.equal(declarations(label)['word-break'], 'normal')
  const balance = find(rule => rule.selector.includes(':is(.home-directions,.booking-button-content)::after'))
  assert.equal(declarations(balance).content, "''")
  assert.equal(declarations(balance)['grid-column'], '3')
  const icons = find(rule => rule.selector.includes('.home-directions > svg,.booking-button-content > svg,.booking-button-content > img'))
  assert.equal(declarations(icons)['grid-column'], '1')
  assert.equal(declarations(icons).width, 'var(--premium-action-slot)')
  assert.equal(declarations(icons).height, 'var(--premium-action-slot)')
})

test('whole action words establish their minimum width and the pair wraps naturally for narrow cards and enlarged text', () => {
  const minimum = find(rule => rule.selector.includes('> :is(.home-directions,.home-reserve,.outbound-booking-form)') && declarations(rule)['min-inline-size'])
  assert.equal(declarations(minimum)['min-inline-size'], 'min-content')
  const responsive = rules.filter(rule => rule.parent.type === 'atrule' && rule.parent.name === 'container' && rule.parent.params === 'premium-results (max-width:48rem)')
  const group = responsive.find(rule => rule.selector.endsWith('> .home-business-actions'))
  assert.equal(declarations(group)['flex-wrap'], 'wrap')
  assert.equal(declarations(group)['flex-direction'], 'row')
  const items = responsive.find(rule => rule.selector.includes('> :is(.home-directions,.home-reserve,.outbound-booking-form)'))
  assert.equal(declarations(items).flex, '1 1 0', 'equal flex bases share a fitting row evenly; intrinsic minimum still forces wrapping when required')
  const slots = responsive.find(rule => declarations(rule)['--premium-action-slot'])
  assert.equal(declarations(slots)['--premium-action-slot'], '18px')
  const footer = responsive.find(rule => rule.selector.endsWith('> .home-business-footer'))
  assert.equal(declarations(footer).width, '100%')
  assert.equal(declarations(footer)['grid-column'], '1')
})

test('the compact card keeps whole-word typography, contained photos, tabular prices and touch-sized actions', () => {
  const photo = find(rule => rule.selector.includes('.home-business-photo.is-real-photo > img'))
  assert.equal(declarations(photo)['object-fit'], 'contain')
  assert.equal(declarations(photo)['object-position'], 'center')
  for (const part of ['.home-business-identity h3', '.home-service-name', '.home-service-price']) {
    const entry = find(rule => rule.selector.endsWith(part))
    assert.equal(declarations(entry)['word-break'], 'normal')
    assert.equal(declarations(entry)['overflow-wrap'], 'normal')
    assert.equal(declarations(entry)['white-space'], 'normal')
  }
  const price = find(rule => rule.selector.endsWith('.home-service-price'))
  assert.equal(declarations(price)['font-variant-numeric'], 'tabular-nums')
  const buttons = find(rule => rule.selector.endsWith(':is(.home-directions,.home-reserve)') && declarations(rule)['min-height'])
  assert.ok(Number.parseFloat(declarations(buttons)['min-height']) >= 44)
  assert.match(css, /@media \(max-width: 759px\)/)
  assert.match(css, /border-inline-start: 0;/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /home-business-inline-details \{ transition: none;/)
})

test('polish remains scoped to public homepage cards, never main search or shared reservation forms', () => {
  for (const rule of rules) {
    if (rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') continue
    for (const selector of rule.selectors) {
      assert.ok(selector.includes('.customer-home.quick-choice .home-business-grid'), selector)
      assert.doesNotMatch(selector, /\.discovery-form|\.discovery-query|\.home-search|\.profile-redesign|\.business-details-gallery/)
    }
  }
})

test('result arrivals and action feedback are short, finite and fully disabled for reduced motion', () => {
  const arrival = find(rule => rule.selector.includes('> li > article.home-business-card') && declarations(rule)['animation-name'])
  assert.equal(declarations(arrival)['animation-name'], 'premium-card-arrive')
  assert.equal(declarations(arrival)['animation-duration'], '200ms')
  assert.equal(declarations(arrival)['animation-iteration-count'], '1')
  const delays = rules.map(rule => declarations(rule)['--premium-card-enter-delay']).filter(Boolean).map(value => Number.parseFloat(value))
  assert.deepEqual(delays, [30, 60, 90, 120, 150])
  const frames = rules.filter(rule => rule.parent.type === 'atrule' && rule.parent.name === 'keyframes' && rule.parent.params === 'premium-card-arrive')
  assert.deepEqual(frames.map(rule => declarations(rule).transform), ['translateY(6px)', 'translateY(0)'])
  const reduced = rules.filter(rule => rule.parent.type === 'atrule' && /prefers-reduced-motion: reduce/.test(rule.parent.params))
  assert.ok(reduced.some(rule => declarations(rule).animation === 'none'))
  assert.ok(reduced.some(rule => declarations(rule).transition === 'none' && rule.selector.includes('.home-business-actions')))
  assert.ok(reduced.some(rule => declarations(rule).transform === 'none' && rule.selector.includes(':is(:hover,:focus-visible,:active)')))
  assert.doesNotMatch(css, /infinite|scroll-timeline|animation-timeline/)
  assert.doesNotMatch(css, /home-business-booking-hint/)
})

test('the literal booking/directions action implementation and profile analytics are unchanged from the reviewed card', async () => {
  const source = await readFile(new URL('../components/discovery-business-card.js', import.meta.url), 'utf8')
  const original = execFileSync('git', ['show', '4cd3f7e:components/discovery-business-card.js'], { cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8' })
  const actionBlock = value => value.slice(value.indexOf('  const actions = (business = row) => {'), value.indexOf('  return <article className="home-business-card"'))
  assert.ok(actionBlock(original).length > 1000)
  assert.equal(actionBlock(source), actionBlock(original), 'no change to real hrefs, phone/form/native distinction, preview disablement, consent POST redirects or booking eligibility')
  const eventLine = value => value.split('\n').find(line => line.includes('const openDetails ='))
  assert.equal(eventLine(source), eventLine(original), 'the exact profile analytics and trigger focus behavior are retained')
})
