import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const css = await read('app/premium-discovery-cards.css'), rules = []
parse(css).walkRules(rule => rules.push(rule))
const declarations = rule => Object.fromEntries(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]))
const find = predicate => rules.find(predicate)

test('compact cards reserve a 4:3 frame while preserving entire original partner images', () => {
  const frame = find(rule => rule.selector.endsWith('.home-business-heading > .home-business-photo'))
  assert.equal(declarations(frame)['aspect-ratio'], '4 / 3')
  assert.equal(declarations(frame).width, '100%'); assert.equal(declarations(frame).height, 'auto')
  const image = find(rule => rule.selector.endsWith('.home-business-photo.is-real-photo > img'))
  assert.equal(declarations(image)['object-fit'], 'contain'); assert.equal(declarations(image)['object-position'], 'center')
  const heading = find(rule => rule.selector.endsWith('.home-business-identity h3'))
  for (const property of ['white-space', 'word-break', 'overflow-wrap']) assert.equal(declarations(heading)[property], 'normal')
  assert.equal(declarations(heading).overflow, 'visible')
  assert.match(css, /@media \(max-width: 759px\)/)
  assert.match(css, /grid-template-columns: minmax\(0,1fr\)/)
  const headingRows = rules.filter(rule => rule.selector.endsWith('> .home-business-heading'))
  assert.equal(headingRows.length, 2)
  for (const rule of headingRows) assert.match(rule.selector, /article\.home-business-card\.is-compact-preview >/, 'both desktop and mobile override the older real-photo :has() thumbnail layout, not only generated covers')
})

test('photo distance is small, top-right and tabular; AI disclosure stays readable at bottom-left', () => {
  const badge = declarations(find(rule => rule.selector.endsWith('.home-business-photo > .home-distance-badge')))
  assert.equal(badge.top, '10px'); assert.equal(badge.right, '10px'); assert.equal(badge.left, 'auto')
  assert.equal(badge['font-size'], '.75rem'); assert.equal(badge['font-variant-numeric'], 'tabular-nums')
  const label = declarations(find(rule => rule.selector.endsWith('.business-category-cover-label')))
  assert.equal(label.inset, 'auto auto 5px 5px'); assert.equal(label['font-size'], '11px')
  assert.equal(label['white-space'], 'nowrap'); assert.equal(label.opacity, '1')
  assert.equal(label.border, '0'); assert.equal(label['box-shadow'], 'none')
})

test('one whole-card target receives non-action clicks while shared action links/forms remain above it', () => {
  const target = declarations(find(rule => rule.selector.endsWith('> .home-business-open')))
  assert.equal(target['z-index'], '1')
  const photo = declarations(find(rule => rule.selector.endsWith('.home-business-heading > .home-business-photo')))
  const identity = declarations(find(rule => rule.selector.endsWith('.home-business-identity')))
  assert.equal(photo['pointer-events'], 'none'); assert.equal(identity['pointer-events'], 'none')
  const actions = declarations(find(rule => rule.selector.endsWith('.home-business-actions') && declarations(rule).position === 'relative'))
  assert.equal(actions['pointer-events'], 'auto'); assert.equal(actions['z-index'], '2')
  const focus = declarations(find(rule => rule.selector.endsWith('> .home-business-open:focus-visible')))
  assert.match(focus.outline, /^2px solid/); assert.equal(focus['outline-offset'], '3px')
})

test('service invitation rows fill the available width with or without optional photo and chevron, and preserve prices',()=>{
  const row=declarations(find(rule=>rule.selector.endsWith('.home-business-service-preview > li')))
  assert.equal(row.display,'flex')
  assert.equal(row['grid-template-columns'],undefined)
  const thumbnail=declarations(find(rule=>rule.selector.endsWith('.home-business-service-preview .service-thumbnail')))
  const copy=declarations(find(rule=>rule.selector.endsWith('.home-business-preview-copy')))
  const chevron=declarations(find(rule=>rule.selector.endsWith('.home-business-preview-chevron')))
  assert.equal(thumbnail.flex,'0 0 40px')
  assert.equal(copy.flex,'1 1 0%')
  assert.equal(copy['min-width'],'0')
  assert.equal(chevron.flex,'0 0 14px')
  assert.equal(row['min-height'],'60px')
  assert.equal(row['border-radius'],'14px')
  const main=declarations(find(rule=>rule.selector.endsWith('.home-business-preview-main')))
  assert.equal(main.display,'flex');assert.equal(main['flex-wrap'],'wrap')
  const name=declarations(find(rule=>rule.selector.endsWith('.home-business-preview-name')))
  for(const property of ['white-space','word-break','overflow-wrap'])assert.equal(name[property],'normal')
  assert.equal(name.overflow,'visible')
  const price=declarations(find(rule=>rule.selector.endsWith('.home-business-preview-price')))
  assert.equal(price['font-variant-numeric'],'tabular-nums');assert.equal(price['margin-inline-start'],'auto')
  assert.match(css,/prefers-reduced-motion: reduce[\s\S]*home-business-preview-chevron svg \{ transition: none;/u)
  assert.doesNotMatch(css,/home-business-inline-details|line-clamp:\s*[1-9]|text-overflow: ellipsis/u)
})

test('card styling stays public-card scoped and does not duplicate shared button presentation or animate under reduced motion', () => {
  for (const rule of rules) for (const selector of rule.selectors) {
    assert.ok(selector.includes('.customer-home .home-business-grid'), selector)
    assert.doesNotMatch(selector, /\.discovery-form|\.discovery-query|\.home-search|\.profile-redesign|\.business-details-gallery/)
  }
  assert.doesNotMatch(css, /home-reserve|home-directions|booking-button-content|infinite|scroll-timeline/)
  const reduced = rules.filter(rule => rule.parent.type === 'atrule' && /prefers-reduced-motion: reduce/.test(rule.parent.params))
  assert.ok(reduced.some(rule => declarations(rule).animation === 'none' && declarations(rule).transition === 'none'))
})

test('shared native/phone/external actions still use trusted route helpers and the original profile event', async () => {
  const source = await read('components/discovery-business-card.js')
  assert.match(source, /const directions = railDirections\(business\)/)
  assert.match(source, /const action = railExternalAction\(business\)/)
  assert.match(source, /isOffsiteBooking\(business\)/)
  assert.match(source, /action\?\.kind === 'verified'/)
  assert.match(source, /action\.kind === 'phone'/)
  assert.match(source, /if \(!preview\) trackSearchEvent\(\{ event: 'profile', locale \}\)/)
  assert.doesNotMatch(source, /trackProductEvent|booking_started|fetch\(|api\/.*bookings/)
  assert.match(source, /actions=\{actions\}/, 'hydrated details continue to resolve the current business action')
})
