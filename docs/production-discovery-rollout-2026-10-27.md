# Production discovery rollout — 27 October 2026

This record supersedes the earlier **unapproved Production** checkpoints in
`ai-discovery.md` and `google-wif-vercel.md`. A prepared or saved setting is not
proof that a public deployment is working.

## Owner approval and scope

The owner explicitly approved the non-destructive discovery migration in the
real GoRez database, a separate Google↔Vercel Production identity, ongoing
external discovery with a **US$10 application reservation ceiling per UTC month**,
and fictional email delivery tests **only to info@gorez.co**. The exact separate
IAM pool/provider/account and minimal roles were confirmed again at the grant.
No Pro purchase, paid model, Google project quota changes, customer deletion or
changes to real appointments were approved or performed.

The owner chose not to buy Vercel Pro after being informed that commercial use
is not permitted on Hobby. Removing a visible price does not alter that policy;
no eligibility or continued-hosting guarantee is made.

## Applied and read back

- Production Supabase project: `ilpdtvbymxqgimrboyvh`. A **new, separate** SQL
  editor tab was used; the owner's existing unsaved SQL tab was preserved.
- Preflight found reviews, review worker, dispatch function, pg_cron and pg_net
  already present, but neither discovery table.
- Applied the exact reviewed `20261026160000_discovery_budgets.sql`. Read-back
  returned true for both new tables, RLS on both, private table privileges and
  service-only budget RPC execution. No legacy bootstrap or other migration was
  rerun; no customer, business, appointment or provider-content row was changed.
- Existing five-minute `gorez-booking-emails` job is active; its named Vault
  secret exists. Read-only aggregate telemetry showed six HTTP 200 / zero 401
  responses in the preceding 30 minutes. No Vault value, HTTP headers or message
  payload was selected. This is dispatcher health, not email delivery proof.
- Existing Vercel Production email notification/reminder flags are both `true`;
  sender is `GoRez <info@gorez.co>`. These values were read, not changed.
- Created separate enabled Google pool `gorez-production`, provider
  `vercel-production`, issuer `https://oidc.vercel.com/ai-receptionist12`, allowed
  audience `https://vercel.com/ai-receptionist12`, subject mapping
  `assertion.owner_id + ':' + assertion.project_id + ':' + assertion.environment`.
- The provider condition requires immutable owner
  `team_VETL6j9GKn48TD2Rv0fCD0Y2`, project `prj_NPyj35LFehhNCy4i00sIkLlfjfHH`
  and environment exactly `production`.
- Dedicated service account
  `gorez-discovery-production@project-59dcbfba-7808-4a88-99b.iam.gserviceaccount.com`,
  ID `101419674306352214824`, has **Service Usage Consumer** on the Google
  project. Only this exact principal has **Workload Identity User** on it:

  ```text
  principal://iam.googleapis.com/projects/931616633430/locations/global/workloadIdentityPools/gorez-production/subject/team_VETL6j9GKn48TD2Rv0fCD0Y2:prj_NPyj35LFehhNCy4i00sIkLlfjfHH:production
  ```

  Google success notifications and saved principal/role/no-inheritance were
  checked. No Owner, Editor, Token Creator, wildcard, private key or Preview trust
  expansion was added. Runtime exchange is still pending.
- Original browser credential **Maps Platform API Key** was verified with only
  Maps JavaScript API + Places UI Kit, and exact `https://gorez.co/*` /
  `https://www.gorez.co/*` referrers. The deleted pilot key was absent from the
  credential list. The original key was transferred to a write-only Vercel
  **Production-only** `GOOGLE_MAPS_BROWSER_KEY` Secret without creating, rotating
  or relaxing a key. It is intentionally public when issued to the SDK; HTTP
  referrer restrictions and application counters do not make it unreplayable.
- Saved 26 Production-only Config entries: exact separate WIF identifiers,
  `DISCOVERY_ENABLED=true`, EEA, ten displayed results, six requests/minute/IP,
  200 Google reservations/day, 4,000/month and `10000000` microUSD/month.
  **Both UI Kit flags remain false during preflight.** AI, REST, Details and mock
  stay false; AI counters are zero. The form values and Production scope were
  checked before save; Vercel confirmed success. All 26 Config values were then
  individually revealed/read back under the Production filter and matched.
  Existing app URL is `https://www.gorez.co`. These need a new deployment.

## Cost meaning / kill switch

The count limits cover provider reservations, not end users. A normal city-only
search usually reserves IDs plus one native list, approximately two counts and
US$0.005001 before free caps. The US$10 ledger can therefore permit about 1,999
such pairs, less with location-based Pro search, failures or extra reservations.
These are application estimates, **not** measured Google billing. Free caps are
account-wide and SDK calls may differ from application grants. The owner declined
provider quota changes. Alerts/counters do not enforce a hard Google bill cap.

Turn both `GOOGLE_PLACES_UI_KIT_ENABLED` and `GOOGLE_PLACES_UI_KIT_APPROVED` false
and Google day/month counts zero, then rebuild Production to stop normal grants.
Previously issued browser keys and immutable deployments are not revoked by
flags. For urgent revocation, the owner must disable/revoke the original browser
key in Cloud (this also affects any other use of that same key). Disabling the
Production WIF provider/binding stops new server token exchange; existing tokens
can survive until expiry. Do not widen or disable the Preview isolation.

## Verification / not yet claimed

- Protected Preview actual viewport: 390×844 and 320×740, no horizontal overflow;
  Sofia → Mladost 1 selection/search returned honest zero internal results while
  Google was off. BG/EN controls were checked. Override reset afterward. This is
  not a mobile test of the live Google widget.
- Existing 312 tests passed before the email diagnostic extension. Added a
  synthetic BG/EN confirmation/reminder/review diagnostic test; the final full
  suite **313/313**, all 14 focused email tests and production build pass. The diagnostic creates no booking,
  no review invitation and no working private action link.
- Still pending: release commit/deployment, public BG/EN
  internal/Google searches, native Google mobile UI, runtime trust/log check,
  actual mailbox/provider delivery of the three approved fictional tests, and
  final deployment/rollback record. No public activation or delivered mail is
  claimed by this checkpoint.
