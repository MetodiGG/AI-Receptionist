import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
const declarations = (css, selector) => [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]+)\}/g)]
  .filter(match => match[1].trim().split(',').map(value => value.trim()).includes(selector))
  .map(match => match[2])

test('business detail prose is full-size, high-contrast body copy rather than thumbnail-sized text', async () => {
  const css = await read('app/discovery-home.css')
  for (const selector of [
    '.discovery-business-details .business-details-description',
    '.discovery-business-details .business-details-services .business-details-service-description',
  ]) {
    const rules = declarations(css, selector)
    assert.equal(rules.length, 1)
    assert.match(rules[0], /font-size:\s*16px/)
    assert.match(rules[0], /line-height:\s*1\.6/)
    assert.match(rules[0], /color:\s*#574b42/)
    assert.doesNotMatch(rules[0], /(?:^|;)\s*(?:height|max-height):|overflow:\s*hidden|-webkit-line-clamp/)
  }
  // The three-class description selector overrides the later two-class 14px
  // thumbnail layout rule without changing or widening that image stylesheet.
  const surfaces = await read('app/service-photo-surfaces.css')
  assert.match(surfaces, /\.business-details-services \.business-details-service-description \{/)
})

test('important tariff conditions and price units remain legible on cards and in detail menus', async () => {
  const css = await read('app/discovery-home.css')
  for (const selector of [
    '.discovery-business-details .business-details-service-condition',
    '.home-business-services .home-service-condition',
    '.discovery-business-details .service-price-unit',
    '.home-business-services .service-price-unit',
  ]) {
    const rules = declarations(css, selector)
    assert.equal(rules.length, 1)
    assert.match(rules[0], /font-size:\s*15px/)
    assert.match(rules[0], /line-height:\s*1\.5/)
    assert.doesNotMatch(rules[0], /display:\s*none|visibility:\s*hidden/)
  }
})

test('public service descriptions keep 16px body type on both desktop and narrow mobile profiles', async () => {
  const css = await read('app/business-profile.css')
  const rules = declarations(css, '.profile-redesign .profile-service-description')
  assert.equal(rules.length, 2, 'base and mobile rules remain in sync')
  for (const rule of rules) assert.match(rule, /font-size:\s*16px/)
  const paragraph = declarations(css, '.profile-redesign .profile-service-description p')[0]
  assert.match(paragraph, /line-height:\s*1\.6/)
  assert.match(paragraph, /white-space:\s*pre-line/)
  assert.match(paragraph, /word-break:\s*normal/)
  for (const selector of ['.profile-redesign .business-team-list p', '.profile-redesign .profile-hours dl > div', '.profile-redesign .profile-contact-brands p']) {
    assert.match(declarations(css, selector)[0], /font-size:\s*16px/)
  }
})

test('standalone catalogue notices and related-business labels are not shrunk below readable supporting sizes', async () => {
  const css = await read('app/businesses/catalogue/[id]/profile.css')
  for (const selector of ['.catalogue-profile-category', '.catalogue-booking-notice', '.catalogue-profile-source']) {
    assert.match(declarations(css, selector)[0], /font-size:\s*16px/)
    assert.match(declarations(css, selector)[0], /line-height:\s*1\.6/)
  }
  assert.match(declarations(css, '.catalogue-related-links small')[0], /font-size:\s*15px/)
})
