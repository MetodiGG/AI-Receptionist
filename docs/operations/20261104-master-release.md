# Master specification release — 2026-11-04

## Authority and scope

The owner explicitly requested publication, then confirmed **all three named Production migrations and publication**. The owner separately approved the free Vercel visit counter and publication. No new paid services, Google/AI usage tests, real reservations, business opt-ins, subscriptions or credential changes were authorized. Vercel's separately generated Web Analytics branches were inspected read-only, not blindly merged; this branch adds the pinned SDK with a tested privacy filter instead.

## Database — completed

Target verified in the authenticated Supabase Console URL: `ilpdtvbymxqgimrboyvh`, main / Production.

Applied `20261104170000`, `20261104171000`, `20261104172000` together using `20261104-master-approved-release.sql`.

- Read-only preflight found no new booking-mode columns and confirmed both original RPC signatures/body hashes exactly matched the tested local schema.
- The same atomic wrapper was executed against local PGlite before Production execution.
- A single transaction used a 3-second lock timeout / 30-second statement timeout, brief write locks, before/after fingerprints for all pre-existing businesses, services, staff, working hours, customers and appointments, and original-function-body preservation checks. Any mismatch would have rolled the entire transaction back.
- Console result: `all_three_applied`, `existing_data_unchanged=true`, 4 businesses, all 4 in default `gorez` mode, 1 appointment and 9 customers. The existing publication states remained 3 enabled / 1 suspended.
- Confirmed the client cannot directly execute mode-setting or link-review RPCs.
- A fresh post-commit query confirmed RLS enabled on all four new persistent tables: `booking_referral_events`, `external_booking_link_audit`, `external_booking_links`, `external_booking_reports`.
- Production did not have `supabase_migrations.schema_migrations`; no new migration-history schema was invented. These scripts are already applied, not pending. Reconcile existing manually applied schema before adopting CLI `db push` later; do not blindly rerun the baseline or these function-renaming scripts.
- No business mode or external destination was changed, no test business/customer/appointment was inserted, and no existing row was edited or deleted.

## Application — published and smoke-tested

- [Pull request #28](https://github.com/MetodiGG/AI-Receptionist/pull/28) merged after both Vercel checks passed. Main application revision: `4736f4ad04e8d6deababdec74fd2911e98d511d2`; its tree matches tested branch `897e6a83b22c0290dc67089327fa3de4226900ba` exactly.
- [Production deployment](https://vercel.com/ai-receptionist12/ai-receptionist/57kP2RHc3jq9xMA3jh8taXSjmYgz) completed successfully and is live on [www.gorez.co](https://www.gorez.co/). No Preview was promoted with staging configuration.
- Final local verification with the approved analytics integration: **671 tests passed / 0 failed**, production build passed, production dependency audit **0 vulnerabilities**, whitespace check clean. No lint command is configured.
- Live HTTP: home and partner directory 200; BG and EN FAQ 200 with all 69 server-rendered answers; public Zen profile API 200 with 7 services, `gorez` mode and no private external URL; new admin statistics, admin link register and owner summary return 401 without authentication. Outbound GET returns 405 without redirect/count; production dev dashboard 404. Public pages return `Referrer-Policy: strict-origin`, private admin API `no-referrer`; the analytics script endpoint returns JavaScript 200.
- Live public directory still contains exactly 3 published businesses, all GoRez mode; the suspended test account is not listed.
- Actual Safari loaded the new FAQ, changed BG → EN and preserved the protected admin login boundary. The private cloud statistics view could not be opened without signing in, so a live authenticated count/read/save is **not** claimed; its actual UI, authorization and query paths were tested locally.
- Published FAQ at 390 CSS px: document width exactly 390, working business tab and expanded external-booking answer. [Mobile proof](../review/2026-11-04/faq-production-mobile.png).
- Vercel UI verified **Hobby**, analytics already enabled (menu offers Disable Web Analytics), no paid upgrade. After the real browser checks it received **2 page views / 2 estimated visitors**, listed only as `/faq` with no `lang` query. These are QA visits, not two acquired customers. [Counter proof](../review/2026-11-04/analytics-production.png). Historical visits remain unavailable; estimates/collection limitations still apply.

The separately generated Analytics PRs #26/#27 were not merged or closed; their unfiltered duplicate integrations are unnecessary after #28.

## Operational follow-up

The Vercel counter loads only on allowlisted public Production routes on the GoRez domains, removes every query parameter, suppresses fragment/credential/private-token URLs and custom events, and respects DNT/GPC. Potentially personal referrers suppress collection; the global strict-origin referrer policy also protects same-origin collection requests. Preview/local and initial private routes do not load the SDK. Visitors/page views are viewed in Vercel → ai-receptionist → Analytics; `/admin` → Statistics contains separate first-party usage counts and a link there. Collection is not historical and is subject to blockers/provider limits. No Pro/Plus or paid Custom Events were enabled. See the official [Hobby limits](https://vercel.com/docs/analytics/limits-and-pricing) (50,000 monthly events shared across the team, collection paused rather than billed beyond the free allocation).

Use a genuine approved owner account to opt into external mode; consent and direct booking-flow verification are still required. Non-partner booking links remain drafts until a verified platform admin personally reviews and approves them. The new anonymous measurements start from the application release, not historical site-visitor estimates. External clicks never establish completed bookings or sales.

Real iPhone 200% text testing and an owner-approved Google UI Kit selection/photo test remain acceptance checks; no extra billable provider requests were made as part of this release.
