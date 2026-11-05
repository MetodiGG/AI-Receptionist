# Unified discovery rail and automatic browsing — local review

Branch: `codex/unified-business-rail`, based on published `3d544eb44d98c0f0867a3c4f06139a8784f19811`.

## Implemented

- One horizontal **Разгледай бизнеси / Explore Businesses** section replaces the separate homepage directory and vertical search result sections. Already-budgeted farther matches append to the right after deliberate horizontal scrolling or **More businesses**. Vertical page movement never fetches more places.
- Actual eligible nearby partners precede Google places within the same distance band. A farther partner cannot jump ahead of nearer places; existing service, quarter, city, publication, radius and availability gates remain intact.
- Photo-less partners use the existing generated category illustration, not a fabricated business photograph. Cards retain actual partner reviews, clear partner badges and safe first-party booking links.
- Category captions remain on one line at narrow mobile and desktop widths; no mid-word wrapping or fixed two-line clipping.
- The map control is initially on. The homepage asks for browser location permission once on entry; the browser/OS still controls whether it shows a prompt. Off cancels a pending permission response and drops the in-memory point. Denied, unsupported, timed-out or out-of-country location falls back to the chosen city, initially Sofia.
- After the location decision, one initial **empty-query browse** request runs automatically. No city-then-nearby double request, AI extraction, guessed visitor location, storage or polling. A location/filter change starts a new deliberate request. Initial automatic loading does not move focus away from the hero; user searches still scroll to Explore Businesses.
- Empty browsing is an explicit validated mode, not a way to broaden a specific service request. It uses existing active public partner services across industries. Nearby Google browsing sends one bounded request using documented types from the existing taxonomy; city browsing uses a broad appointment-services text query. Category selection remains the way to request a specific service. This is a selection, not an exhaustive directory; categories without precise Google types are not promised equal broad-browse coverage.
- All automatic requests use the existing same-site validation, persisted rate limits and budget reservations. No quota, key, provider enablement, billing tier or monetary limit was increased. Exhausted or failed Google discovery leaves eligible GoRez partners available. A network error also preserves available first-party directory cards with a retry notice.
- Google booking-convenience priority uses independently approved first-party records for exact Place IDs, within each distance band. Name similarity never establishes partnership or merges records.
- Privacy/FAQ copy explains automatic browsing, optional location, city fallback and provider attribution.

## Provider constraints / not claimed as complete

The Bulgarian EEA account continues using the approved **Places UI Kit**. REST content is not enabled for the EEA and Google card content is not scraped, stored or copied into custom cards.

The native list is horizontal, uses documented orange theme properties and retains photos, ratings, attribution, directions, website and phone actions where the provider supplies them. Selecting a card opens the existing verified-booking lookup in a compact dialog rather than a second business list below the rail.

The supported native widget controls its visible action labels and internal card layout. This implementation **does not** promise a custom Google `Reserve now` label, exact custom bottom-left/bottom-right action placement, per-item custom kilometre overlay or automatic website-versus-phone suppression/order. It does not claim an ordinary website is a verified booking page. Achieving that exact design needs a separately reviewed, permitted integration; it must not be implemented by scraping the widget or silently switching to an experimental API/billing tier. Partner cards have the requested custom layout and distance badges.

No live Google widget or metered provider request was run for this change. The actual provider rendering, content/actions and broad city-query coverage remain live-test items. Current app budget reservations conservatively count the search and each native list; a displayed batch may consume more than one reservation. The limits are not a hard cap on the whole Google invoice.

Official references checked 2026-11-05:

- [Google EEA Places permitted uses](https://cloud.google.com/terms/maps-platform/eea-places-api-permitted-uses)
- [Advanced Place List](https://developers.google.com/maps/documentation/javascript/places-ui-kit/advanced-place-list)
- [UI Kit custom styling](https://developers.google.com/maps/documentation/javascript/places-ui-kit/custom-styling)
- [Place widget child elements](https://developers.google.com/maps/documentation/javascript/reference/place-widget-child-elements)
- [Nearby Search: multiple allowed types and bounded results](https://developers.google.com/maps/documentation/places/web-service/nearby-search)
- [Supported Place types](https://developers.google.com/maps/documentation/places/web-service/place-types)

## Verification

- `pnpm test`: **758 passed**, 0 failed, 0 skipped (31 additional tests over the published baseline, including 11 automatic-browse tests).
- `pnpm build`: passed.
- `git diff --check`: passed.
- Local browser fixture, fictional businesses/location, no Google/AI requests or reservations: automatic empty-query nearby loading; denied-location city fallback; manual off with empty query; late pending grant ignored; category search and focus navigation; horizontal farther-batch reveal; one rail and no Results/filter-summary UI.
- Responsive UI checks at 320 px, 390 px and 1440 px: document width equals viewport; all 14 category captions are one 24 px line. English desktop and Bulgarian mobile checked. Late permission cancellation retained off state, zero distance badges and city addresses after the pending grant completed. Initial automatic loading retained the empty query and did not focus the business heading; a manual category search did focus it. Farther cards appended at the same vertical position, not below the rail.
- No new dependencies, environment variables or database migrations. No production data, credentials, Google quota, Vercel setting or paid plan was changed. This branch has not been deployed.

Local review: `http://127.0.0.1:3037/dev/homepage?lang=bg` (server requires `DISCOVERY_ENABLED=true DISCOVERY_DEV_MOCK=true`). The fixture is development-only, explicitly fictional and booking-disabled; it is never served in production. The worktree has no production Supabase or Google secrets; the real `/` route is not claimed to function against live services locally.

Review screenshots (synthetic local data, not live Google cards):

- [Mobile BG](2026-11-05/unified-rail-mobile-bg.jpg)
- [Desktop EN](2026-11-05/unified-rail-desktop-en.jpg)
- [Farther batch continuing right](2026-11-05/unified-rail-scroll-mobile-bg.jpg)
