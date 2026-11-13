# Location integrity and panel-paint thumbnail hotfix — 2026-11-13

Prepared independently from the unpublished catalogue expansion, from published
commit `1ab07e29ec9bc053e53a661b592fedf5c28cf2a4`.

## Confirmed findings

- IN Beauty's live owner contact page, `https://inbeauty.bg/kontakti`, names
  ул. Генерал Иван Колев 2 and phone +359883335003, but its named-business
  JSON-LD supplies `42.6852,23.3245`. That point is in central Sofia, not the
  reported/visually corroborated Кръстова вада premises. Its iframe searches
  by postal address and is not independent confirmation of that JSON-LD pin.
  The old domain redirects to the same single current owner website.
- Retired that point; corrected the quarter, keeping the actual street address,
  services and prices unchanged. No replacement point was guessed or copied
  from Google Maps. A known-bad-pair guard prevents adding `sourceAddress`
  metadata from rehabilitating the same wrong point.
- Directions use the displayed postal address while badge distances use stored
  points. These can disagree if an owner publishes a wrong point. Distances
  are straight-line geometry, not driving distance, journey time or a route API.
- Native admin/owner address writes could retain a stale manual pin; an old
  public-profile editor could also restore that pin after a newer address edit.
- Browser points lacked accuracy/freshness checks and navigation memory could
  keep them indefinitely. Distance rendering could use newly edited filters
  rather than the origin of the accepted response.
- АИМ АУТО ПЕЙНТ's public service `Боядисване на детайл` was classified as hair
  colouring before checking its real automotive context. The notebook was the
  neutral fallback, not a matching service photograph.

## Implemented safeguards

- One final address-binding boundary serves catalogue search, details and
  partner import. A snapshot binds 161 retained legacy owner-point pairs to
  their exact ID/address/city/quarter/source. **This is stale-data protection,
  not independent certification of geographic accuracy.** New owner points
  must carry their reviewed `sourceAddress`. OSM points retain exact-address
  metadata and attribution. Changed/unbound points become unknown, never 0 km.
- Invalid/partial/outside-Bulgaria pins are rejected on native writes and hidden
  on public reads without discarding valid descriptions/payment information.
- Owner settings use an authenticated, verified-owner, same-origin,
  rate-limited server endpoint. Physical address changes clear retained pins
  atomically. Owner/public-profile editors bind their original drafts to
  `content_revision`; stale concurrent saves return 409. No new migration or
  database grants; existing owner PostgREST permissions are unchanged.
- Browser acquisition requests high accuracy with no cached position, requires
  accuracy within 250 m and a recent timestamp, and expires in-memory points at
  five minutes. Expired points clear safely without background permission
  requests, navigation or focus jumps. API payloads retain the existing
  latitude/longitude/consent contract; accuracy/time remain ephemeral.
- Responses, pagination and displayed origins are generation- and
  request-bound, including suspended-tab expiry. No numeric distance fallback
  is shown without an origin. Very small nonzero distances show `<0,1 km`
  instead of an apparently exact zero.
- Exact short public brands such as IN Beauty remain searchable without
  widening partial/generic service searches or explicit category constraints.
- The panel-paint rule uses the actual activity and automotive context, not a
  hardcoded partner ID. Business-provided rights-cleared photos keep priority.
  A new reviewed generic spray-painting frame replaces the notebook. Its prompt,
  original/derivative hashes and review are recorded in the existing photo
  manifest. Final asset: `public/service-photos/sx-auto-panel-spray-paint-v1.webp`,
  256×256, 8,774 bytes. It is illustrative, not verified work by the business.
- The sanitized dated native service fixture now includes the new sixth
  partner and its actual service ID, 300 EUR and 60 minutes, read through the
  public API only. It contains no contacts, staff, customers or reservations.

## Audit coverage and limits

`node scripts/audit-catalogue-locations.mjs` reads all 981 current raw catalogue
records: 873 premises and 108 service-area providers; 207 remaining points,
161 owner-published and 46 previously address-geocoded; 774 records without a
point. No invalid numeric points, out-of-Sofia bounds, service-area pins or
OSM source-address mismatches were found. Among currently eligible records,
159 owner points and 43 OSM points are published. The 23 owner-excluded medical
listings remain excluded. No default city-centre points were assigned.

The source checks also covered the staged expansion locally, but none of its
221 unpublished additions are included in this isolated hotfix. Two additional
owner points there need explicit address-binding metadata when integration
resumes; its photo manifest must be merged, not overwrite this new asset.

The six public active partner records were read without authentication: four
have numeric pins and two are currently unlocated. Bounds/type checks do not
prove the four actual venues geographically correct.

**Not completed:** independent address-to-point verification of every owner
point. A separate, bounded one-time Nominatim permission request (up to 165
public business addresses, cached, one process, at most 1 request/second) is
pending. No new geocoding batch has run. Existing cache entries were inspected,
not misrepresented as new verification. User/device GPS and the user's private
current-location destination were not saved in the repository or sent to a
geocoder. No production business/profile/booking writes or notifications.

Policy for the proposed one-time check:
https://operations.osmfoundation.org/policies/nominatim/

## Validation

Final integrated results:

- `pnpm test`: **1,980 / 1,980 passed**, final run 50.7 seconds.
- `pnpm catalogue:check`: passed; 8,924 / 8,924 eligible catalogue service
  rows have specific photos, zero neutral/missing/invalid images; 1,104 reviewed
  generated photos have complete provenance. The updated six-partner fixture
  has 25 raw rows, 22 visible specific thumbnails and three preserved hidden
  placeholder rows. Nine existing exact partner associations stay unchanged;
  panel painting is a generic activity match with separate manifest evidence.
- `pnpm build --webpack`: passed after all runtime changes, including the final
  cold-start optimization that reuses trusted immutable rows instead of
  validating the whole service inventory a third time.
- `python3 tests/pricing-extraction_test.py`: 8 / 8 passed.
- `python3 tests/booking-pricing-flow_test.py`: 4 / 4 passed.
- Read-only local location audit: passed with the limits/counts above.
- `git diff --check`: clean.
- Actual component visual check: no horizontal overflow at 360, 390, 430, 768
  and 1280 px; correct 56–60 px WebP loaded. Service calendar action selected
  the synthetic actual-ID fixture and revealed its shared booking calendar.
  No date/time/customer/confirmation was submitted. IN Beauty was found by
  exact name with unknown rather than false kilometres and its retained
  street address was checked in the details dialog.

Tests use synthetic positions and mocked/local booking fixtures, never real bookings.
Mobile/desktop screenshot proof is saved in the thread's visualization folder,
`location-photo-hotfix-20261113`. The real thumbnail rendered at 56–60 px, with
no horizontal document overflow at 360, 390, 430, 768 and 1280 px.

No deployment has been performed.
