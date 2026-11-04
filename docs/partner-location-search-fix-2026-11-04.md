# Nearby partner eligibility, shaping queries and results navigation

## Owner-approved scope

Publish after local checks. No paid Google/AI verification, new provider, quota change, migration, booking mutation or customer-location collection. Existing partner/service/radius/publication gates remain intact.

## Root causes and changes

- Zen Barbershop and ВЕСИ СТУДИО had no stored latitude/longitude. A neighborhood name is not evidence of a distance within 2 km; nearby search correctly excluded them. The owner-authorized one-off repair in `operations/20261102-partner-coordinates.sql` has already been applied in Production. Do **not** rerun it. Its exact-target/address/revision guards intentionally reject a second execution.
- Zen's pin comes from the Google Maps place link published by its own website. ВЕСИ СТУДИО has no Google business listing: its pin is the public street-address/building point for Sofia, Sinanishko Ezero 13, not a claim that its entrance or Google membership has been verified. No neighborhood-centroid substitute was used.
- Owner/admin profile editors now explain missing nearby coordinates and accept either explicit numeric coordinates or an allowlisted full Maps pin URL locally. Short links and viewport-only map centers are rejected; no geocoding requests or automatic profile saves.
- Committed search responses, clarification and errors focus and scroll to the results heading, with reduced-motion support. Typing/source filters do not retrigger navigation.
- Automatic scrolling does not count as customer intent to reveal the farther distance band. That band requires deliberate downward wheel/touch/keyboard interaction or the explicit button.
- The service lexicon now recognizes shaping/threading in Bulgarian and English. A bare `оформяне` matches actual published shaping services; it does not substitute lamination. Explicit body area and threading method retain their evidence requirements.
- Compact partner cards visibly show up to three matching service names. Partner priority does not override service or radius eligibility, and unknown appointment availability remains unknown.

## Verification before publication

- Full Node test suite: **637 passed, 0 failed**; Next production build passed; `git diff --check` passed.
- Real public GoRez profile data was fetched read-only, then passed through the actual discovery engine locally with Google and AI disabled and a provider fetcher that throws. With the public Vesi address pin as a synthetic origin and 2 km radius:
  - `оформяне` → Zen, 0.3 km, including Оформяне на вежди с конец.
  - `оформяне на вежди` → Zen, 0.3 km, eyebrow shaping and the published combined hair/beard/brow service.
  - `фризьор` → Zen, 0.3 km, published haircut services.
  - `маникюр` → ВЕСИ СТУДИО, 0 km, Маникюр.
  These distances are test-origin distances, not a customer's live location.
- Browser QA on the development-only synthetic nearby fixture: one location callback; eligible partners before external examples; matching-service labels visible; automatic result focus/scroll; no farther cards revealed automatically. Desktop 1280 px and mobile 390 × 844 px, no horizontal overflow. Results heading settled approximately 24 px from viewport top on both.
- No live Google search, real GPS, reservation or email was used for these checks. Production Google integration itself is not re-tested by this release.

## Rollback

Revert the release code commit to restore the preceding interface/lexicon. Keep the corrected partner pins unless the owners supply a more accurate point: removing them would again exclude these businesses from coordinate-based nearby search. No schema rollback is involved.
