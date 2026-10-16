# Nearby discovery — design only, not enabled

Reviewed 16 October 2026. No Google API or billing activated; no scraping, external business imports, map, automatic outreach or location collection added to production.

## Proposed architecture and journey

1. Customer picks a useful existing category, then explicitly presses “Намери бизнеси около мен / Find businesses near me”. Explain the purpose before the browser location prompt. Request location only on that action, never on page load. Do not put precise coordinates in analytics, URLs or persistent logs.
2. If permission is denied, location unavailable or request times out, offer the existing Bulgarian city selection. City/category discovery of registered GoRez businesses can work independently of a paid external provider.
3. First-party results use only active, platform-enabled GoRez profiles and real availability. Add owner-supplied/verified coordinates later; do not manufacture coordinates from an address string or silently geocode every profile.
4. Optional external search uses a bounded server endpoint and Places API (New) Nearby Search: validated category mapping, radius, result limit and an explicit minimal field mask. Start with IDs, display name, location, formatted address and Google Maps URI; exclude ratings, reviews/photos and enrichment until justified. Field selection can change the billed SKU. [Nearby Search documentation](https://developers.google.com/maps/documentation/places/web-service/nearby-search), [usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing).
5. Show separate sections: “Book with GoRez” (real booking CTA) and “Other nearby businesses” (clearly not GoRez partners, no GoRez slots or booking buttons, compliant provider attribution and external information link). No blended partner count or implied endorsement.
6. Match an external place to a GoRez business only via a verified provider place ID supplied/confirmed by its owner or admin. Name/address similarity is a review suggestion, never an automatic merge. Avoid duplicate cards when a verified match exists.

## API, costs and safety

Require explicit owner approval of Google Cloud billing, API services, credentials, quotas and legal conditions before implementation. Keep a restricted server-side Places key; use API restrictions and supported application restrictions for the deployment architecture. A browser map would require its own referrer-restricted key; do not expose the server key. Rate-limit by abuse-resistant request scope, cap radius/results, prohibit arbitrary field masks/categories and add a server-side daily usage breaker. Billing alerts alone are not a hard spending cap.

Cost drivers: searches per visitor, repeated location/radius/category changes, requested fields, details calls, map loads, photos and retries. Current global pay-as-you-go table lists Nearby Search Pro: 5,000 monthly free billable events, then $32 per 1,000 in the first paid tier; Place Details Pro: 5,000 free, then $17 per 1,000. Under those assumptions, 8,000 Nearby Search Pro requests alone would be approximately $96 before other services, taxes, currency conversion and account-specific terms. This is an illustration, not a GoRez cost forecast. Recheck the table and applicable account terms before enabling. [Official pricing](https://developers.google.com/maps/billing-and-pricing/pricing).

Caching/storage is restricted; do not build a permanent local catalogue of copied Places names, addresses, reviews or photos. Place IDs have a documented storage exception; use that for verified matching, not as permission to retain all provider content. Re-fetch/display other data only as permitted. Provide required Google Maps/third-party attribution and policy links; use a compatible Google map if presenting results on a map. Review the exact current display restrictions for the account/service and implementation. [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies).

The EEA billing-address rules can differ in terms and functionality. For Bulgaria, review the current EEA terms/FAQ and the selected product before designing map/data combinations; do not assume general/global behavior is identical. This requires contractual review, not a compliance claim based on this design. [EEA FAQ](https://developers.google.com/maps/comms/eea/faq).

## Acquisition benefit and rollout

External discovery could reveal gaps by city/category and support voluntary business invitations. Do not scrape provider content into outreach lists or automatically contact external businesses. A business becomes bookable only after actual onboarding, verified services/schedule and publication. Stage rollout behind an off-by-default feature flag, review attribution/mobile/fallback UX, validate quota breakers and meter cost before a small approved test.

Dependencies still needed: owner choices on provider/budget and consent, verified first-party coordinates/place-ID workflow, EEA/retention review, keys, quotas, monitoring and isolated tests. None are prerequisites for the current GoRez booking product.
