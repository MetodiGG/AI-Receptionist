import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const component = new URL('../components/owner-business-client-preview.js', import.meta.url)
const { code } = await transform(await readFile(component, 'utf8'), {
  filename: component.pathname,
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
})
const dependencies = Object.fromEntries(await Promise.all(['business-profile', 'business-profile-ui', 'business-photos', 'booking-mode', 'locale/public-content'].map(async path => [`../lib/${path}.mjs`, await import(`../lib/${path}.mjs`)])))
const mod = { exports: {} }
const styleStub = new Proxy({}, { get: (_, name) => name === '__esModule' ? false : name })
new Function('require', 'module', 'exports', code)(name => {
  if (name in dependencies) return dependencies[name]
  if (name.endsWith('.module.css')) return styleStub
  if (name === './icon') return { Icon() { return null } }
  if (name === '../lib/supabase') return { supabase: { auth: { getSession() { assert.fail('render cannot read a session or send a request') } } } }
  return require(name)
}, mod, mod.exports)

const { OwnerBusinessClientPreview } = mod.exports
const business = {
  id: 'owner-preview-only', name: 'Студио Линия', address: 'ул. Примерна 8', city: 'София', city_ekatte: '68134',
  website_url: 'https://linia.bg', external_booking_url: 'https://linia.bg/book', booking_mode: 'external',
  external_booking_consent_at: '2026-11-27T12:00:00Z', contact_email: 'never-public@example.com',
  public_profile: { description: { bg: 'Само по предварително записване.', en: 'By appointment only.' } },
  photos: [{ src: '/logo.png', alt: { bg: 'Примерна корица', en: 'Sample cover' } }],
}
const savedServices = [
  { id: 'preview-service-one', name: 'Подстригване', presentationEn: { name: 'Haircut' }, price: 25, currency: 'EUR' },
  { id: 'preview-service-two', name: 'Грим', presentationEn: { name: 'Makeup' }, price: null, currency: 'EUR' },
]
const render = (changes = {}, locale = 'bg', state = {}) => renderToStaticMarkup(createElement(OwnerBusinessClientPreview, { business: { ...business, ...changes }, savedServices, locale, fixture: true, ...state }))

test('owner customer preview shows saved public profile and localized service prices without an outbound action', () => {
  const bg = render(), en = render({}, 'en')
  assert.match(bg, /Сайт на бизнеса/)
  assert.match(bg, /Резервирай в сайта/)
  assert.match(bg, /Само по предварително записване/)
  assert.match(bg, /Подстригване/)
  assert.match(en, /Business website/)
  assert.match(en, /Book on the website/)
  assert.match(en, /By appointment only/)
  assert.match(en, /Sample cover/)
  assert.match(en, /Haircut/)
  assert.match(en, /25\s?€|€\s?25/)
  assert.match(bg, /Уточни с бизнеса/)
  assert.match(en, /Ask the business/)
  assert.doesNotMatch(bg + en, /<a\b|never-public|linia\.bg\/?/)
})

test('owner customer preview honors independent website and booking consent, and unavailable data', () => {
  const noConsent = render({ external_booking_consent_at: null })
  assert.match(noConsent, /Сайт на бизнеса/)
  assert.match(noConsent, /disabled=""/)
  const phone = render({ booking_mode: 'phone', phone: '+359 88 123 4567', website_url: '' })
  assert.doesNotMatch(phone, /Сайт на бизнеса|tel:/)
  assert.match(phone, /Резервирай по телефон/)
  assert.doesNotMatch(phone, /disabled=""/)
  assert.match(render({ booking_mode: 'gorez' }), /Резервирай в GoRez/)
  assert.doesNotMatch(render({ website_url: 'javascript:alert(1)' }), /Сайт на бизнеса/)
  const unavailable = render({}, 'en', { unavailable: true })
  assert.match(unavailable, /Services are temporarily unavailable/)
  assert.doesNotMatch(unavailable, /Haircut/)
})
