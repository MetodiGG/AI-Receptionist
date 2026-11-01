# Unified nearby discovery — 2 November 2026

## Requested experience

- One location action, consistently `Около мен` / `Near me`. The city selector no longer repeats a second “nearby” label. When location is active it offers `Град` / `City` for an explicit return to city search.
- The button requests browser location only on a deliberate click. Success immediately searches an existing query. If location is selected before a category, choosing a service starts the search using that same consented position. Repeated clicks while active are no-ops, not toggles, prompts or duplicate billable requests.
- Sofia stays the no-location default. A denied location leaves city search usable. Coordinates are not put in URLs, persistent browser storage, analytics or provider usage logs.
- Nearby starts with the existing 2 km default. Explicitly selected 1/3/5/etc. km radii and typed neighbourhood/city constraints stay strict. No far partner is silently promoted into the 2 km group.
- Eligible nearby partners appear first in compact cards with a smaller readable GoRez badge, address, actual straight-line distance where known, and their existing booking link. Within a source/distance group, distance wins over availability/completeness bonuses. These groups are **not** claimed to be one globally distance-sorted organic list.
- A visible `GoRez партньори` entry immediately below the search form opens the category directory without requiring a search. The existing business signup CTA remains alongside it on desktop / below it on mobile.

## Bounded expansion, provider and cost controls

The explicit nearby UI sends validated `expandNearby: true`. Only consented, unqualified 2 km searches qualify: named areas, explicit query radii and other manual radii do not widen.

The server retrieves **one** bounded batch within 5 km, with the existing maximum of 10–15 results across both bands/sources (configured default 12). It separates places within 2 km from places further out up to 5 km using full-precision distances. Nearby results receive the result cap before farther partners. Provider IDs with missing distances or out-of-range coordinates never enter a nearby band.

The later band is revealed after intentional downward scrolling into its sentinel, or the accessible `Покажи още места` button. No new server search, location request or AI call is triggered by scrolling. There is no pagination loop or promise of an exhaustive directory: if the bounded batch is full of nearby results, no farther batch is available.

For EEA listings, Google's own attributed Advanced Place List continues to render names, photos and ratings. The server requests only the existing `places.id,places.location` fields for location searches and retains no Google catalogue. Text Search now asks for `rankPreference: DISTANCE`, as Nearby already did. IDs keep provider order inside each distance band; no Google card contents are scraped or ratings re-ranked.

There can be **two UI Kit widget instantiations**, one per non-empty band. Each requires its own existing `ui_list` budget reservation before a browser plan is returned; the later widget is not mounted until the band is revealed. Unused later grants are conservatively counted, not refunded. Source toggles hide existing widgets rather than remounting them and spending an already-used grant again. The unchanged shared daily/monthly request and cost limits may therefore be reached earlier. This is not a guarantee or an increase of the Google billing-account cap. No quotas, credentials, paid AI, subscriptions, migrations or new paid services were changed.

Official references checked during implementation:

- [Text Search distance ranking](https://developers.google.com/maps/documentation/places/web-service/text-search).
- [Advanced Place List and its Pro billing tier](https://developers.google.com/maps/documentation/javascript/places-ui-kit/advanced-place-list).
- [Current pricing](https://developers.google.com/maps/billing-and-pricing/pricing): Nearby/Text Search Pro $32/1,000 after their applicable free caps; UI Kit Pro $5/1,000 after its applicable free cap. These match the existing conservative application reservation costs; no free usage or zero customer operating cost is promised.
- [EEA Places adjustments / UI Kit](https://developers.google.com/maps/comms/eea/places).

## Verification

- 624 automated tests passed, no failures. Existing search corpus, booking, partner-publication, tenant/security, media and onboarding regression tests remain in the full suite.
- Optimized production build / TypeScript passed.
- Guarded `/dev/nearby` uses a conspicuously labelled synthetic location and fictional providers; no real OS location request, Google/AI request, reservation, business edit or email.
- Browser checks: service then Near me; Near me then service; one location callback despite repeated clicks; partner distances 0.7/1.8 km ordered correctly; 4.2 km partner absent from initial group; scrolling reveals a separately labelled farther band with a 3.1 km external example; 5.04 km is excluded.
- Denied location falls back to successful city search. English 320px and Bulgarian 390px have no horizontal overflow. Native production Google widgets / actual GPS are deliberately **not live-tested**, per owner instruction.
- Local proof: `/tmp/gorez-nearby-expanded-local-20261102.png` and `/tmp/gorez-nearby-mobile-local-20261102.png` (fictional fixtures, not real provider results).

Publication was approved after checks, without a paid test. Production verification is recorded separately after deployment.
