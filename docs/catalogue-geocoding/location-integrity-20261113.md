# Location integrity and panel-paint thumbnail hotfix — 2026-11-13

Prepared independently from the unpublished catalogue expansion, from published
commit `1ab07e29ec9bc053e53a661b592fedf5c28cf2a4`.

## Completed address review follow-up

All **981 existing catalogue records and six public active partners** were
included in the local metadata/address comparison. This is not a claim that
every entrance was independently visited or verified.

- The approved one-time Nominatim cohort is complete: 165 targets, 156 fresh
  requests, nine cached/duplicate savings, one process at 2.1-second intervals.
  It supplied too few exact house-number matches to resolve the full inventory.
  The approval is now **network-closed**, including its unused request allowance.
  Frozen identities and cache-ledger tests prevent a future inventory from
  silently spending it again. No client coordinates, contacts or booking data
  were sent. Reclassification and subsequent matching were fully offline.
- Downloaded the official **GIS Sofia / Sofia Municipality** address register
  once. Its CC BY 4.0 snapshot of 2026-08-28 contains 125,245 points, 83,189 in
  Sofia. SHA-256: `b3173733d4356d34eef9549dee8cff14cf3ed17184e7724081120ca504b8208a`.
  No business addresses were transmitted to the municipality. The 40 MB source
  remains outside the repository and customer/runtime bundles.
- Added **359 previously missing exact postal-address points** and replaced
  **seven confirmed bad pairs**: IN Beauty, San Krasi, Carbox, Xzona, Rhythm
  Academy, Classy and Inergy Borovo. Coordinates come unchanged from the
  municipal register, not from Google. Each has its original address row/RN,
  dataset source, licence, review date and exact address/city/quarter/website
  binding. New owner pins cannot be overwritten by an older frozen match.
- The register contains duplicate address metadata, sometimes kilometres apart.
  No nearest/first/centroid rule resolves duplicates. IN Beauty was manually
  disambiguated to northern RN **113534**, using the owner's address and visual
  named-business corroboration. Southern RN3883 was not selected automatically.
- Manually inspected all eight existing-point discrepancies above 75 m.
  Five were corrected (Carbox, Xzona, Rhythm, Classy and Inergy); AutoXpert,
  Shining and the Europe sports hall retain their more specific venue points.
  A campus postal-number point is not necessarily the actual building entrance.
- Corrected directions are exact-business/address-bound. AIM uses the user's
  confirmed public business pin; Autocomplexrs uses its owner's published named
  venue map, without copying a provider coordinate. Kerelski's current/pending
  №81/№83 variants direct to the user-confirmed №83 owner marker. Its production
  address/quarter/pin correction was separately approved and applied through the
  existing admin editor with audit reasons. Public page and directory readback
  confirm **София, Манастирски ливади, ул. Пирин 83**, stored quarter and owner
  point `42.66385031216646,23.284281405717884`. Services, prices and reservations
  were not edited; the street field contains only `ул. Пирин 83`, not a duplicate
  quarter. The temporary legacy address variants remain strictly ID-bound.
- Existing OSM receipts and their public ODbL export remain byte-identical. The
  new CC BY subset and compact source/licence credit are separate. Retired
  wrong points cannot be revived by changing their source or adding metadata.

Source: https://urbandata.sofia.bg/dataset/address_sofia-zip
Licence: https://creativecommons.org/licenses/by/4.0/

Frozen derived subset: `public/catalogue-official-address-points-20261113.json`.
Per-record report: `all-locations-audit-20261113.json`.
Offline replay: `node scripts/verify-official-sofia-address-subset.mjs --dataset /absolute/path/address_sofia.geojson`.
Executed replay: **366/366 points reproduced unchanged**; 365 unique matches and
one explicitly approved duplicate disambiguation.

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
records: 873 premises and 108 service-area providers; **567 usable points**,
158 owner-published, 43 historical OSM and 366 official postal points; 414 rows
without a point. Among the **958 currently eligible listings**, 562 have points,
288 physical premises remain unlocated, and 108 service-area providers correctly
have no fixed point. No invalid types/bounds, source-address binding mismatches,
service-area pins or unknown methods were found. The 23 owner-excluded medical
listings remain excluded. No city-centre point is assigned to a business.

The source checks also covered the staged expansion locally, but none of its
221 unpublished additions are included in this isolated hotfix. Two additional
owner points there need explicit address-binding metadata when integration
resumes; its photo manifest must be merged, not overwrite this new asset.

The six public active partner records were read without authentication: four
have numeric pins and two are currently unlocated. Bounds/type checks do not
prove the four actual venues geographically correct.

**Remaining limitation:** 288 eligible physical premises still lack an
unambiguous exact point. Existing owner/OSM points are distinguished from the
new official subset; metadata validity and approximate corroboration do not
certify an entrance. Ambiguous, numberless and unresolved addresses are not
assigned guessed distances. User/device GPS and the user's private current
location were not saved in the repository or sent to a geocoder. No production
bookings or notifications were created. The one separately approved Kerelski
profile correction and deployment are tracked independently below.

Policy for the proposed one-time check:
https://operations.osmfoundation.org/policies/nominatim/

## Validation

Final integrated results after the municipal review:

- `pnpm test`: **2,042 / 2,042 passed**, final run 45.8 seconds.
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

Deployment is approved by the user, but must be confirmed from the actual
release and public response before being reported as complete.
