# Location/navigation audit — 11 November 2026

## Scope and findings

Checked all 955 imported source records (932 publicly eligible, 23 owner-excluded
human clinics), plus the three currently public GoRez partners using the
read-only public businesses endpoint. Pending expansion packets are excluded.
This is a full route/data-flow audit, not independent GPS/entrance certification
of every business. No geocoder, paid API, database write or booking was used.

The details dialog displayed freshly fetched address information but reused
pre-rendered actions from its stale preview row. It now builds directions from
the fetched business and does not expose stale actions while loading/erroring.
The public details DTO explicitly supplies fresh city, neighborhood, coordinates
and location kind, including null coordinates, rather than retaining an old pin.

Both profile and discovery actions use one shared builder. The default is the
actual public postal address with explicit city/country, not a business-name
search or an unverified historic point. Boulevard България is not mistaken for
the country. Invalid, zero and swapped points are rejected by the coordinate-only
fallback. Mobile service-area operators have no fabricated fixed-premises route.
The existing exact Google Place ID path is preserved. No visitor origin is stored
or added to outbound links.

## Explicit source-bound landmark destinations

These are exceptions to postal-query routing, bound to BOTH catalogue ID and
unchanged address in `lib/business-directions-reviewed.mjs`. Moving a business
retires its old exception. Caller-provided arbitrary destination URLs are ignored.

| Business | Owner source | Qualified destination |
| --- | --- | --- |
| Niko 09 | https://niko09.bg/ | Named place href contains actual `!3d42.6611919!4d23.390778` and Place ID `ChIJGwPLXNWHqkARYOWWbYnFqMs`; not viewport. |
| Tennis Lyulin 6 | https://tennislulin.com/contact/ | Actual `google.maps.Marker({position:latlng})`, 42.707625017444485,23.256896419547754. |
| Game Castle Simeonovo | https://gamecastlebg.com/bg/contact | Printed GPS and same venue's directions href both 42.601408,23.350354. |
| Autotest 4 km | https://gtp.bg/punktove/ | Owner branch1093, exact branch URL/contact and visible mobile card bind 42.668101430658695,23.36885723387535. |
| GoPlus Lyulin | https://goplus.bg/контакти/ | Address-paired owner JSON-LD matches existing point; named Maps pin is approximately3m away, not the href's viewport. |
| G Point Sveta Troitsa | https://gpoint.bg/ | Normal rendered public branch anchor: `https://maps.app.goo.gl/8xCUuZiAiHwZmttk7`. |
| G Point Mizia | https://gpoint.bg/ | Normal rendered public branch anchor: `https://g.page/r/CQRnNUYohaUIEBM`. |
| Sugar Nails | https://sugarnails.beauty/контакти/ | Owner's actual `https://maps.app.goo.gl/FXwHkAvPxFFVEj7d6`; no invented GPS/house number. |
| VNL veterinary clinic | https://vnl-vet.com/ | Owner's actual `https://maps.app.goo.gl/Vx7eMd9EB6i932yx5`; embedded viewport is not imported as pin. |

Only three newly proven coordinate pairs were added to source data: Niko09,
Tennis Lyulin6 and Autotest4km. They are source-published positions, not surveyed
entrances. GameCastle and GoPlus retain their existing verified owner points.
The four owner short links were observed on the owner's site; their destination
coordinates were not scraped or represented as independently certified.

Yorki's named venue was refined to the postal address of Art Hotel Simona,
бул. Инж. Иван Иванов10, explicitly named by the groomer's own site and verified
on https://hotelsimona.com/contact/. No salon room or entrance was invented.
No service, booking target, price or price-review fingerprint was changed.

## Remaining geographic limitations

Dupissima Strelbishte, Puppy Bubbles and Master of Puppies still publish only
an intersection/street/neighboring block, without a verifiable exact entrance.
Their full published addresses remain the fallback, not invented map points.
CUT's literal `B2A` remains unchanged: it must not silently become `2А`.
Other complex/institution addresses may identify a venue, not an internal room.
Historic coordinates without a reproducible source receipt are NOT certified by
passing schema/bounds checks. Exact GPS must be obtained from the owner or an
appropriately authorized verification, not inferred from a map viewport.

Kerelski Pirin83 and Mokro Nosle Pirin85 remain distinct. Both owner-source
addresses were checked. The older numeric Kerelski link actually resolved to the
correct Pirin83 business in desktop Google Maps during this audit; the reported
iOS failure was not reproduced as a proven incorrect numeric coordinate.

Local ignored receipts under `.audit-work/catalogue-expansion-20261111/` retain
the pre-fix955 snapshot, postal classification,13 weak-case reviews and raw own
HTML. Those historical reports are not silently regenerated as post-fix proof.
Current implementation/test results are recorded separately in the final audit.

## Executed validation

- Full Node suite: 1285/1285 passed, no skips or failures.
- New location/render regression suite:13/13 passed, including all955 source
  routes and all932 eligible preview-to-full-detail pairs.
- Python pricing extraction8/8 and booking-pricing flow4/4 passed (direct file
  invocation; unittest discovery found0 tests and is not counted as a pass).
- `pnpm catalogue:check`: passed;0 blocked new/changed listings.
- `pnpm build`: passed;81/81 pages generated.
- Desktop browser: real read-only local catalogue searches/details for both
  reported examples; new address query resolved to Pirin85 in Google Maps.
- Local preview intentionally disables outbound booking and Maps actions;
  live action-context behavior is covered by the component/handler regressions,
  not claimed as an end-to-end production click test.
- Attempted viewport override retained actual1280×720 dimensions. No mobile
  breakpoint pass or iOS Maps-app verification is claimed.

No deployment was performed for this location correction. No migration, paid
plan, quota increase, customer booking or notification is part of this change.
