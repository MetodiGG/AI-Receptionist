import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { businessPageSlug } from '../lib/business-slug.mjs'
import { businessApplicationSchema } from '../lib/business-application.mjs'
import { PRICING_COPY } from '../lib/product-config.mjs'
import { BUSINESS_FAQ } from '../lib/faq.mjs'
import { pageMetadata } from '../lib/seo.mjs'
import { HOME_DISCOVERY_COPY } from '../lib/discovery/home.mjs'

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
const nonce = '123456abcdef'
test('automatic page addresses support Bulgarian, short and non-Latin names within the existing API schema', () => {
  const schema = businessApplicationSchema.shape.business.shape.slug
  assert.equal(businessPageSlug('ВЕСИ СТУДИО', nonce), 'vesi-studio-123456abcdef')
  for (const name of ['АБ', 'XY', '美容', '✨💇', '  A---B---  ', 'Салон '.repeat(60), 'éà Café', 'x'.repeat(200)]) {
    const slug = businessPageSlug(name, nonce)
    assert.ok(slug.length >= 3 && slug.length <= 48)
    assert.equal(schema.safeParse(slug).success, true, slug)
    assert.doesNotMatch(slug, /--|^-|-$|[^a-z0-9-]/)
  }
})
test('same-name businesses have distinct bounded automatic addresses, stable for a given registration nonce', () => {
  assert.equal(businessPageSlug('Studio', nonce), businessPageSlug('Studio', nonce))
  assert.notEqual(businessPageSlug('Studio', nonce), businessPageSlug('Studio', 'abcdef123456'))
  for (const key of ['', undefined, 'short', '../bad-key', 'a'.repeat(13), 'xyzxyzxyzxyz']) assert.throws(() => businessPageSlug('Studio', key), /INVALID_SLUG_NONCE/)
})
test('registration removes descriptions, brands and manual page-address inputs while retaining required business information and photos', async () => {
  const source = await read('components/business-setup.js')
  assert.doesNotMatch(source, /About your business \(optional\)|За бизнеса \(по желание\)|Brands \(comma|Марки \(със|Page address \(optional\)|setup-address-options|id="business-slug"|slugTouched/)
  for (const required of ['BusinessLocationFields required', 'id="business-address"', 'Business photos *', 'PhotoPicker', '<BookingModeFields', '<OpeningHoursEditor', '<WeeklyScheduleFields', 'BUSINESS_PHOTO_REQUIRED']) assert.ok(source.includes(required), required)
  assert.match(source, /public_profile:\{description:\{bg:'',en:''\},payments:\[\],brands:\[\]/)
  assert.match(source, /businessPageSlug\(value, pageNonce.current\)/)
  assert.match(source, /if\(code==='ADDRESS_IN_USE'\)\{renewPageAddress\(\)/)
  assert.doesNotMatch(source, /Choose another in step 1|Go back and choose another one/)
})
test('removed signup fields remain available to authorized owners/admins without deleting stored profiles or changing backend validation', async () => {
  assert.match(await read('components/business-public-profile-editor.js'), /initial.description|initial.brands/)
  assert.match(await read('components/admin-business-editor.js'), /brandsText/)
  const schema = businessApplicationSchema.shape.business.shape
  assert.equal(schema.slug.safeParse('../malicious').success, false)
  assert.ok(schema.public_profile)
})
test('registration header retains only the short help link below its heading, with no pricing paragraph', async () => {
  const source = await read('components/business-onboarding.js')
  assert.match(source, /className="onboarding-help"[^>]*>\{PRICING_COPY\[locale\]\.contact\}<Icon name="arrow"/)
  assert.doesNotMatch(source, /Questions before you begin|Въпроси преди да започнеш|PRICING_COPY\[locale\]\.summary/)
  assert.equal(PRICING_COPY.bg.contact, 'Помощ при регистрация')
  assert.equal(PRICING_COPY.en.contact, 'Registration help')
})
test('FAQ and SEO describe current free access without a trial deadline, future pricing plan or verbal payment agreement', () => {
  const pricing = BUSINESS_FAQ.filter(row => row.group === 'commercial' || ['free-access', 'payment-details'].includes(row.id))
  assert.ok(pricing.some(row => row.id === 'free-access'))
  assert.ok(pricing.some(row => row.id === 'payment-details'))
  for (const locale of ['bg', 'en']) {
    const text = JSON.stringify({ copy: PRICING_COPY[locale], faq: pricing.map(row => row[locale]), seo: pageMetadata('/for-businesses', locale) })
    assert.doesNotMatch(text, /\b30\b|trial|free period|afterTrial|уточняваме|устн|безплатния период|по-късен етап|популярност|платено продължаване|paid continuation/i)
    assert.match(text, locale === 'bg' ? /безплатни/ : /are free/)
  }
})
test('shared home link is a white code-native 3D house with an accessible name, not a visible word or rectangular button', async () => {
  const link = await read('components/home-link.js'), icons = await read('components/icon.js'), css = await read('app/solar.css')
  assert.match(link, /aria-label=\{label\} title=\{label\}/)
  assert.match(link, /<Icon name="house3d"/)
  assert.doesNotMatch(link, /<span|<strong|<p/)
  assert.match(icons, /house3d:[^\n]*fill="#fff"/)
  assert.match(css, /a.site-home-link, a.site-home-link:hover \{ color: #fff; border: 0; background: transparent; box-shadow: none;/)
  assert.match(css, /width: 44px; min-width: 44px; height: 44px/)
})
test('the chosen shorter heading is present in both languages', () => {
  assert.equal(HOME_DISCOVERY_COPY.bg.title, 'Намери услуга. Запази час.')
  assert.equal(HOME_DISCOVERY_COPY.en.title, 'Find a service. Book a time.')
})
test('directions use customer-friendly copy while Google provider credits remain separate and unchanged', async () => {
  const card = await read('components/discovery-business-card.js'), kit = await read('components/google-discovery-list.js'), css = await read('app/discovery-home.css')
  assert.match(card, /const directionsLabel = copy.directions/)
  assert.match(card, /className="home-maps-label">\{directionsLabel\}/)
  assert.match(card, /row.source === 'google' && <span className="home-google-attribution" translate="no">Google Maps/)
  assert.match(card, /row.attributions.map/)
  assert.match(kit, /document.createElement\('gmp-place-attribution'\)/)
  assert.doesNotMatch(card + kit, /Заведи ме|Take me there/)
  assert.match(css, /\.home-maps-label, \.home-google-attribution \{[^}]*color: #1f1f1f;[^}]*font-size: 16px;[^}]*font-weight: 400;[^}]*white-space: nowrap;/)
})
