# Search Engine 2.0 — implementation and evidence, 30 October 2026

Status: **local implementation, not deployed**. The full requested audit is
**not complete**: live provider relevance and independent candidate judgments
remain blocked/pending. No claim that 172 full scenarios passed. No new
credentials, subscriptions, migrations, Google quotas, emails or reservations.

## Architecture / sources of truth

- Next.js 16.4.1 App Router, React 19, existing CSS/Solar design, Supabase.
  Inspected local Next client-component/CSS guidance before implementation.
- `lib/discovery/categories.mjs`: 14 existing IDs and public BG/EN names.
  Business industries remain `lib/public-locale.mjs`; service/description data
  comes from active public businesses/services, not invented search results.
- `lib/business-location.mjs`: existing Bulgarian settlement/neighborhood list.
- `components/discovery-search.js`: one shared home/search form, explicit submit,
  category shortcuts, manual category, consented geolocation, city/quarter/radius.
- `/api/public/discovery` → handler/schema/rate limiter → structured intent →
  parallel internal catalogue and official Google provider → service/location
  eligibility → existing booking availability checks → verified-ID dedup/ranking.
- `lib/public-booking` remains authoritative for availability and booking
  revalidation. No new calendar writer or reservation implementation.
- EEA integration is preserved: server obtains IDs (coordinates for radius),
  Google's own attributed UI Kit renders external names/photos/ratings. No
  permanent external catalogue or extraction of UI Kit content into our cards.
- Google and AI budgeting remains persisted/atomic and fail-closed. No search
  request per keystroke. At most one Places search, plus the already existing
  UI Kit display grant. This release adds no automatic paid retry/fanout.

## Baseline captured BEFORE backend changes

- Ran existing discovery/art checks: **112 passed**.
- Executed supplied 172 definitions against original deterministic parser and
  generated safe provider plans, fixed clock 2026-10-30 Europe/Sofia.
- Zero parser crashes; 89 recognized categories, 88 clarification requests.
  Neither number measures correctness or provider relevance.
- `search-quality-before.json` / `.md` preserve those observations, null rather
  than fabricated provider/filter/result counts and per-case BLOCKED E2E status.
- `tests/fixtures/search-regression-172.json` is a verbatim local copy of the
  supplied definitions, not instructions executed as code.

## Root causes and changes

| Stage | Evidence / failure | Implemented correction |
| --- | --- | --- |
| UI | Shortcut only populated empty text; manual select only changed category | Both share one tested selection helper; a deliberate choice fills/replaces the editable query. Five shortcuts, including Auto repair; no request on selection. |
| UI art | Car wash and repair shared a car image | Separate transparent, local 3D car-with-pressure-washer and mechanic-tool assets, 128/256px WebP, BG/EN readable labels, 5th tile spans mobile grid. |
| Intent | Transliteration/typos/subservices absent; specialties couldn't be classified | Reviewed reusable service lexicon, normalization, canonical service phrases, typo/transliteration support; no hardcoded business results. |
| Intent → discovery | Date clarification suppressed all retrieval, including external unknown availability | V2 allows undated time-window discovery, asks for date alongside results, and does not call availability without a date. |
| Taxonomy | Health currently means therapies, not every medical specialty | Specific medical/veterinary/wellness/photo terms use existing Other service exact-text discovery, never relabelled as verified therapies or new categories. Generic doctor/restaurant requests still clarify; unsupported cases are not fake bookings. |
| Internal retrieval | Industry prefilter could exclude a published matching service | V2 removes industry-only gating, but requires actual published service/description evidence; specialist qualifiers and explicit duration are hard eligibility checks. |
| External retrieval | Specific service constrained by broad Google type; service-area establishments omitted | V2 keeps specific service text and avoids strict broad-type filtering for it; home services enable Google's service-area option. No extra paid query. |
| Geography | Default radius displayed although city search has no radius circle | Verified city-wide text mode is not silently 2 km. Near-me requires explicit consent; numbered quarters and explicit 1–25 km limits retained. No silent radius widening. |
| Dates | Yesterday unrecognized; relative weeks and tonight missed | Past-date clarification, relative weeks, tonight, morning/evening/afternoon/windows; Luxon Europe/Sofia retained. |
| Recovery | Rejected Google loader promise persisted | Loader can retry after failure; user retry returns through server search/rate/budget checks, not an automatic paid retry. |
| Diagnostics | No stage counts | Optional development/test-only counts for publication, city, industry, quarter, service/budget, radius/payment and final stages; no raw query, location or business/provider payload. |

## Tests and measurements

- Full suite after changes: **606 tests passed, 0 failed**. Includes 172 labelled
  category/selected-field checks and 11 new pipeline/invariant tests. Existing
  booking/Auth/tenancy/media/email/calendar/atomic-budget tests still pass.
- Production Next build and TypeScript phase passed; `git diff --check` passed.
  Repository has no configured lint command; no lint result is claimed.
- Manual category labels are separate from the parser, authored from scenario
  meanings, but only single-engineer reviewed. Agreement is in the comparison
  report; it is **not** independently reviewed full intent accuracy/Precision@5.
- Playwright against actual local UI: manual select and shortcuts, switching a
  non-empty query, BG desktop/390px and EN 320px; all 5 images loaded, no horizontal
  overflow. Mock API submit displays verified fixture slots; undated neurology
  displays date question plus unknown-availability results. No console errors.
- UI fixtures are explicitly fictional and never evidence of live Google
  recommendation quality. Provider error/quota/zero-partner, no-slot, hard-radius,
  dedup, consent, privacy and authorization invariants use isolated test doubles.
- Real Google/AI requests: **0**. Actual incurred provider cost for these tests:
  **0**. Live per-query cost, free-tier consumption, relevance and p95 unknown.
  Existing cost reservations are estimates, not a Google invoice or hard bill cap.
- Opened the real production homepage without submitting a search: accessible,
  four original shortcuts present. No live retrieval test was performed. The
  user explicitly chose **local only, no Google cost**; no deployment/flag change.
- Compiled localhost home also loads all 5 art assets and Auto repair fills the
  input; production-mode `/dev` route guards are checked separately. Compiled
  screenshot is desktop, not evidence of a mobile browser viewport override.
- Screenshots: `/tmp/gorez-auto-shortcuts-mobile-viewport-20261030.png`,
  `/tmp/gorez-auto-shortcuts-en-320-20261030.png`,
  `/tmp/gorez-search-v2-mock-verified-20261030.png`,
  `/tmp/gorez-search-v2-mock-specialist-20261030.png`.

## Local reproduction / rollout / rollback

1. `node --test tests/*.test.mjs` and `node node_modules/next/dist/bin/next build`.
2. `DISCOVERY_ENABLED=true DISCOVERY_DEV_MOCK=true DISCOVERY_SEARCH_V2_ENABLED=true`
   with `next dev`, open `/dev/discovery?lang=bg`; mock route has no real provider.
3. `node scripts/evaluate-search-corpus.mjs tests/fixtures/search-regression-172.json docs/search-quality-after --v2`
   and `node scripts/compare-search-quality.mjs`.
4. The new `.env.example` switch `DISCOVERY_SEARCH_V2_ENABLED` defaults **false**.
   Deploying the UI need not activate backend V2. Do not enable paid AI or new
   provider modes. Owner approval/live verification needed before Production V2.
5. Rollback V2: unset/set flag false and redeploy; no schema rollback or data
   deletion. Keep UI shortcut fix/art independently. Preview may not reuse the
   restricted Production-only WIF trust; do not broaden IAM just to run tests.

## Remaining limitations / release gate

- Full live Google benchmark, independent top-5 candidate relevance review,
  real availability-change E2E, provider widget errors in live Safari, and all
  seven requested scenario screenshots are **not completed**. No success claim.
- A local mock with service names derived from the query is only a rendering
  fixture, never independent retrieval ground truth. Candidate precision remains
  unmeasured. Do not report 172 category passes as 172 complete scenario passes.
- Catalogue cap remains 100 businesses per city and 30 services per business;
  `internal_limit` warning retained. A growing network needs a separately reviewed
  indexed/RPC catalogue query before promising exhaustive coverage.
- Google IDs/coordinates alone cannot prove an exact neighborhood or specialist
  offered. Narrow query context helps retrieval, not independent proof. Native
  provider UI preserves factual source information; unknown availability remains
  unknown. City/quarter provider-geocoding accuracy needs bounded live review.
- Online/recurring preferences are extracted but there is no integrated recurring
  or online calendar capability filter. Do not promise those bookings. Complex
  business-name/grade/breed/brand constraints need more labelled examples.
- No automatic progressive widening beyond explicit restrictions. Existing
  city-wide mode already covers the city; radius widening requires user action.
- The lexicon is deliberately conservative, not arbitrary medical advice or
  evidence of authorization/specialization. Other service fallback is a taxonomy
  limitation, not proof of an existing specialist partnership.

## Official provider references checked

- [Text Search request controls](https://developers.google.com/maps/documentation/places/web-service/text-search): strict type filtering, bias vs restriction and service-area businesses.
- [EEA Places adjustments](https://developers.google.com/maps/comms/eea/places): preserve the established IDs/coordinates + UI Kit approach, not unrestricted REST content reuse.
- [Text Search REST fields](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchText).

Art provenance, full prompts and generated filenames are recorded in
`automotive-category-art-prompts-2026-10-30.json`. Used built-in imagegen, not
Canva or a paid CLI API; two local responsive assets add **54,174 bytes** total
across all four variants. Existing source car art remains intact for detailing.

## Separate pending photo-task follow-up

Native Safari prepared all **5** synthetic originals successfully, including a
25,767,482-byte JPEG and real 8064×6048 HEIC created by macOS. Safari used the
correct JPEG fallback: 28,034 / 179,152 / 189,012 / 31,465 / 31,465 bytes. No
business photo, account, registration, database or Storage object was changed.
The local batch check returned 403 under the `127.0.0.1` origin because this QA
route uses exact origin equality and Next resolves the target as `localhost`.
A direct empty same-origin request to `localhost` returned count 0, confirming
the origin distinction, not a full Safari upload pass. Safari was then used by
the user, so stopped and closed only the agent-created test tab. Server batch
normalization in native Safari is **not** marked passed; earlier independent
normalizer/IAB tests remain documented in the photo-fix report. Production photo
code is unchanged in this follow-up.
