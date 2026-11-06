import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { railCategory, railPhone, railExternalAction, railDirections, orderedRailRows, prioritizeVerifiedBookingIds, googleRailWidth } from '../lib/discovery/rail.mjs'
import { normalizeGooglePlaces, GOOGLE_SEARCH_FIELDS } from '../lib/discovery/google-places.mjs'
import { businessArtCategory } from '../lib/category-art.mjs'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const place = (patch = {}) => ({ id: 'google:a', placeId: 'ChIJ_fixture_12345', source: 'google', name: 'Fixture', ...patch })
const partner = (patch = {}) => ({ id: 'partner:a', source: 'gorez', slug: 'fixture-only', name: 'Fixture', industry: 'auto', services: [{ name: 'Смяна на масло' }], ...patch })
const now = Date.parse('2026-11-05T10:00:00Z')
const approved = (patch = {}) => ({ place_id: 'known-booking', booking_url: 'https://example.com/book', verification_status: 'approved', verified_by: 'admin', verified_at: '2026-11-01T10:00:00Z', last_checked_at: '2026-11-01T10:00:00Z', ...patch })

test('a photo-less partner uses the established category taxonomy and generated artwork, never a fake business photo', () => {
  assert.equal(businessArtCategory(partner()), 'auto_repair')
  assert.equal(railCategory(partner()), 'Автосервиз')
  assert.equal(railCategory(partner(), 'en'), 'Auto repair')
  assert.equal(railCategory(partner({ category: 'nails' })), 'Маникюр')
})
test('phone fallback accepts only a bounded real telephone value, not links, extensions or injected markup', () => {
  assert.equal(railPhone('+359 (88) 123-4567'), 'tel:+359881234567')
  assert.equal(railPhone('02 123 4567'), 'tel:021234567')
  for (const value of ['', null, '+359abc', '+359;phone-context=evil', 'javascript:alert(1)', 'tel:+359123456', '+3591234?x=1', '123+456', '1'.repeat(50)]) assert.equal(railPhone(value), null)
})
test('verified booking wins, otherwise website wins over phone, and an unreachable business gets no reservation action', () => {
  const id = '11111111-1111-4111-8111-111111111111'
  assert.deepEqual(railExternalAction(place({ booking: { id }, website: 'https://example.com/', phone: '+359000000000' })), { kind: 'verified', id })
  assert.deepEqual(railExternalAction(place({ website: 'https://example.com/', phone: '+359000000000' })), { kind: 'website', href: 'https://example.com/' })
  assert.deepEqual(railExternalAction(place({ phone: '+359000000000' })), { kind: 'phone', href: 'tel:+359000000000' })
  assert.equal(railExternalAction(place()), null)
  assert.equal(railExternalAction(partner()), null)
  assert.equal(railExternalAction(place({ booking: { id: '------------------------------------' } })), null)
})
test('website actions reject insecure, credential-bearing, private, token-bearing and open-redirect destinations', () => {
  for (const website of ['javascript:alert(1)', 'data:text/html,x', 'http://example.com', 'https://a:b@example.com/', 'https://127.0.0.1/', 'https://metadata.google.internal/', 'https://example.com/?next=https://evil.com', 'https://example.com/#private', 'https://example.com/?token=private']) assert.equal(railExternalAction(place({ website })), null, website)
})
test('directions use a real business point or public address without transmitting the visitor origin', () => {
  const url = new URL(railDirections(partner({ coordinates: { latitude: 42.66, longitude: 23.28 }, address: 'public address' })))
  assert.equal(url.origin, 'https://www.google.com'); assert.equal(url.searchParams.get('destination'), '42.66,23.28')
  assert.equal(url.searchParams.has('origin'), false)
  assert.equal(new URL(railDirections(partner({ address: 'София, ул. Примерна' }))).searchParams.get('destination'), 'Fixture, София, ул. Примерна')
  assert.equal(railDirections(partner()), null)
  assert.equal(railDirections(partner({ coordinates: { latitude: null, longitude: null } })), null)
})
test('Google directions link only uses the exact validated Place ID, never a supplied maps URL or guessed name match', () => {
  const url = new URL(railDirections(place({ mapsUrl: 'https://evil.com/', name: 'not used' })))
  assert.equal(url.searchParams.get('destination_place_id'), 'ChIJ_fixture_12345')
  assert.equal(url.searchParams.get('destination'), 'ChIJ_fixture_12345')
  assert.equal(railDirections(place({ placeId: '../private' })), null)
})
test('eligible nearby partners precede contacts, while farther partners can never jump ahead of nearer Google places', () => {
  const rows = [partner({ id: 'far', proximityBand: 'further', distanceKm: 4 }), place({ id: 'near', distanceKm: .1 }), partner({ id: 'local', distanceKm: 1.8 })]
  assert.deepEqual(orderedRailRows(rows).map(x => x.id), ['local', 'near', 'far'])
})
test('known verified booking, website, phone and no-contact places have deterministic priority inside the same radius band', () => {
  const variants = [place({ id: 'none', placeId: 'none', distanceKm: .1 }), place({ id: 'phone', placeId: 'phone', phone: '+359000000000', distanceKm: .2 }), place({ id: 'web', placeId: 'web', website: 'https://example.com/', distanceKm: 1 }), place({ id: 'verified', placeId: 'verified', booking: { id: '11111111-1111-4111-8111-111111111111' }, distanceKm: 1.2 })]
  assert.deepEqual(orderedRailRows(variants).map(x => x.id), ['verified', 'web', 'phone', 'none'])
})
test('row deduplication never merges two sources by business name and bounds the displayed batch', () => {
  assert.equal(orderedRailRows([place(), place(), partner()]).length, 2)
  assert.equal(orderedRailRows(Array.from({ length: 30 }, (_, i) => partner({ id: `p${i}` }))).length, 15)
  assert.deepEqual(orderedRailRows([{ id: 'x', source: 'invented' }, null]), [])
})
test('booking-convenience priority uses independently verified first-party records and preserves all remaining provider order', () => {
  const ids = ['nearest', 'known-booking', 'last']
  assert.deepEqual(prioritizeVerifiedBookingIds(ids, [approved()], now), ['known-booking', 'nearest', 'last'])
  assert.deepEqual(ids, ['nearest', 'known-booking', 'last'])
  for (const patch of [{ verification_status: 'draft' }, { disabled_at: '2026-11-02' }, { verified_by: null }, { verified_at: '2027-01-01' }, { last_checked_at: '2026-01-01' }, { booking_url: 'http://example.com/book' }]) assert.deepEqual(prioritizeVerifiedBookingIds(ids, [approved(patch)], now), ids)
})
test('horizontal widget width is bounded and cannot be inflated by arbitrary input', () => {
  assert.equal(googleRailWidth(12), 12); assert.equal(googleRailWidth(9999), 15)
  for (const count of [-2, 0, '12', NaN, 1.5]) assert.equal(googleRailWidth(count), 1)
})
test('optional non-EEA contact/review payloads remain factual and do not expand the Google search field mask', () => {
  const rows = normalizeGooglePlaces({ places: [{ id: 'fixture_12345', displayName: { text: 'Provider fixture' }, googleMapsUri: 'https://www.google.com/maps/', websiteUri: 'https://example.com/', nationalPhoneNumber: '+359000000000', rating: 4.6, userRatingCount: 12 }] }, 'nails')
  assert.equal(rows[0].website, 'https://example.com/'); assert.equal(rows[0].phone, '+359000000000')
  assert.equal(rows[0].rating, 4.6); assert.equal(rows[0].reviewCount, 12)
  assert.doesNotMatch(GOOGLE_SEARCH_FIELDS, /rating|website|phone|reviews|photos/i)
})
test('one Explore Businesses rail replaces the previous browse-plus-results layout in both homepage and search', async () => {
  const source = await read('components/discovery-search.js')
  assert.equal((source.match(/<DiscoveryHomeBusinesses /g) || []).length, 1)
  assert.doesNotMatch(source, /className="discovery-results"|className="discovery-understood"|className="discovery-source-tabs"|copy.results|DiscoveryCard/)
  assert.match(source, /result=\{result\} resultKey=\{resultKey\} loading=\{loading \|\| locating\}/)
  assert.match(source, /headingRef=\{resultHeading\}/)
})
test('only partners get a membership badge, ratings follow services, and exact addresses stay in business details', async () => {
  const card = await read('components/discovery-business-card.js')
  assert.match(card, /internal && <span className="home-business-partner"/)
  assert.ok(card.indexOf('home-business-category') < card.indexOf('<PartnerRailReviews'))
  assert.ok(card.indexOf('className="home-business-services"') < card.indexOf('<PartnerRailReviews'))
  assert.match(card, /DiscoveryDistanceBadge origin=\{distanceOrigin\} destination=\{row.coordinates\}/)
  assert.match(card, /fallbackKm=\{nearby \? row.distanceKm : null\}/)
  assert.doesNotMatch(card, /home-business-address/)
  assert.match(card, /DiscoveryBusinessDetails/)
  const details = await read('components/discovery-business-details.js')
  assert.match(details, /row.address && <section/)
  assert.match(card, /className="home-directions"/)
  assert.doesNotMatch(card, /copy.external|externalHint|външни места|outside business|Няма снимка/)
})
test('Google stays in its attributed horizontal UI Kit with native contact actions, not a scraped counterfeit card', async () => {
  const source = await read('components/google-discovery-list.js')
  assert.match(source, /setAttribute\('orientation', 'horizontal'\)/)
  for (const tag of ['gmp-place-media', 'gmp-place-name', 'gmp-place-type', 'gmp-place-rating', 'gmp-place-attribution']) assert.ok(source.includes(tag), tag)
  assert.match(source, /!nearby \? \['gmp-place-address'\]/)
  assert.match(source, /setAttribute\('action','open-website'\)/)
  assert.match(source, /setAttribute\('action', 'call'\)/)
  assert.doesNotMatch(source, /\.shadowRoot|fetchFields|innerHTML|textContent\s*=|copy.externalHint/)
})
test('subsequent pages use the same rail after a user advance, never an observer loop or More button', async () => {
  const rail = await read('components/discovery-home-rail.js'), browse = await read('components/discovery-home-browse.js')
  assert.match(rail, /movingRight && onNearEnd && advance.current.consume/)
  assert.match(rail, /onWheel=/)
  assert.match(rail, /onPointerDown=/)
  assert.match(browse, /onNearEnd=\{hasMore && !loadingMore && !moreError \? advanceBusinesses/)
  assert.match(browse, /if \(hiddenFurther\) setExpanded\(true\)/)
  assert.doesNotMatch(browse, /home-more-businesses|Още бизнеси|More businesses/)
  assert.doesNotMatch(rail + browse, /fetch\(|IntersectionObserver|window.scrollY|readBookablePlaces/)
})
test('category labels never wrap, split letters, or rely on fixed two-line clipping', async () => {
  const css = await read('app/discovery-home.css')
  assert.match(css, /\.home-categories button > span \{[^}]*white-space: nowrap; overflow-wrap: normal; word-break: normal/)
  assert.match(css, /\.home-categories \.home-discovery-rail > li \{ width: max-content;/)
})
test('entry permission request is deferred once, off cancels pending callbacks, and browsing waits for the location decision', async () => {
  const source = await read('components/discovery-search.js')
  assert.match(source, /useState\(home \|\| Boolean\(initialInput\?\.coordinates\)\)/)
  assert.match(source, /locate\(\{ automatic: true, searchAfter: false \}\)/)
  assert.match(source, /if \(!mounted.current \|\| locationVersion.current !== entryVersion \+ Number\(automatic\)\) return/)
  assert.match(source, /if \(entryVersion !== locationVersion.current\) return/)
  assert.match(source, /version !== locationVersion.current/)
  assert.match(source, /setLocationEnabled\(false\); setLocating\(false\); setCoordinates\(null\)/)
  assert.match(source, /if \(searchAfter && canDiscover\(\)\)/)
  assert.match(source, /return \(\) => clearTimeout\(timer\)/)
  assert.doesNotMatch(source, /watchPosition|localStorage|sessionStorage/)
})
