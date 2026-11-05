# Individual Google cards — LOCAL, inactive proposal

Prepared on 2026-11-05 in `codex/discovery-card-clarity`. No deployment, Google/AI request, database migration, quota change or paid-service activation was performed. This extends the existing Next.js app, not a new application.

## Implemented locally

- A GoRez-owned frame per exact Google Place ID: top-left distance band, own **Google Maps** directions action and orange **Резервирай час**. No overlay onto Google's name, photos or attribution.
- Consented device origin when location is on; otherwise the selected city's approximate reference point, explicitly labelled **от центъра / from centre**. Distances are straight-line estimates, not walking/driving routes or ETAs. Missing points never become zero or fabricated km.
- Reproducible CC0 reference points for all 257 existing NSI EKATTE city identifiers. The source is Wikidata P3990 + P625, not Google's business data. These settlement points are a display reference, not cadastral centroids, business entrances, a device location or a radius search origin. No runtime geocoding. Per-city source URLs live in `lib/discovery/city-reference-points.mjs`; `scripts/review-city-reference-data.mjs` emits the refresh candidate to stdout for review, never overwrites the file automatically.
- Native `gmp-advanced-place-details-compact` selects real provider media, name, type, rating, optional address and required attribution. Google remains responsible for their factual contents and standard visual order.
- Independently approved exact-business booking record: the existing tracked outbound booking form links directly to the revalidated booking page. No new reservation, invented slot or automatic confirmation.
- Otherwise one main orange button opens an accessible modal. It instantiates a native details component with Google's actual website/phone fields/actions. A generic website is explicitly not a verified booking page. A missing contact can fall back to Google Maps; no contact URL or phone number is scraped or guessed.
- Lazy card instantiation only when the card intersects the viewport/rail. Each card mount, deliberate retry and contact-panel mount requires a fresh, durable budget reservation. No automatic provider retries. Contact panels are charged separately in the estimate.
- Signed exact-ID/locale/environment permits expire after ten minutes. Strict bounded POST requests accept only a permit and the fixed `card`/`contacts` purpose. Same-site checks, existing persistent rate limiting, shared atomic count/cost RPC, no-store responses, no secret/provider-error disclosure. A replay still consumes the budget, not a prepaid unlimited entitlement.

## Disabled configuration

`GOOGLE_DISCOVERY_CARDS_ENABLED=false` is the default. To opt in later requires that flag, the existing approved UI Kit flags, a restricted browser key and a new server-only `GOOGLE_DISCOVERY_CARD_SECRET` (32–256 characters). Do not use `NEXT_PUBLIC_` or a browser value for the signing secret. Provisioning/activation has **not** been performed. The current batched list remains the fallback while off or unconfigured. No JSON service-account key or broader REST permission is introduced.

The server endpoint is `/api/public/discovery/google-card`. It returns 404 while disabled, before touching budget storage. No migration is needed: `ui_card` and `ui_contacts` reserve the existing Google buckets with a fixed conservative gross US$0.005 each. Existing daily/monthly counts, cost caps and Google project quotas are unchanged.

## Cost comparison (global PAYG, USD)

Official pricing checked 2026-11-05:

| SKU | Monthly no-cost allowance | First paid tier / 1,000 events |
| --- | ---: | ---: |
| Places UI Kit Pro | 5,000 | US$5 |
| Nearby Search Pro | 5,000 | US$32 |
| Text Search Pro | 5,000 | US$32 |
| Text Search Essentials IDs-only | Unlimited | US$0 |

Usage/free allowances aggregate across all projects on the same billing account by SKU, not by visitor or website. The existing city search retains the `places.id` field mask; it does **not** add coordinates and silently upgrade to Text Search Pro. The individual native widget's documented public location supplies the business point for the display badge. Consented nearby searches retain `places.id,places.location` and their existing Pro search SKU.

Current list: typically one UI Kit Pro instantiation per near batch, potentially another for the farther batch. Proposed variant: **N actually loaded native cards + C actually opened native contact panels**. Photos/ratings selected within those widgets do not add REST Details requests. A widget remount or manual retry is another reservation/event; a plan or permit is not a browser-wide billing barrier.

Examples assuming all relevant no-cost allowances remain unused:

| Scenario | UI Kit events | Search events | Estimated Google charge |
| --- | ---: | ---: | ---: |
| 100 visits × 3 loaded cards | 300 | 100 Nearby Pro | US$0 |
| 100 visits × 3 cards + 1 contacts panel | 400 | 100 Nearby Pro | US$0 |
| 100 visits/day × 30 days × 3 cards | 9,000 | 3,000 Nearby Pro | US$20 |
| Same + 1 contacts panel per visit | 12,000 | 3,000 Nearby Pro | US$35 |

These scenarios are not guarantees, live quotas or promises that the current app allows that traffic. Run `node scripts/estimate-google-cards.mjs`; the pure estimator accepts prior per-SKU usage and models volume tiers without equating visits to API events.

Code defaults are 40 Google reservations/day, 500/month and US$20 gross monthly reservations; these are **not a read of current Production settings** (the owner's earlier approval specified a US$10 app budget). A nearby search + 3 cards consumes four count units; opening contacts consumes a fifth. At the code-default 500 monthly count cap that is at most about 125 such four-unit visits, before other Google use. Do not raise either cap to make the example traffic fit without permission. The app reserves gross unit costs conservatively even when a Google no-cost allowance may remain.

Public browser keys can be reused outside the application. Referrer/API restrictions, application caps and budget alerts do not guarantee a hard ceiling on the entire Google invoice. No remaining Google allowance, billing balance or exchange rate was queried; figures are USD, not guessed EUR.

## Verification and honest limits

The offline page is `/dev/google-cards?lang=bg` (also `en`). It is development-only and explicitly labels every fabricated card. It uses no Google script, key, real location, call, navigation or booking. It tests the GoRez frame/modal/distance modes, **not** the actual provider rendering. Mobile widths, modal close/focus restoration, labels, button clipping, signer tampering/expiry, schema injection, quota/rate failures, exact-ID geometry, field masks and cost scenarios have automated/local checks.

The complete local suite passed 821 tests and the production build/TypeScript checks passed. Offline browser checks covered 320/390-pixel mobile and 1440-pixel desktop layouts, BG/EN labels, centre-versus-permitted-location badge labels, opening/closing the contact modal and returning focus to its trigger. Screenshot evidence in this directory is named `google-card-demo-desktop.png`, `google-card-demo-mobile.png` and `google-card-contact-demo.png`. These are labelled demos, not live Google screenshots. The production-build demo endpoints and the disabled grant endpoint returned 404.

Before activation, a separately authorised bounded live test is still required for real native rendering, actual Google events, attribution, photo-less/error states, contact availability and Safari/mobile layout. The provider fixes the native name/type/rating order; merely reordering declarative children does not override it. This proposal does not claim that a generic website accepts appointments, that all Google businesses have contacts, or that a completed outbound click is a completed booking.

The current UI Kit API exposes only ID/location/viewport on its public rendered Place object. It does not expose a pre-render phone/website-availability flag for our own orange button. Unknown contacts are handled honestly in the modal, not through private DOM extraction. An exact hide-before-click rule for contact-less businesses needs independently verified contact metadata or a supported provider API; it has not been claimed as solved.

## Sources

- [UI Kit billing per component and Experimental notice](https://developers.google.com/maps/documentation/javascript/places-ui-kit/overview)
- [Google global pricing and billing-account aggregation](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Advanced details/compact components and provider-owned standard order](https://developers.google.com/maps/documentation/javascript/places-ui-kit/advanced-place-details)
- [Documented compact `.place` data and rendered list IDs](https://developers.google.com/maps/documentation/javascript/reference/places-widget)
- [Native links and their predefined labels](https://developers.google.com/maps/documentation/javascript/reference/place-widget-child-elements)
- [Supported theme/attribution requirements](https://developers.google.com/maps/documentation/javascript/places-ui-kit/custom-styling)
- [EEA Maps service terms](https://cloud.google.com/terms/maps-platform/eea/maps-service-terms)
- [Wikidata structured-data licensing](https://www.wikidata.org/wiki/Wikidata:Licensing)
