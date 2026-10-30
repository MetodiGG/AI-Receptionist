# Search v2 Production release — 30 October 2026

Owner explicitly requested deployment of all prepared changes after choosing
local-only testing in the prior turn. Deployed the implementation, while
retaining the no-paid-test constraint: no live Google/AI discovery requests,
new paid integrations, subscription purchase or quota changes.

## Deployment

- Source commit: `810fa1555de6d6672f8c53774ea1b6cef8e796bb`.
- Normal non-forced fast-forward `origin/main`: `6e53b6a` → `810fa15`.
- Vercel deployment: `2weSVgUTSx1SqymqEPtPfxgZQz9d`.
- Status visibly verified: **Ready / Latest / Production / Current**, 22s build.
- Assigned domains include **www.gorez.co** and
  `ai-receptionist-524radpp1-ai-receptionist12.vercel.app`.
- Added only `DISCOVERY_SEARCH_V2_ENABLED=true`, Config, Production-only.
  Existing API keys, IAM/WIF, Google/AI flags and budget limits unchanged.
  Saving succeeded; revealing the value requested verification and was cancelled.
  The running server's response below independently confirms activation.
- No database migration or change to customer/business/reservation records.

## Verification

- Re-ran complete suite before publication: **606 passed, 0 failed**.
- Next.js production build/TypeScript and `git diff --check` passed.
- Production homepage: all five shortcuts and all images loaded; Auto repair
  fills the text. Manual select switches to Car wash and back, including a
  non-empty query, without submitting discovery.
- BG 390px and EN 320px: document width equals viewport, all images load.
  Fifth mobile tile spans both columns. English selection fills `Car wash`.
- One bounded non-billable API check used an explicitly selected category and
  impossible date `2026-02-30`, invalid in BOTH old and new parsers. Response:
  HTTP 200, `intent.searchV2=true`, `category=auto_repair`, clarification `date`,
  `externalStatus=not_requested`, 0 results. This exits before catalogue,
  availability, AI/Google and their provider budgets. The existing HTTP attempt
  limiter still performs its normal aggregate accounting.
- `/partners`, `/account`, `/login`: HTTP 200.
- `/dev/discovery`, `/dev/category-art`, `/dev/photo-upload`: HTTP 404;
  POST `/dev/photo-upload/check`: 404. Guest media POST: 401.
- No real reservations, email, account creation, photos or business edits.

## Evidence / limits

- `/tmp/gorez-search-v2-live-desktop-20261030.png`
- `/tmp/gorez-search-v2-live-mobile-20261030.png`
- `/tmp/gorez-search-v2-live-en-320-20261030.png`
- `/tmp/gorez-search-v2-production-ready-20261030.png`
- `/tmp/gorez-search-v2-release-tests-20261030.log`
- `/tmp/gorez-search-v2-release-build-20261030.log`

Deployment is verified, not a claim of complete live search-quality acceptance.
All limitations in the [audit](search-quality-audit-2026-10-30.md) remain:
172 automated cases cover categories/selected intent fields, not independently
reviewed real top-5 results. No paid provider quality test was run. Existing
Google use by actual visitors remains subject to the previously configured
provider charges/budgets, not a guarantee that the entire service is free.

Rollback: set `DISCOVERY_SEARCH_V2_ENABLED=false` in Production and redeploy;
the UI/art changes may remain. Previous deployment `7Hziqx4VhbhxQKBc2jAkexqwBUg7`
is the prior verified app version. No schema or data rollback is required.

This post-release evidence record is kept locally to avoid an unnecessary second
Production build solely for documentation; deployed application remains 810fa15.
