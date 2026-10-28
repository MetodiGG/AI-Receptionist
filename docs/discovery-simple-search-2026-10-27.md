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
- The owner explicitly approved a one-off precise-location test with GoRez/Google Maps. The in-app browser timed out; Safari returned permission denial. Read-only diagnosis found Safari's website-specific Location setting already at Ask, macOS Location Services on, but the macOS Safari location switch off. Neither browser supplied usable coordinates, so no successful real nearby result is claimed. Denied and timeout recovery remain functional. The owner was asked to enable Safari personally; no OS/browser permission was changed by the agent.

### Follow-up verified 28 October

- Source `a51034539bc33efe5c1c874830af11cab7230129` / Production deployment `7wEeXm6sEz7aiikegthi67rwKY7v` reached Ready. The live home page at `www.gorez.co` exposed 1, 3, 5, 10 and 25 km in More filters before geolocation; selecting 1 km was confirmed in the rendered control.
- A live home-page query without a city navigated to search automatically, interpreted Sofia and tomorrow (29 October), and displayed the real VESI STUDIO photograph, service price and checked slots. No reservation was created. The native Google media and attribution were also visually checked on the public origin, not a retired Preview key or mock.
- Responsive checks covered 320 px home/search and 390 px search/result cards, without horizontal overflow. Finder text/control fonts were inspected at 16–17 px minimum; Google names use the supported 22 px title token.
- The English page retained Sofia, the translated prompt and closed secondary filters. All 325 tests and the Production build passed again after the radius change.

### Safari permission follow-up

- The owner confirmed enabling Safari in macOS Location Services personally. On returning to the approved live Safari tab, the finder already showed Nearby selected and genuine native Google results with photographs, addresses and ratings. This verifies successful real location-based discovery after restoring OS access; no precise coordinates were read or copied into this report.
- The permission prompt had already been handled before the agent resumed, so its appearance was not directly witnessed by the agent. No site permission reset was performed merely to reproduce it.
- At this checkpoint a fresh 1 km provider-result check was pending; the 1 km rendered control and deterministic 1,000-metre provider request had been separately verified above. Safari was being used in another tab, so the agent requested a brief owner handoff instead of interrupting unrelated activity. Subsequent Safari reads timed out twice, including a fresh app binding. Completion after that handoff is recorded below.

### Completed live 1 km check

- After the owner explicitly returned the GoRez Safari tab for testing, the agent opened More filters, changed Nearby radius from 5 km to 1 km and confirmed the native control's selected value. Nearby remained active. The agent submitted Find once; the native Google list visibly entered loading and then completed.
- The completed accessibility state confirmed 1 km selected, nearby active, loading absent, 10 native Google Maps result links and 10 place photo elements, with no displayed search error. This verifies a fresh real search with the requested radius setting, not merely an existing city-only result or a synthetic fixture. No exact coordinates or provider catalogue payloads were copied into this report; physical distances were not independently surveyed.
- Safari was actively used again during an attempted combined screenshot, so no successful combined radius-and-results capture is claimed. The result above was confirmed before that interruption. The existing browser permission was reused; no new permission popup was forced, and no OS/site permissions were changed by the agent.
- No product code, Production environment, Google quota, billing configuration, appointment, customer or subscription change was needed for this final test. The previously passed 325-test/build baseline remains the deployed code.

Existing booking, signup, email and subscription logic are unchanged. No real appointment or customer mutation is part of this UI verification.
