# GoRez AI Search — implementation and activation guide

Prepared **26 October 2026**, updated **27 October**, branch `codex/ai-business-search`. An isolated, authenticated **test Preview** is deployed with a separate Free Supabase staging project; the complete fifteen-migration schema is applied **only in staging**. BG/EN rules-based discovery and empty-staging behavior were checked live; no live discovery token exchange/Places/model request or booking has been performed. The owner completed the initial billing/Maps API/browser-key setup. An exact Preview-only WIF provider/binding and identity APIs are configured, but live Google authentication remains unverified. External providers stay **off**, with zero Preview Google/AI quotas. Production is unchanged. See [the detailed activation record](google-wif-vercel.md). The weekly-channel preparation below is local until separately deployed.

## Status and important EEA decision

The owner confirmed **Bulgaria / EEA billing**. A general business-discovery catalogue is not one of the enumerated REST Places permitted uses. Changing a flag is not legal authorization. The full-content REST adapter is therefore **disabled for EEA accounts**, even if its enable/approval flags are set.

The implemented EEA path is:

1. Parse and validate the service/location request.
2. Search GoRez-owned published businesses and optionally verify actual appointments.
3. Make a server-side **Places API (New) IDs-only** Text Search. With authorized geolocation, request only IDs **and coordinates** to enforce the radius; use Nearby for an appropriate exact location/type query.
4. Remove IDs already linked to an included GoRez business by an administrator.
5. Render external names, addresses, ratings and Google Maps actions **inside Google's Advanced Place List UI Kit**. No provider names/ratings are copied into GoRez database records or extracted into a custom catalogue.

Latitude/longitude and Place IDs are exceptions to the EEA content restrictions. UI Kit is excepted from the REST “permitted uses” and map restrictions. This is an engineering interpretation, **not a legal opinion**; review the applicable agreement before enabling. See [binding EEA service-specific terms §15–16](https://cloud.google.com/terms/maps-platform/eea/maps-service-terms), [EEA permitted uses](https://cloud.google.com/terms/maps-platform/eea-places-api-permitted-uses), and [EEA integration guide](https://developers.google.com/maps/comms/eea/places).

The list uses `gmp-advanced-place-list`. Google's **22 October 2026 / 3.66.11a release notes** announce GA for Advanced Place List on the **weekly** channel; the loader now requests `weekly` rather than beta. Some reference pages still mention beta, so the dated release record was checked explicitly. Live rendering, account eligibility, event behavior and referrer restrictions remain unverified without approved credentials. Do not call this live production-ready until the activation checklist below passes. [Release notes](https://developers.google.com/maps/documentation/javascript/releases), [Advanced Place List documentation](https://developers.google.com/maps/documentation/javascript/places-ui-kit/advanced-place-list).

## Repository audit / preserved architecture

- Next.js 16.4.1 App Router, React 19.3, JS, existing global CSS variables and #173e2a brand.
- Supabase Auth and existing server-only service client; active, platform-enabled businesses only.
- Existing `businesses`, `services`, `staff`, `working_hours` and staff-service associations; no alternate booking data store.
- Real availability: `getPublicBusiness` + `getAvailableSlots`; no appointment/customer data is exposed by search. No availability cache. Existing booking submission rechecks the slot and database collision protection remains unchanged.
- Existing Bulgarian city/EKATTE and neighbourhood catalogue reused. No paid geocoding/autocomplete dependency.
- Existing distributed IP-hash rate limiter reused. New aggregate budget RPC serializes daily/monthly reservations across serverless instances.
- No existing paid AI provider was found: the existing guided booking assistant is rule-based. Added a **new optional, off-by-default OpenAI adapter**, not a silently activated provider replacement.
- Existing client/owner/admin auth, five-step onboarding/admin approval, email-only reminders, review queue, pricing/trial and billing logic are unchanged. Central pricing remains 30 days / `19,99 €`; no new charge to end users.
- Owner follow-up on 26 October removes the quoted public subscription amount in BG/EN, including metadata/share-image copy, replacing it with direct discussion of subscription terms. The internal reference price, trial and explicit paid-consent requirement remain unchanged. This is a presentation change, not a claim that the platform is non-commercial or eligible for Vercel Hobby. See `docs/subscription-display-2026-10-26.md`.
- Two new runtime dependencies: official `google-auth-library` **10.9.1** and `@vercel/oidc` **4.0.3**, pinned with their lockfile. Both support Node >=20.9 (google-auth-library 11.x requires Node >=22). No framework migration, Sites app or production database changes.

## User journey

`/search?lang=bg` (or `en`) is the new search page. When `DISCOVERY_ENABLED=true`, the homepage has a prominent conversational finder, while the existing manual `/businesses` directory remains available. Disabling the flag restores the original home finder and returns 404 for the new search page/API. Existing booking URLs continue to work.

Requests happen on **explicit submit**, never on typing. Input hints are debounced locally. Search text/precise coordinates are not written into URLs, cookies, persistent browser storage, analytics or search logs. Navigation from the home finder uses in-memory state, cleared after use/reload.

City, neighbourhood, category and radius controls are available. Radius is enabled only with geolocation, rather than pretending to measure a radius from an unknown city centre. Location permission is requested only after “Около мен”; failure offers manual city selection. Browser coordinates are validated and confined to the Bulgarian operating region's bounding box; this is not a cadastral/border check. Selecting a city clears geolocation. No location is collected on page load.

One concise question is returned for an unknown service/location, conflicting categories, invalid date/time or a time request without a date. Dates use Europe/Sofia and a 90-day interpretation horizon; individual business booking windows still apply. “After work” means after 17:00 and that assumption is shown. Time bounds refer to appointment **start** times.

Internal cards have actual matching services, price/currency, duration, opening hours and an existing booking-page link. Unknown prices are not treated as within a requested budget. Only checked slots are labelled verified; this is not a hold/reservation. A date-specific search checks at most **four businesses × two relevant services**; remaining businesses/services stay explicitly unverified. Booking runs the existing final availability check again.

External businesses cannot be booked in GoRez, have unknown appointment availability, and are clearly separated. The EEA widget retains its own Google attribution, content and “open-map” action. Applications via “Собственик си?” use the existing onboarding flow and do not grant Google-listing ownership or automatic GoRez publication.

## Backend / ranking / retention

- `POST /api/public/discovery`: same-origin public search, strict Zod schema, streaming 4 KB / 3-second body bound, existing distributed per-IP rate limit, no-store responses, safe error codes.
- `PUT /api/admin/businesses/:id/discovery`: existing verified platform-admin auth required, rate-limited. `{ "placeId": "...", "identityChecked": true }` records a reviewed association; `placeId: null` removes it. It does **not** perform ownership verification. Only use after checking independent owner/address/website evidence. Ordinary business owners cannot claim arbitrary IDs. Unique Place IDs prevent cross-business takeover. There is not yet an admin UI for this maintenance endpoint.
- New migration `20261026160000_discovery_budgets.sql` is tested and **applied only in the isolated staging project**, not Production. Private RLS tables: `discovery_usage_buckets`, `business_place_links`. Only service role can read/write them or call `claim_discovery_budget`.
- Provider calls reserve count and conservative gross cost **before** fetching. Advisory transaction lock + row locks make daily/monthly increments atomic. Failed/time-out calls stay reserved. Counters fail closed on missing migration/DB errors, bad limits or exhaustion. No in-memory production fallback.
- Budget periods are UTC day/month, not a simulation of Google's billing/free-cap calendar. Aggregate rows older than 90 days are removed on subsequent reservations. No customer identifier, prompt or provider content is stored in these counters.
- Fetch endpoints/field masks/types/models are server-defined. Five-second provider deadline includes the streamed response body, response-size caps, no redirects, **no automatic retries**. All Google responses are transient; no server/CDN/PWA content cache, prefetch, import, photo/review copying or outbound business solicitation.
- Optional server service-account OAuth uses the official SDK for signing and expiry refresh, plus a bounded three-second / 16 KB token transport without redirects or retries. Text/IDs, Nearby and Details use separate method-specific Places scopes; concurrent refreshes are deduplicated. Tokens are cached only in a warm server process, never persisted or returned to clients. Credential rotation clears the current client's cache. OAuth is attempted only after the search budget is granted, never on typing or a rejected/rate-limited request.
- Keyless Vercel `vercel-oidc` is now an alternative to JSON keys: exact immutable team/project/environment trust, fixed bounded STS + IAM exchange, 15-minute method-scoped tokens and no CLI/ADC/key fallback. The key-creation policy stays enabled. The owner-approved Preview trust and Vercel configuration are now saved; actual token exchange and live authentication remain unverified. See [the WIF activation record/runbook](google-wif-vercel.md).
- Matching never uses names alone. Only reviewed Place IDs remove duplicates. If the association read fails, the UI reports it rather than silently inferring a partnership.
- Rank v1: service fit 50, distance 0–20 when known, matching internal neighbourhood 10, verified availability 8, completeness 4, booking convenience 2. No cross-source star-score comparisons, payment/promotion influence, guessed distance or invented rating. Internal filtering is exact/service-aware; external provider relevance is not advertised as independently verified. The EEA widget is shown separately in provider result order, **not falsely described as a blended GoRez ranking**. No search map is instantiated, so there is no incompatible third-party map or extra Dynamic Maps load.

## Optional AI interpretation

The rule-based parser handles the provided BG/EN examples, known service synonyms, Bulgarian cities/neighbourhoods, relative dates/weekdays, numeric dates/times and explicit EUR/BGN ceilings without a model call. `interpretation: rules` is shown honestly.

When explicitly enabled, configured and budget-authorized, the model is called only for unresolved category/semantic interpretation, not for an obvious missing city/date or conflicting known categories. Uses **OpenAI Responses API**, `gpt-5.6-luna`, `store:false`, `reasoning.effort:none`, strict JSON Schema, 700 output tokens, no tools/search and no Google payloads. Server Zod validation remains authoritative. UI choices and deterministic date/time/budget are not overridden by model guesses; cities must be grounded in the user's text. Invalid/refused/incomplete/model-error responses fall back to one clarification. Contact-looking input bypasses the optional model, but arbitrary free text can still contain sensitive information: warn users and review processor/retention arrangements before activation.

The adapter is contract-tested with synthetic responses, **not verified against a live model/account**. Provider retention and geographic processing are not promised by `store:false`; check account terms and the current [Structured Outputs documentation](https://developers.openai.com/api/docs/guides/structured-outputs).

## Environment variables

All defaults and comments are in `.env.example`. No secrets are committed.

| Variable | Default / purpose |
| --- | --- |
| `DISCOVERY_ENABLED` | `false`; new page/API/home finder gate |
| `DISCOVERY_DEV_MOCK` | `false`; fictional offline fixture, development only; ignored in production AND Vercel Preview |
| `DISCOVERY_MAX_RESULTS` | `12`, valid 1–15; total GoRez + external cards capped |
| `DISCOVERY_REQUESTS_PER_MINUTE` | `8` per hashed IP, max 30; zero disables attempts |
| `GOOGLE_PLACES_AUTH_MODE` | Explicit `vercel-oidc` selected in `.env.example` for keyless Vercel; `oauth` remains a separately approved JSON-key alternative. `api-key` is the backwards-compatible default only when unset. Invalid modes fail closed; no cross-mode fallback |
| `GOOGLE_PLACES_PROJECT_ID` | Exact Google **project ID**, not display name or project number; used as the fixed quota/billing project for OAuth |
| `GOOGLE_WIF_PROJECT_NUMBER` | Numeric Cloud project number containing the WIF pool |
| `GOOGLE_WIF_POOL_ID` / `GOOGLE_WIF_PROVIDER_ID` | Approved environment-specific pool/provider IDs; no arbitrary credential URL |
| `GOOGLE_WIF_SERVICE_ACCOUNT_EMAIL` | Dedicated account in the configured project; impersonated without a key |
| `GOOGLE_WIF_VERCEL_TEAM_SLUG` / `GOOGLE_WIF_VERCEL_TEAM_ID` | Team issuer/audience slug plus immutable `team_…` ID |
| `GOOGLE_WIF_VERCEL_PROJECT_ID` | Immutable `prj_…` ID, not just the project name |
| `GOOGLE_WIF_VERCEL_ENVIRONMENT` | Explicit `development`, `preview` or `production`; must match actual environment and Google trust |
| `GOOGLE_PLACES_SERVICE_ACCOUNT_JSON` | Server-only Google-issued service-account JSON for that project; never `NEXT_PUBLIC_`, a browser prop, a committed file or a chat attachment |
| `GOOGLE_PLACES_API_KEY` | Legacy server-only, IP/API-restricted Places key for explicitly selected `api-key` mode. Ignored in both OAuth modes |
| `GOOGLE_MAPS_BROWSER_KEY` | Separate referrer/API-restricted UI Kit key; intentionally public when a widget grant is issued |
| `GOOGLE_PLACES_UI_KIT_ENABLED` | `false`; EEA ID search + native attributed widget |
| `GOOGLE_PLACES_UI_KIT_APPROVED` | `false`; owner/configuration approval gate, not a substitute for contractual review |
| `GOOGLE_PLACES_BILLING_REGION` | `EEA` for GoRez; full-content REST remains blocked |
| `DISCOVERY_GOOGLE_DAILY_LIMIT` | `40` provider reservations across all methods |
| `DISCOVERY_GOOGLE_MONTHLY_LIMIT` | `500` across all methods, not 500 end-user searches |
| `DISCOVERY_GOOGLE_MONTHLY_MICROUSD` | `20000000` = US$20 conservative gross reservation ceiling, max $30 |
| `GOOGLE_PLACES_ENABLED` / `GOOGLE_PLACES_REST_USE_APPROVED` | `false`; optional full-content REST only for a separately reviewed `NON_EEA` account; not appropriate to enable for the confirmed Bulgarian account |
| `GOOGLE_PLACES_DETAILS_ENABLED` | `false`; optional REST enrichment helper, no automatic/UI endpoint calls; leave off for EEA |
| `DISCOVERY_AI_ENABLED` | `false`; optional new processor, requires separate approval |
| `OPENAI_API_KEY` | Server-only project key for the optional model |
| `DISCOVERY_AI_DAILY_LIMIT` / `DISCOVERY_AI_MONTHLY_LIMIT` | `15` / `100` model reservations |
| `DISCOVERY_AI_MONTHLY_MICROUSD` | `1000000` = US$1 gross reservation ceiling, max $3 |

The fixed model/cost envelope must be reviewed before changing the model in code. Invalid quota values close the budget, never expand it. Use separate Google projects/keys and Supabase environments for development, preview and production; Vercel environments are independently metered and are **not** automatically separate provider billing accounts.

## Google Cloud setup — owner actions / live verification pending

1. Confirm the applicable Bulgarian/EEA agreement and UI Kit account eligibility. The current weekly channel includes the GA advanced components. Do not enable a copied custom REST catalogue for this use.
2. Create a dedicated Cloud project and explicitly approve linking billing. Free usage still requires a billing-enabled project; it is not an unlimited/free-cost guarantee.
3. Enable **Places API (New)** for IDs-only server search and **Maps JavaScript API / Places UI Kit** as directed by Google's current [setup guide](https://developers.google.com/maps/documentation/javascript/places-ui-kit/get-started). No legacy Places, geocoding, routes, messaging or paid maps are needed by this implementation.
4. For the chosen **keyless Vercel WIF** path, keep the dedicated service account, its narrow project permission and the key-creation policy; configure the exact preview identity using [the WIF runbook](google-wif-vercel.md). No JSON key, static-IP add-on, unrestricted server key, user Google login or OAuth consent screen is required. The legacy API-key alternative needs stable outbound IP/API restrictions; ordinary serverless egress must not be guessed or replaced with browser referrer restrictions.
5. Create a **different** browser key for UI Kit, with exact HTTP referrer restrictions for `https://www.gorez.co/*` and any explicitly approved apex/test origins, and only the APIs required by UI Kit. Do not allow all `*.vercel.app` hosts. Local testing must use a separate key/project restricted to the local origin.
6. Set low provider quotas where the project supports them, alerting, key-usage monitoring and a tested kill switch. Review [security guidance](https://developers.google.com/maps/api-security-best-practices) and [Maps JS quotas/billing](https://developers.google.com/maps/documentation/javascript/usage-and-billing).
7. **Important browser limitation:** the server's counters gate normal widget issuance but cannot make a public browser key un-replayable. A referrer restriction is not a cryptographic budget boundary. Google quota controls are primarily QPM; do not assume a custom daily/monthly hard cap exists. Confirm the actual controls available to this account and test abuse handling/disablement. If a hard monetary ceiling is mandatory, **do not enable the browser widget** until a supported provider-side cap or appropriately approved risk/architecture is in place. Billing alerts alone do not stop spend.
8. Save credentials privately in the selected host's protected server environment, with production/preview scopes separated. Never send keys, JSON files, screenshots of keys, service-role credentials or access tokens in chat. Keep all enable/approval flags false during setup. A hosting purchase/migration or production deployment is not authorized by this local OAuth implementation.

The browser loader does not run on initial page load or typing. After one explicitly submitted, budget-approved search, it loads the required places library and instantiates one list, without a map, media, review text or secondary details element. It preserves attribution and avoids re-instantiation when merely switching result-source filters. UI Kit can make its own underlying calls; its charges are separate from the server's ID search.

### Server OAuth: dedicated service account

1. Open [IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts). Verify the actual project ID, billing link and intended environment, not just a display name such as GoRez or My First Project. Names may be changed without changing the project identity.
2. Choose **Create service account**, name/ID `gorez-discovery`, then **Create and continue**. For project access choose **Service Usage Consumer** (`roles/serviceusage.serviceUsageConsumer`), not Owner, Editor, Billing Admin or Service Account Token Creator. Leave the optional “principals with access” step empty and finish. This predefined role supplies `serviceusage.services.use`, required to charge the explicitly selected quota project; it also includes some read permissions. Do not grant the public or end-user accounts access to this service account.
3. **The owner's key creation is blocked by inherited policy. Use the implemented keyless Vercel WIF adapter and [its runbook](google-wif-vercel.md); do not weaken the policy or continue to the JSON-key step.** Cloud configuration and staging deployment still require approval. The JSON alternative below is retained only for a separately approved host/account, not required for Vercel WIF.
4. For an approved JSON-key pilot, open that service account → **Keys → Add key → Create new key → JSON** on a trusted computer. Store the downloaded file securely outside the repository/cloud-shared folders; it grants server authority. Do **not** upload it here, send its content in chat or enable domain-wide delegation. Set `GOOGLE_PLACES_PROJECT_ID` and the full Google-issued JSON as `GOOGLE_PLACES_SERVICE_ACCOUNT_JSON` in the host's server-only secret UI, and set `GOOGLE_PLACES_AUTH_MODE=oauth`. In local `.env.local`, a single-quoted compact JSON value with JSON-escaped `\n` in `private_key` works; keep the file ignored and private. Do not create a `NEXT_PUBLIC_` version. Leave `GOOGLE_PLACES_API_KEY` empty.
5. Keep the existing browser key restricted to **Websites** (`https://www.gorez.co/*`, `https://gorez.co/*`) and **Maps JavaScript API + Places UI Kit**. This key is not the service-account credential and is never used for server Text/Nearby requests. Local/preview origins require their own approved restricted key/project.
6. On the approved staging environment only, check one manual-city search and one consented location search; verify Google usage, the intended project, attribution, error/kill-switch behavior and absence of server credentials in responses/browser bundles. Apply the existing discovery-budget migration only with explicit approval first. Production discovery stays off until these live checks and deployment approval pass.

The adapter accepts only service-account JSON matching the configured project and standard Google universe. Key metadata may contain either official Google token URI (`https://oauth2.googleapis.com/token` or the documented legacy `https://accounts.google.com/o/oauth2/token`), but the actual exchange always uses the first fixed endpoint without redirects. Other token URIs/universes are rejected; extra delegation/claim fields are ignored. It never discovers a local developer login, reads an arbitrary credential path, or accepts client-supplied billing configuration. `X-Goog-User-Project` is set server-side to the validated project. Method scopes are `maps-platform.places.textsearch`, `.nearbysearch` and `.details`, not the broad `cloud-platform` scope. OAuth changes authentication only: **EEA rendering restrictions, Places charges, provider quotas and browser-key abuse risk remain**.

Treat the JSON private key as a high-value long-lived secret. Code-level narrow scopes are not an IAM/key restriction: anyone who steals the private key could mint other scopes for permissions/services available to that account. Keep the project dedicated, disable unused APIs, restrict hosting access, rotate/revoke keys on exposure, remove old keys after a verified rotation and monitor usage. Deployment environments must not share an unrestricted service account. Tokens are not refreshed/retried after a failed Places request; the next authorized request uses the SDK's normal expiry policy.

References: [Google service-account OAuth flow](https://developers.google.com/identity/protocols/oauth2/service-account), [quota project permission](https://docs.cloud.google.com/docs/quotas/set-quota-project), [Service Usage roles](https://docs.cloud.google.com/service-usage/docs/access-control), [Text Search scopes](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchText), [Nearby scopes](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchNearby).

## Costs: actual implemented fields and conservative ceilings

Prices rechecked 27 October 2026 from the [official global pricing table](https://developers.google.com/maps/billing-and-pricing/pricing). USD, account-wide free caps may be shared by other projects; currency conversion, account terms and other infrastructure costs are separate. Recheck before activation.

| Path / actual fields | Billed SKU | Published monthly free events | First paid tier / 1,000 |
| --- | --- | --- | --- |
| EEA Text: `places.id` only | Text Search Essentials IDs Only | Unlimited | $0 |
| EEA geolocated Text: `places.id,places.location` | Text Search Pro | 5,000 | $32 |
| EEA Nearby: `places.id,places.location` | Nearby Search Pro (Nearby has no IDs-only free tier) | 5,000 | $32 |
| EEA `gmp-advanced-place-list`, name/address/rating/open-map, no media/reviews/details/map | Places UI Kit Pro | 5,000 | $5 |
| Optional non-EEA Text Pro: ID, display name, address, location, primary type, Maps URI, business status, attributions | Text Search Pro | 5,000 | $32 |
| Optional non-EEA Nearby, same mask | Nearby Search Pro | 5,000 | $32 |
| Optional non-EEA Details: ID, website, national phone, attributions | Place Details Enterprise | 1,000 | $20 |

Requesting ratings/hours/phone/website on standard **search** would raise its tier; those fields are absent from the REST search mask. Details are never automatically fetched. [Text Search fields](https://developers.google.com/maps/documentation/places/web-service/text-search), [Nearby fields](https://developers.google.com/maps/documentation/places/web-service/nearby-search), [UI Kit billing](https://developers.google.com/maps/documentation/javascript/places-ui-kit/overview).

For the EEA default of **500 combined Google reservations/month**, an external search normally reserves twice: once for ID search and once for the list. That permits approximately **250 complete external searches/month**, subject to daily limits and failures. With unused applicable free caps, the indicated Google charges may be **$0**. Ignoring all free caps: 250 city/text-ID + list searches are approximately **$1.25**; 250 geolocated Text/Nearby + list searches approximately **$9.25**. No additional dynamic map or details charge is intended. This excludes malicious/replayed direct browser requests described above.

Optional model pricing: current fixed GPT-5.6 Luna is $0.20/M input and $1.20/M output tokens. An illustration of 1,000 input + 300 output tokens is about **$0.00056/call**; max 700 output tokens is bounded in code. Reservations use a conservative **$0.003/call**; default 100 calls/month reserve at most $0.30, below the independent $1 ceiling. Common supported requests cost no model tokens. [Model specification/pricing](https://developers.openai.com/api/docs/models/gpt-5.6-luna).

These settings aim to keep **ordinary low-volume incremental usage well under approximately €30/month**, not guarantee a bill. Existing Supabase/Vercel/Resend subscriptions, taxes, currency conversion, retries outside this app and shared-account usage are not covered by that target.

### Owner-approved bounded Google Preview test — not activated

On 27 October the owner explicitly approved **up to five manually submitted city searches, at most five results each**, only on the authenticated feature-branch Preview. No geolocation, map, model, messaging or Production activation is included. At 15:44 Europe/Sofia the owner created the separate `GoRez Preview Discovery` browser key; its exact Preview-only website and two-API restrictions were independently read back in Cloud. It has not yet been copied into Vercel; no live discovery Google request has been made.

1. Read back enabled APIs, current usage and available quota controls in Cloud project `project-59dcbfba-7808-4a88-99b`. Do not alter shared project quotas or the existing website key without separate authorization. Do not infer a usable daily cap from a QPM field.
2. Prepare a new browser key named `GoRez Preview Discovery`, restricted to **Maps JavaScript API + Places UI Kit** and **only** the website referrer `https://ai-receptionist-git-codex-ai-business-search-ai-receptionist12.vercel.app/*`. No wildcard Vercel domain, localhost, Production origin, server REST API or broader permission. The owner must personally complete key creation; never send the value in chat, screenshots or files. Privately transfer that existing key only to `GOOGLE_MAPS_BROWSER_KEY` in Vercel **Preview → codex/ai-business-search**, not all Preview branches or Production.
3. For that branch alone, proposed limits are `DISCOVERY_MAX_RESULTS=5`, `DISCOVERY_GOOGLE_DAILY_LIMIT=10`, `DISCOVERY_GOOGLE_MONTHLY_LIMIT=10` and `DISCOVERY_GOOGLE_MONTHLY_MICROUSD=1000000`. Enable the two UI Kit flags only after the credential/control checks. Leave full-content REST, Details, AI, mock and email flags false; AI count limits remain zero. The ten shared Google reservations normally allow five ID-search/list pairs; failures/empty results can consume reservations differently, so the operator must still count and stop after five submissions.
4. Deploy only this Preview, verify authentication remains required and the staging URL is unchanged, then perform the bounded manual-city checks. Verify actual WIF auth, native attribution/open-map behavior, realistic external availability disclaimers, result limit and Google usage. Do not automatically retry a failed provider request or expand access to resolve it.
5. After the test (including early failure), set both UI Kit flags false and Google count limits zero, redeploy Preview and verify no further widget grants. Previously issued browser keys cannot be revoked by application counters; hand key disablement/revocation back to the owner. Record the result before considering a separate ongoing-activation decision.

The advanced list uses **Places UI Kit Pro**, not the cheaper basic **UI Kit Query** SKU. Five ordinary city ID-search/list requests would be approximately **US$0.025 before applicable free caps**, assuming one billed advanced-list event per submission. The approved conservative test estimate is **under US$1**, potentially US$0 with unused free caps; SDK fan-out, retries outside this application and abuse are not bounded by that estimate. Server reservations are not provider billing telemetry or an enforceable US$1 bill cap. [Advanced UI Kit SKU definition](https://developers.google.com/maps/billing-and-pricing/sku-details).

Cloud alerts-only budgets do not stop spending. The newly documented spend-cap budgets currently list Gemini/Agent Platform and Cloud Run services, **not Maps/Places**; do not claim that enabling one protects this widget. No billing alert, spend-cap setting, key, provider quota or live integration has been changed by this preparation. [Alerts-only budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets), [eligible spend-cap services](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps).

Earlier read-only Cloud checks on 27 October confirmed the intended project, enabled Preview pool/provider, and the original browser key with HTTP-referrer/two-API restrictions; its value was not revealed. After owner creation of the separate test key, Cloud read-back confirmed **Maps JavaScript API + Places UI Kit**, Websites, and exactly the approved feature-branch Preview referrer. The API dashboard also showed Places API (New), Maps JavaScript API, Places UI Kit and the identity APIs enabled. The last-day traffic chart reported no data and request columns were dashes, not a verified zero-cost billing report. Quota read-back/key transfer/live testing remain pending because Safari changed active tabs/interrupted control. No Cloud mutation was performed by the agent. The weekly loader patch passed all 312 tests and `next build` locally, but has not been pushed/deployed.

## Testing locally / on Vercel

Use the repository's Node runtime (Node >=20.9) and install the updated lockfile with `pnpm install --frozen-lockfile`. The repository has no separate lint/typecheck script; it is a JS app. `next build` runs its framework checks. The lockfile includes both official auth dependencies; no global Google Cloud CLI is needed for offline tests/builds. WIF owner setup and optional live development are covered separately in its runbook.

```sh
npm test
npm run build
# Offline fictional fixture, no Supabase/Google/OpenAI credentials required:
DISCOVERY_ENABLED=true DISCOVERY_DEV_MOCK=true npm run dev -- --hostname 127.0.0.1 --port 3005
```

Open `http://127.0.0.1:3005/dev/discovery?lang=bg` (or `en`). Every fixture is labelled fictional and internal booking is disabled. The fixture uses synthetic provider responses, **not the real EEA UI Kit**. `/search` exercises the real endpoint; without a Supabase configuration it returns a safe unavailable state, not mock businesses. `/dev/discovery` and `/dev/discovery/search` are 404 in a production build even if someone sets the mock flag.

The owner-approved isolated staging schema and branch-specific Preview credentials are now installed, and the branch is pushed/deployed for internal-only testing. Production flags remain unchanged. Vercel Preview does not permit mock fixtures. Live provider activation still needs the bounded test approval below; no prior Preview deployment approval authorizes paid provider calls. Only enable approved provider flags in the intended environment, then check:

- Bulgarian/English interpretation, denied location fallback, neighbourhood and radius.
- One/zero/several internal businesses and a genuinely empty category.
- Live UI Kit loads exactly one native list, Google attribution/open-map actions, no duplicate verified IDs and <= configured total results.
- Server JSON/private keys/access tokens not in client bundles or responses; OAuth uses the expected project and fails safely on invalid/expired/revoked credentials; browser key API/referrer restrictions actually reject other sites.
- Global day/month budgets persist between instances; missing migration and quota failure stop external issuance.
- Calendar changes, breaks, time off, suspended businesses and concurrent bookings do not create false available slots or bypass final booking protection.
- No automatic claim, SMS/other paid messaging, email-setting, billing or subscription changes.
- Google account usage/QPM, alerts and disablement work; document the browser-key cost risk and owner decision before enabling.

## Verification completed / remaining limits

Verification including keyless Vercel WIF, OAuth/key-metadata and public subscription-copy follow-ups: **306 tests passed, 0 failed** (72 discovery tests, including 14 JSON OAuth and 21 WIF tests), production `next build` passed, and `git diff --check` passed. There is no separate lint/typecheck script. The existing unrelated Node module-type warning remains non-failing; no global module-system change was made.

Automated tests include schema/PII boundaries, BG/EN examples and categories, missing/ambiguous/invalid location, time and budget parsing, 0/1/several real-shaped internal rows, provider failures/timeout/size limits, absent keys, exhaustion, ID dedupe, optional model errors/grounding, bounded live-availability checks and cross-site requests. Isolated PGlite executes the new SQL: idempotency, preservation, atomic limits, parallel reservations, private permissions/RLS, and uniqueness.

OAuth tests use an ephemeral synthetic RSA key generated only in test memory and mocked HTTP: SDK assertion signature/scope/audience, no user delegation, exact quota project, token reuse/concurrent refresh, expiry and key rotation, both official key-metadata token URIs with one fixed actual endpoint, bad JSON/project/endpoint/universe, malformed/refused/oversized token responses, header/body deadlines, no retries/key fallback, budget/auth/input gates and preservation of internal businesses. No test needs a Cloud account or makes a Google request. A production client-bundle scan found no server auth SDK, OAuth scope or service-account configuration references.

Local production-server smoke checks also passed: disabled search page/API return 404, existing home finder remains present, admin link mutation returns 401 without a login, and both mock routes remain 404 even with `DISCOVERY_DEV_MOCK=true`. With real search enabled but no Supabase credentials, the page renders and the API fails safely with 503, without mock results or provider calls. Temporary local QA servers were stopped afterward.

After adding OAuth, a fresh local production-server check repeated home 200, disabled search/API 404 and both dev fixture routes 404 with the mock flag deliberately true. The temporary server was stopped. Live OAuth authentication/permissions, token exchange, Places search and UI Kit still require the owner's approved staging credentials and are **not** reported as verified.

After adding keyless WIF, the production-server smoke check repeated those results (27 October): home 200; disabled search page/API and both dev fixture routes 404. A fresh scan of all 53 production browser JavaScript chunks found no WIF configuration names, OIDC token reference, server auth SDK or Places OAuth scope. The temporary port-3009 QA server was stopped. Read-only Safari checks established the Vercel team/project IDs and Google project number/billing link; exact values are in the WIF runbook. No provider/IAM setting was changed.

In the subsequent owner-approved setup turn, the Preview WIF provider, exact Workload Identity User binding and four identity APIs were configured, with Google UI success messages and provider/IAM read-back. Eighteen new variables were saved only to Vercel Preview; all feature/provider gates remain false, Production was inspected unchanged and no Redeploy was triggered. Existing Supabase variables are currently shared between Production and Preview; staging isolation must be resolved before enabling discovery or migrating. Existing secrets were neither revealed nor copied. No live token exchange or discovery call was attempted.

Mobile (390 px) and desktop UI were checked in the local fictional fixture, including results, source filtering, auto-interpreted dates, unknown external availability and no horizontal overflow. A missing accessible label on the mobile icon-only submit button was found and fixed during QA.

Completed later on 27 October: **312 tests**, isolated staging schema/credentials, authenticated Ready Preview, live BG/EN rules/clarification/zero-result checks, and local fictional responsive checks at 320/390/1440 px. See the runbook for exact commits, project references and scope. The owner reported restoring Preview Branch Tracking after the browser-control interruption; that restoration is owner-reported, not independently read back.

Not yet verified: paid/live Google or model calls, native UI Kit output/events, enforcement of the read-back staging browser-key restrictions by an actual request, live WIF exchange, or Production discovery/booking changes. The Production database migration and production rollout remain unapproved. Remaining limitations:

- EEA results are a separate Google-rendered list, not arbitrary custom cards or a fully blended rank. No map is included initially; enabling one requires a separate compatible UI Kit/Google Maps design and cost review.
- A public browser SDK cannot provide a cryptographically enforced app-level daily/monthly bill ceiling. Do not activate blindly on the strength of server limits.
- Parser is intentionally bounded: not every arbitrary service, spelling, day range or preference can be understood. Unsupported queries ask for clarification; the optional model is not a general factual recommender.
- Internal search scans at most 100 published matching city/industry profiles; this needs indexed/SQL search pagination as the network grows. Availability is checked only for the bounded top subset. No guessed distances when owner coordinates are missing.
- Budget filtering is exact for published internal service prices/currency only. External prices/availability/preferences remain unknown; do not promise budget or schedule compliance for those places.
- No automatic ownership verification or photo/review import. Admin Place ID association maintenance currently uses the authenticated endpoint, not a new settings screen.
- Provider legal/account conditions and the existing legal-template/operator details still require owner review; privacy/Google terms links were added without claiming a legal compliance certification.

## Changed files

New backend modules: `lib/discovery/{categories,intent,config,http,google-auth-config,google-auth,google-federation,google-places,ai-intent,internal-search,ranking,search,budget,handler,copy,draft,mock}.mjs`.

New UI/routes: `components/{discovery-page,discovery-search,google-discovery-list}.js`, `app/search/page.js`, `app/discovery.css`, `app/api/public/discovery/route.js`, `app/api/admin/businesses/[id]/discovery/route.js`, `app/dev/discovery/page.js`, `app/dev/discovery/search/route.js`.

Existing focused edits: `.env.example`, `package.json`, `pnpm-lock.yaml`, `app/{page,layout}.js`, `app/businesses/page.js`, `components/{home-page,business-search-page,legal-page}.js`, `next.config.mjs`. The home search component is code-split and rendered only when enabled. Original directory/booking/owner onboarding/billing/reminders remain intact.

New migration/tests/docs: `supabase/migrations/20261026160000_discovery_budgets.sql`, `tests/discovery.test.mjs`, `tests/discovery-database.test.mjs`, `tests/discovery-google-auth.test.mjs`, `tests/discovery-google-federation.test.mjs`, this guide and `docs/google-wif-vercel.md`. OAuth/WIF itself needs no additional database migration.

## Required approval boundary

Preview identity, isolated staging schema/credentials and the internal-only Preview deployment were explicitly approved and completed. The bounded five-search Google Preview test above is now approved, and the owner created its restricted browser key. Private transfer of that existing key to the exact branch-specific Preview environment, provider-control checks and live test remain pending; Google is still off. This does not authorize ongoing provider activation, model calls, additional migration, Production deployment or broader access. **Do not expand the test or publish Production merely because WIF trust and staging are configured.**
