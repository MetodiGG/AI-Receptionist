# Verified partner ratings — local implementation

Google ratings can appear on GoRez partner cards and their public booking profiles, including when the partner has no GoRez reviews. **This change has not been enabled or tested against Google in a live environment.** No production settings, records, quotas or migrations were changed.

## Two honest sources

- Google shows its own current stars/count in its native attributed Places UI Kit widget. GoRez does not copy, persist, scrape, recalculate or add to that score/count.
- GoRez's existing verified-visit reviews remain a separate, clearly labelled score and comment list. A rating without a comment still contributes to the GoRez count/average; it does not change Google. A new rating can lower or raise an average depending on its value.
- Compact cards with no GoRez reviews do not show empty stars or an unqualified “no reviews” message that could be mistaken for absence of Google reviews.
- Missing identity verification, Google configuration, quota, network or provider data never creates a fallback numeric rating. Existing bookings and GoRez reviews continue to work.

## Identity and administration

The existing `business_place_links` table is reused; no new schema is needed. Only an authenticated platform admin can read/write a link through `/api/admin/businesses/[id]/discovery`. In Admin → business → Edit → **Google Maps**, enter the exact Place ID, open that Google listing and verify the business, branch and address, then explicitly confirm identity. A name match alone is not sufficient. Place IDs remain unique across partners. Removing a link does not delete GoRez reviews or appointments.

No real partner has been linked or unlinked by this implementation. A business without a Google listing cannot acquire a Google rating through this feature. No owner self-claim, automatic matching, Google review submission or copied review content is implemented.

## Opt-in, security and costs

`GOOGLE_PARTNER_RATINGS_ENABLED=false` is the only new environment variable. It defaults to false. Activation additionally requires the existing `DISCOVERY_ENABLED`, both approved UI Kit gates and the existing referrer/API-restricted `GOOGLE_MAPS_BROWSER_KEY`. Development mock mode blocks real rating grants.

`POST /api/public/[slug]/google-rating` validates same-origin metadata, a bounded slug and a strict 256-byte locale-only body. It resolves the published business and administrator-reviewed link on the server. It accepts no client Place ID, score, credential or billing configuration. Responses are private/no-store. Only the intentionally public, restricted browser key is issued; server credentials never cross the boundary.

Only an actually visible partner requests a grant. Off-screen rail cards do not preload Google ratings. One widget instance requests one grant, uses the shared Maps loader and does not retry automatically. Each grant reserves one `ui_rating` request and US$0.005 gross from the **same existing durable Google daily/monthly count and cost buckets** as discovery. Failed or unused grants can conservatively overcount; no limits are raised. Unauthenticated access is intentional for customers but rate-limited; cross-site requests are rejected. A public browser key and application reservations are not a guaranteed Google billing ceiling.

The [current Google pricing table](https://developers.google.com/maps/billing-and-pricing/pricing#places-api-new) lists Places UI Kit Pro at 5,000 no-cost monthly events, then US$5 per 1,000 in the initial paid tier. The advanced rating-only details widget is a Pro event; omitting photos/review text does not make it free or downgrade it. Those events share the Pro SKU's usage with other advanced widgets and projects in the billing account. One visitor may load several partner widgets in addition to a search/list. Free-cap eligibility and remaining usage have not been checked in the owner's account.

Keep the new flag off until the owner approves deployment/activation and any live metered verification. No new service, paid AI, key, Google quota or budget increase is required by this code.

## EEA display policy

This uses the [documented advanced Place Details content selection](https://developers.google.com/maps/documentation/javascript/places-ui-kit/advanced-place-details#omit_the_place_name): omit the duplicate place name and include `gmp-place-rating`, its place request and `gmp-place-attribution`. Ratings, links, notices and attribution stay inside Google's widget. No shadow-DOM scraping/hiding, extra REST enrichment or combined GoRez/Google aggregate is used. See the [current EEA attribution and Places UI Kit terms](https://cloud.google.com/terms/maps-platform/eea/maps-service-terms).

## Verification

Offline tests cover disabled gates, hostile/malformed input, source identity, missing/suspended partners, rate/budget failures, shared budget accounting, sanitized failures and native widget composition. A real local PostgreSQL-compatible test verifies that an empty-comment GoRez rating contributes to its own count and average. Mock homepage fixtures never make Google requests. Actual native Google rendering and verified real partner scores remain unverified until an approved live test.
