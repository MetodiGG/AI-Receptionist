import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('flyer action styles load last and scope relief to customer booking/directions controls', async () => {
  const [css, layout] = await Promise.all(['app/booking-actions.css','app/layout.js'].map(read))
  assert.ok(layout.indexOf("import './booking-actions.css'") > layout.indexOf("import './business-results.css'"))
  for (const selector of ['.home-business-actions .home-reserve','.home-business-actions .home-directions','.profile-redesign .profile-external-reserve','.business-directory .directory-book-button','.profile-redesign .profile-service-book']) assert.ok(css.includes(selector), selector)
  assert.match(css, /box-shadow: inset 0 2px 0/)
  assert.equal(css.match(/\.partners-page \.business-directory \.directory-book-button,/g)?.length, 2, 'base relief and booking color also override the older three-class partner-directory style')
  assert.match(css, /flex-direction: row/)
  assert.match(css, /\.home-business-actions \.home-maps-label \{[^}]*color: inherit[^}]*font-weight: inherit/)
  assert.doesNotMatch(css, /\.sidebar|\.dashboard|gmp-|\.home-google-attribution|\.review-stars|\.month-date|\.home-categories/)
})

test('action states remain bounded, keyboard visible, disabled-safe and reduced-motion aware', async () => {
  const css = await read('app/booking-actions.css')
  assert.match(css, /min-height: 52px/)
  assert.match(css, /\.profile-redesign \.profile-service-book \{[^}]*width: 46px; min-height: 46px/)
  assert.match(css, /:not\(:disabled\):not\(\[aria-disabled="true"\]\):is\(:hover,:focus-visible\)/)
  assert.match(css, /outline: 3px solid #984419; outline-offset: 4px/)
  assert.match(css, /opacity: \.72; color: var\(--action-ink\); background: linear-gradient\(175deg,var\(--action-top\),var\(--action-bottom\)\); border-color: var\(--action-border\); transform: none/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /transition: none/)
  assert.match(css, /:is\(:hover,:focus-visible,:active\) \{ transform: none/)
  assert.match(css, /\.booking-button-label \{[^}]*word-break: normal/)
  assert.match(css, /max-width: 389px/)
  assert.doesNotMatch(css, /word-break: break-all|overflow: hidden|text-overflow: ellipsis|animation:/)
})

test('local button-state review has no booking, call, navigation or production submission path', async () => {
  const source = await read('app/dev/button-states/page.js')
  assert.match(source, /process.env.NODE_ENV !== 'development'\) notFound\(\)/)
  assert.match(source, /BookingButtonContent/)
  assert.match(source, /<Icon name="map"/)
  assert.match(source, /className="home-reserve" disabled/)
  assert.doesNotMatch(source, /fetch\(|href=|action=|onClick=|type="submit"|supabase/)
  assert.match(source, /lang === 'en'/)
})
