# Simple discovery interface — 27 October 2026

## Scope

- Sofia is initially selected on the home and search pages. A known city explicitly typed in a query overrides this implicit default; a deliberate city selection remains authoritative. Multiple typed cities still require clarification.
- The main controls are the query, city, Near me and three category shortcuts. Quarter, other categories and nearby radius are in a closed More filters disclosure. Radius can be set to 1, 3, 5, 10 or 25 km before requesting location, and applies only to nearby searches. Parser/ranking explanations are collapsed. No empty results panel is shown before the first search.
- Finder and result text is at least 16 px, with 44–52 px controls, keyboard focus outlines, and a narrow-screen layout. The home finder reuses its outer panel instead of nesting another padded panel.
- Internal results reuse genuine operator-supplied photos matched by stable business ID. Businesses without supplied photos do not receive invented images.
- External photos are rendered by `gmp-place-media` inside the existing attributed Advanced Place List. Google names, media URLs, photographs and author data are not copied into GoRez storage. Availability and GoRez booking remain unknown/unavailable for external listings.

## Near me

The explicit button requests browser geolocation once, with a 10-second browser timeout and an 11-second completion deadline. It does not watch location, infer it from IP, persist it, put it in URLs, or send it to analytics. When an entered query exists, successful consent immediately submits that query with coordinates and radius, without the default Sofia/quarter filter. The existing server schema, rate limits and provider gates remain authoritative.

Only internal businesses with known coordinates inside the requested radius can be called nearby. Unknown distances are not presented as verified proximity. Denied permission, unavailable location, timeout and out-of-Bulgaria coordinates have distinct messages; manual city search remains usable.

Browser/OS denial cannot be overridden by application code. Real-device permission and successful precise-location sharing require the owner's explicit action. Automated tests use synthetic city-centre coordinates only.

## Provider/cost boundaries

No migration, credential, trust, Google quota, service activation, paid model or billing-setting changes are included. Existing Production limits and the US$10 application reservation envelope are unchanged; this is not a guaranteed Google bill cap.

The native list is still instantiated once per explicit eligible search, with no new Details/Photos REST calls. Google documents Advanced Place List Pro as billed per component instantiation rather than included fields: <https://developers.google.com/maps/documentation/javascript/places-ui-kit/overview>. Photo rendering and attribution use the supported native template: <https://developers.google.com/maps/documentation/javascript/places-ui-kit/advanced-place-list>. Typography uses documented CSS variables: <https://developers.google.com/maps/documentation/javascript/reference/places-widget>.

## Verification

- 325 automated tests passed, including 12 finder regressions: Sofia and typed/manual city precedence, coordinate-only nearby requests, consent/timeout/denial/retry, genuine-photo tenant matching, exclusion of unknown-distance internal businesses, readable/collapsed controls and native Google media/attribution.
- Production build passed. No separate lint/typecheck command is configured; the Next build's compiler/type step completed.
- Local browser checks used the explicitly labelled development fixture, with Google, paid AI, email and real database access disabled. Confirmed default Sofia, typed Plovdiv, exact-time interpretation, closed secondary controls, and a 320 px home/search layout without horizontal overflow.
- Production deployment `2CeQhGab34dnRcS8Mb7EuCGkLUn9` / source `e3819cf` was Ready and assigned to `www.gorez.co`. A real city-less Bulgarian barber/date/time query selected Sofia and showed genuine Google photos, names, addresses, ratings and native attribution. The Production home finder was also checked at 320 px without overflow. A radius-preselection follow-up is verified below after its deployment.
- The owner explicitly approved a one-off precise-location test with GoRez/Google Maps. The in-app browser timed out; Safari reported existing site permission denial. Neither supplied usable coordinates, so no successful real nearby result is claimed. Denied and timeout recovery remain functional; the owner must restore Safari's location permission to complete that device-specific test. No global device permission was changed.

Existing booking, signup, email and subscription logic are unchanged. No real appointment or customer mutation is part of this UI verification.
