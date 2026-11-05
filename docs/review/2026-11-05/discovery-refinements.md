# Discovery refinements — local review

No deployment, production-data change, migration, Google/AI request, new service or higher quota.

## Deduplication

Discovery now reads exact Place-ID associations for **all** requested Google IDs, not only the first eligible internal partners. Only admin-reviewed links to active, published businesses exclude a Google entry. Draft/disabled/private businesses and unverified identities cannot hide an unrelated branch. This works even when the partner does not fit the current service, has no available slot, or falls outside the six internal result cards. Existing eligible partners keep their local/radius gates; deduplication does not promote a far-away partner.

No name-only merge, brand-wide chain exclusion, guessed Place ID, account creation or automatic ownership approval. Businesses without an exact reviewed association still require that association; identical names are not sufficient. Identity-storage failures leave a diagnostic warning rather than inventing a match.

## Rail and performance

- Arrow destinations clamp to the true native scroll maximum; Safari elastic offsets are normalised for button state. The business rail disables horizontal overscroll chaining/rubber-band whitespace where supported.
- ResizeObserver also observes item sizes, including a provider chunk changing after load. Scroll measurements are frame-coalesced and update React only when an arrow's enabled state changes.
- The legacy batched widget's width uses documented **actually rendered** IDs after `gmp-load`, not all originally requested IDs. Invalid/failed/duplicate/unknown IDs do not allocate empty cards. Zero rendered places remove the empty chunk. No shadow tree access or provider content rewrite.
- The optional individual-card variant consists of actual sibling list items, without a count × width Google chunk; it remains OFF pending cost review/live approval.
- The optional native-card bundle is dynamically imported only if that mode is returned. Public partners/FAQ/business-signup/search routes have lightweight streaming loading boundaries; prefetching them cannot mount discovery, request location or spend a provider budget. No root loading boundary was added to change private/dev guard behaviour.
- Public directory focus refresh respects its existing 30-second metadata TTL. Explicit Retry is still forced; auth, availability and booking confirmations are never cached.

No percentage speed-up or complete elimination of network/provider latency is claimed. Real production navigation is affected by connectivity, Google response/render times and cold server work; local development compilation is not a production speed benchmark.

## Rating order — explicit limitation

An authorised raw external row with an actual numeric rating is sorted descending within its proximity band, then by actual review count, before the existing convenience/distance tie breaks. Unknown/invalid ratings sort last. Partner eligibility and near-before-far remain hard gates, and no ratings are altered or combined.

**This is not active rating sorting for the Bulgarian EEA Google UI Kit path.** That path receives only IDs/allowed geometry, and the widget's documented public Place output does not expose rating. Google's supported search preferences are distance/popularity or distance/relevance, not numeric-rating descending. No native DOM scraping, extra rating field mask, false “highest rated” label, or switch to prohibited/unapproved REST use was introduced. Exact Google-rating order remains unresolved without an authorised supported source/design. See [widget API](https://developers.google.com/maps/documentation/javascript/reference/places-widget), [search preferences](https://developers.google.com/maps/documentation/javascript/reference/place), and [EEA terms](https://cloud.google.com/terms/maps-platform/eea/maps-service-terms).

## Laboratories in Other service

“Друга услуга” opens compact laboratory shortcuts, including Genica, Synevo, Cibalab and Ramus. Selecting one fills the search field and uses the existing discovery flow with the supported `medical_lab` Google type. Brands are query aliases, not fabricated results or partnership claims. No new industry enum/migration or unreviewed public directory records.

Generic/brand lab queries resolve deterministically in both current and fallback search modes, bypass paid AI and reduce provider query text to the service + explicitly requested brand + public city/quarter. Explicit category choices and multi-category ambiguity remain authoritative. They do not forward symptom narratives, patient identifiers or test results. Internal slots still require real active service evidence and use the existing availability/confirmation path. A business's name alone is not evidence of bookable laboratory services.

External labs use the same verified-booking-link / actual-contact modal workflow as other Google businesses. **No Genica, Synevo, Cibalab or Ramus calendar has been synchronised or approved in the database.** Booking availability remains unknown until the laboratory confirms it. Researching a chain website is not proof that every branch/test takes appointments. For example, [Genica's own FAQ](https://www.genica.bg/) limits its advertised time booking to particular services, and [Cibalab](https://cibalab.com/) distinguishes appointment and home-visit flows. No medical questionnaire or clinical-results storage was added.

## Local verification

- Automated suite: 821 tests passed, no failures; production build and TypeScript checks passed. This includes regression cases for matching every returned Google ID against public partners, unverified/different-branch identities, rating comparison on the authorised raw-row path, all four laboratory aliases in both parser modes, clinical-text minimisation, actual service evidence and bounded scroll targets.
- Offline `/dev/homepage?lang=bg`: “Друга услуга” opened the five laboratory shortcuts. Genica, Synevo and the generic laboratory choice populated the field and completed the fixture search. These are explicitly labelled fictional results, not proof of real laboratory inventory.
- At a 1440-pixel viewport, intentional right scrolling expanded the further fixture group, then stopped at `scrollLeft = 696`, exactly `scrollWidth - clientWidth = 696`; the Next button was disabled. No page-wide horizontal overflow. At 390 pixels the page width remained 390 pixels, with no browser-console errors.
- Evidence: `laboratories-rail-demo-desktop.png`, `laboratories-demo-mobile.png` in this review directory. Temporary viewport overrides were reset. No real location permission or Google/AI search was used.
- Production-build checks returned 404 for the development demo routes and disabled individual-card grant endpoint. Public FAQ/partners pages returned 200. Navigation loading states are a responsiveness improvement, not a measured claim of faster production Google requests.

## Supabase warning (read-only check)

The user's warning names test project `gorez-staging`. On 2026-11-05, a read-only check of the public `/api/public/businesses` returned HTTP 200 and three published businesses. The current public account bundle referenced production host `ilpdtvbymxqgimrboyvh.supabase.co`, not staging host `dbvsfxkmljrwjberwodb.supabase.co`. No keys or credentials were printed, copied or changed. This supports that the warning is about the separate test environment, not a current public-site outage; it does not verify the server's private env or guarantee the future status of a free production database.

[Supabase pauses low-activity Free projects](https://supabase.com/docs/guides/platform/free-project-pausing); restore the staging project in its dashboard when it is needed. No billing upgrade, keep-alive automation or database change was performed.
