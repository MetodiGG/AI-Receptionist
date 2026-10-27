# Production discovery rollout — 27 October 2026

This record supersedes the earlier **unapproved Production** checkpoints in
`ai-discovery.md` and `google-wif-vercel.md`. A prepared or saved setting is not
proof that a public deployment is working.

## Final activation — current state

**Published and verified on `https://www.gorez.co`**, source
`8337b8461281ec5dc8b320f5f7ef36440c809eaa` on `main`.

- Initial internal-only Production deployment: `HXorFq7L3kWRicGK9YfqC7ysw3E1`,
  `ai-receptionist-kyocd0snu-ai-receptionist12.vercel.app`, Ready.
- Both Production UI Kit flags were subsequently changed to **true** and read
  back. The explicitly selected Production/main redeploy is **Ready**:
  `9mNUXz9pLXmrCScin4cxdHM1d9yU`,
  `ai-receptionist-6v3my2qbk-ai-receptionist12.vercel.app`. Its assigned domain
  `www.gorez.co`, environment and source were checked. Preview stays disabled.
- Production was fast-forwarded from `6e474c538e1ca0c9af355eea2df76572d9f4bebc`
  without rewriting history. This is the previous code baseline if rollback is
  required; do not roll back to a build that accidentally restores provider
  activation. Turn off the provider gates and rebuild for the normal kill switch.
- Four explicit live city-only searches passed: BG barber/date/after-17:00,
  BG barber at a real mobile viewport, EN car wash/date/after-17:00/30 EUR, and
  homepage BG manicure → search page with one GoRez partner plus external places.
  Native Google attribution, ratings and Maps actions were visually checked.
  External price/schedule/preference compliance is explicitly unknown, not
  inferred from the search filters. The EN native Maps action was also English.
- Real native Google results were visually checked at **390×844** and **320×740**;
  document width equalled viewport width. Temporary viewport overrides were
  reset and extra test/admin tabs closed. No geolocation or map was requested.
- A separate internal manicure/Sofia/tomorrow-after-17:00 request returned the
  real published **ВЕСИ СТУДИО**, 60 minutes / 30,00 €, with current checked
  17:00/17:15/17:30 starts. The actual booking page, service and tomorrow selector
  showed matching available times. No customer information was entered and no
  appointment, customer or public review was created. The obsolete
  `mg-barbershop` slug returned not-found; the live public directory lists the
  actual published `vesi-studio` partner.
- Three fictional BG diagnostic messages were dispatched through the existing
  Vault-authenticated path to the fixed sender mailbox only: confirmation,
  reminder and review invitation. Exact HTTP request IDs **3471/3472/3473** each
  returned **202 / accepted:true / no error**. The owner independently confirmed
  receipt of all three at **info@gorez.co**. No secret value was written into SQL,
  selected as output or copied to local files. These tests do not prove elapsed
  24h reminder scheduling or a real completed-visit/review-token transaction.
- The final read-only Production budget check showed **8 reservations** and
  **20,004 microUSD (US$0.020004)** in each current UTC day/month bucket, matching
  the four normal ID/list pairs. This confirms persistent application metering,
  **not Google billing telemetry or a measured bill**. No free-cap balance or
  exact SDK billable-event reconciliation is claimed.
- Thirteen public smoke/security checks passed: home/search/directory/business
  registration/login/account 200; both dev fixtures 404; private customer API and
  admin mutation 401 without login; cross-site discovery 403; malformed same-site
  discovery 422; unauthenticated mail diagnostic 401. These rejected requests did
  not create a booking or send a message.
- The real five-step business registration entry point is present; an empty
  first step stays on step one with validation. No fresh Auth identity/password,
  business application or owner-dashboard session was created for this rollout.
- **313 automated tests pass**, production build passes. The two Vercel build
  warnings repeat the pre-existing broad `engines.node >=20.9.0` warning; they
  are not a failed build or discovery error. Node pinning was not changed here.

The keyless Production happy path is now live, not just configured. Negative
live WIF/referrer tests, geolocation/Nearby, provider failure-event simulation,
full new-owner signup/approval, a new real booking submission and an actual
one-use review submission remain outside this live verification. Their relevant
offline/database tests are not presented as live tests. Paid model, SMS/other
messaging, online card payments and automatic business ownership verification
remain off/not implemented. Legal operator/template details still need the
owner's review; this release is not a legal compliance certification.

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
  **Both UI Kit flags were false during this initial preflight.** AI, REST, Details and mock
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

## Earlier preflight checkpoint (superseded by final activation above)

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
