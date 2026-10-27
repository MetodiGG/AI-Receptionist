# Google Places from Vercel without a service-account key

Prepared 26 October, updated 27 October 2026. **Owner-approved isolated staging/Preview setup and a bounded live Google pilot are complete.** Two city-only searches displayed real attributed native Google results on the configured keyless path. Google was then disabled in a Ready Preview, both application count limits returned to zero, and the owner reported deleting the dedicated browser key. Paid model, geolocation/Nearby, Production rollout and live negative trust tests remain unverified/unapproved. The chronological setup records below include earlier checkpoints; see the final pilot section for the current state.

## Approved activation record — 27 October 2026

The owner explicitly approved the limited Preview connection and enabling missing identity APIs. Using the existing signed-in Safari session:

- Google's Get started flow enabled `iamcredentials.googleapis.com`, `iam.googleapis.com`, `cloudresourcemanager.googleapis.com` and `sts.googleapis.com`. All four completion notifications were checked for the intended GoRez project.
- Created enabled pool **`gorez-preview`** and OIDC provider **`vercel-preview`** in project number `931616633430`. Google confirmed successful creation. Reopened the provider and read back the exact team issuer, allowed audience, immutable-ID/environment condition and subject mapping documented below; exited without further edits.
- On service account `gorez-discovery` (unique ID `108343807788951431116`), granted only **Workload Identity User** to the exact principal below. Read back the saved principal, role and lack of inheritance; Google reported policy updated. No pool-wide binding, additional administrative role, key, organization-policy override or production/development trust was added. IAM propagation and runtime authentication remain untested.
- Added **18 Config variables to Vercel Preview only**: the ten authentication/trust values below, seven false gates (`DISCOVERY_ENABLED`, `GOOGLE_PLACES_UI_KIT_ENABLED`, `GOOGLE_PLACES_UI_KIT_APPROVED`, `DISCOVERY_AI_ENABLED`, `GOOGLE_PLACES_ENABLED`, `GOOGLE_PLACES_REST_USE_APPROVED`, `GOOGLE_PLACES_DETAILS_ENABLED`) and `GOOGLE_PLACES_BILLING_REGION=EEA`. Verified all values in the form before saving and all eighteen names/Preview-only scopes after the success notification. Vercel requires a new deployment for these changes to take effect; **Redeploy was not clicked**. Production was separately inspected and contains none of these new variables.
- A post-save value-reveal attempt for the newly added non-secret configuration encountered Vercel's email-code verification. It was cancelled: no code was sent/read, no challenge bypassed and no existing secret revealed. Saved-value read-back and actual runtime validation are not claimed.
- **Staging isolation prerequisite:** the existing three Supabase variables and app URL are shared between Production and Preview. No values were revealed/copied and no existing variable was changed. Before enabling discovery or applying migrations, obtain approval for an isolated staging database/project and update Preview credentials separately. No migration, test booking/customer write, preview deployment, branch push or production change was made here.

## Confirmed and missing identifiers

The owner supplied:

- Vercel project: `https://vercel.com/ai-receptionist12/ai-receptionist`.
- Team slug: `ai-receptionist12`; project name: `ai-receptionist`.
- Immutable Project ID: `prj_NPyj35LFehhNCy4i00sIkLlfjfHH`.
- Team ID, verified in Team Settings: `team_VETL6j9GKn48TD2Rv0fCD0Y2`.

The Cloud screenshot showed `gorez-discovery@project-59dcbfba-7808-4a88-99b.iam.gserviceaccount.com` with Service Usage Consumer. Read-only Cloud Settings verified project ID `project-59dcbfba-7808-4a88-99b`, project number **`931616633430`** and display name GoRez. Linked-account view confirmed “My Billing Account” is linked to this exact project. A display name such as “My First Project” or “GoRez” does not identify the billing/security boundary and need not be renamed.

The isolated staging configuration, restricted pilot browser key and separately approved Preview live test are recorded below. Current provider activation is **off**, and the retired pilot key must not be reused. IDs are not secrets; tokens, keys and JSON credentials must not be sent in chat. Further ongoing use, a model or Production rollout needs separate authorization.

Read-only Vercel Security checks on 27 October confirmed **Team issuer mode** is already selected, with issuer `https://oidc.vercel.com/ai-receptionist12` and audience `https://vercel.com/ai-receptionist12`. Build Logs and Source Protection and Git Fork Protection were enabled; nothing was toggled/saved. Google's WIF page showed its initial Get started flow, not a configured GoRez pool. No runtime token was copied or logged.

## Why this path

The inherited `iam.disableServiceAccountKeyCreation` policy remains enabled. **Do not override it, grant broad roles or generate a JSON key.** A Vercel function presents its short-lived OIDC identity to Google's STS, then obtains a 15-minute, method-scoped access token for the dedicated service account.

OIDC is available on [all Vercel plans](https://vercel.com/docs/oidc/gcp); authentication does not require Pro or Static IPs. This does not determine Hobby commercial-use eligibility or guarantee free hosting/provider usage. [IAM API use is free](https://cloud.google.com/iam/pricing); Places/UI Kit and existing infrastructure remain separately metered. WIF does not remove Maps EEA restrictions or public-browser-key abuse risk.

## Configuration recipe / scope of the existing Preview setup

Steps 1–5 below are now configured as recorded above; do not create duplicates or widen them. Subsequent browser-key creation, database changes, deployment and real provider tests still require separate owner approval.

Start with **preview only**. Production flags remain false. Use an isolated staging database and preferably a dedicated Google staging project/service account. If the existing account is used for the first approved preview test, grant it only preview trust; do not give development/preview access to a production identity. No new hosting subscription is required by these steps.

1. In Vercel project settings, verify OIDC is enabled and issuer mode is **Team**. This implementation rejects the global issuer. Gather Team ID and Project ID from settings; no token needs to be copied.
2. An authorized Google project administrator must approve/enable these identity APIs if absent: **IAM** (`iam.googleapis.com`), **Cloud Resource Manager** (`cloudresourcemanager.googleapis.com`), **Service Account Credentials** (`iamcredentials.googleapis.com`), **Security Token Service** (`sts.googleapis.com`). They are distinct from the three Maps APIs already reported enabled. Keep Places (New) for server IDs-only search, Maps JavaScript + Places UI Kit for the separate browser key. No Vertex AI, Gemini, Storage, geocoding or messaging API is needed. See [Google's identity prerequisites](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines).
3. Open **IAM & Admin → Workload Identity Federation → Create pool**. For this preview-only example use enabled pool ID `gorez-preview`. Do not use Workforce Identity Federation. Create one OIDC provider, ID `vercel-preview`:

   - Issuer: `https://oidc.vercel.com/ai-receptionist12`.
   - JWK upload: empty; Google discovers Vercel's signing keys.
   - Choose **Allowed audiences**, exactly `https://vercel.com/ai-receptionist12`. Do not choose Default audience for this implementation; it avoids the additional Vercel custom-audience exchange.
   - Map `google.subject` to this CEL expression:

     ```text
     assertion.owner_id + ':' + assertion.project_id + ':' + assertion.environment
     ```

   - Set this attribute condition. Never use a pool-wide allow rule:

     ```text
     assertion.owner_id == 'team_VETL6j9GKn48TD2Rv0fCD0Y2' &&
     assertion.project_id == 'prj_NPyj35LFehhNCy4i00sIkLlfjfHH' &&
     assertion.environment == 'preview'
     ```

   This uses immutable IDs plus environment, not names alone. The resulting subject must be at most 127 bytes. Google verifies signature, issuer, audience and condition. The app's JWT decode is only fail-fast validation, not signature verification. See [Google mappings and conditions](https://docs.cloud.google.com/iam/docs/workload-identity-federation).

4. Open the **dedicated service account → Permissions / Manage access → Grant access**. Grant **Workload Identity User** (`roles/iam.workloadIdentityUser`) on that service account only to this exact preview principal for the verified project:

   ```text
   principal://iam.googleapis.com/projects/931616633430/locations/global/workloadIdentityPools/gorez-preview/subject/team_VETL6j9GKn48TD2Rv0fCD0Y2:prj_NPyj35LFehhNCy4i00sIkLlfjfHH:preview
   ```

   Do not grant `principalSet://…/*`, Owner, Editor, Storage/Vertex roles or Service Account Token Creator. There is no delegation chain. The account needs **Service Usage Consumer** on the fixed quota project, not WIF administration rights. A human configuring this may need Workload Identity Pool Admin and service-account IAM-management permission; do not grant those to runtime. If organization policy blocks WIF too, stop for the administrator; do not weaken the policy.

5. Save these in **Vercel → this project → Settings → Environment Variables → Preview only**, with the approved project's actual values. They are trust identifiers, not private keys:

   ```dotenv
   GOOGLE_PLACES_AUTH_MODE=vercel-oidc
   GOOGLE_PLACES_PROJECT_ID=project-59dcbfba-7808-4a88-99b
   GOOGLE_WIF_PROJECT_NUMBER=931616633430
   GOOGLE_WIF_POOL_ID=gorez-preview
   GOOGLE_WIF_PROVIDER_ID=vercel-preview
   GOOGLE_WIF_SERVICE_ACCOUNT_EMAIL=gorez-discovery@project-59dcbfba-7808-4a88-99b.iam.gserviceaccount.com
   GOOGLE_WIF_VERCEL_TEAM_SLUG=ai-receptionist12
   GOOGLE_WIF_VERCEL_TEAM_ID=team_VETL6j9GKn48TD2Rv0fCD0Y2
   GOOGLE_WIF_VERCEL_PROJECT_ID=prj_NPyj35LFehhNCy4i00sIkLlfjfHH
   GOOGLE_WIF_VERCEL_ENVIRONMENT=preview
   ```

   Leave `GOOGLE_PLACES_SERVICE_ACCOUNT_JSON` and `GOOGLE_PLACES_API_KEY` empty. Do not manually set `VERCEL_OIDC_TOKEN` in Preview/Production; runtime must provide it. No `NEXT_PUBLIC_` trust variables. Clients cannot choose quota project, service account, provider or environment.

6. Configure a **separate staging browser key**, restricted to the exact approved preview hostname(s) and only Maps JavaScript API + Places UI Kit. The existing `gorez.co`-restricted key will not work on arbitrary previews/localhost. Do not relax it to all sites or `*.vercel.app`. Keep provider flags off until the database migration, provider controls, EEA review and staging deployment are explicitly approved. See [the main activation guide](ai-discovery.md).
7. After approval, enable `DISCOVERY_ENABLED`, `GOOGLE_PLACES_UI_KIT_ENABLED`, `GOOGLE_PLACES_UI_KIT_APPROVED` in Preview only. Keep `GOOGLE_PLACES_BILLING_REGION=EEA`, full-content REST and Details false. The optional paid language model has a separate approval gate; WIF does not activate it.

Later production rollout requires a separate production pool/provider/account, condition and exact principal ending `production`, plus `GOOGLE_WIF_VERCEL_ENVIRONMENT=production` only in Production. Never widen preview trust. Team renames change issuer/audience; transfers change owner ID. Both should fail closed pending review.

## Runtime/security

- Explicit `vercel-oidc` mode; no fallback to JSON, API keys, ADC, local `gcloud` or broad scopes. Missing config returns external `not_configured`; failed identity/exchange returns `unavailable`, preserving real GoRez results.
- Official `@vercel/oidc` 4.0.3 **public request-context API** (`getContext`) runs inside the request, not at module initialization. The general refresh helper is deliberately not used: it can discover CLI credentials, write refreshed tokens and make extra requests. This adapter never reads token files, invokes a CLI or automatically refreshes a local identity.
- Preview/production require runtime context identity. Development alone can use an explicitly supplied `VERCEL_OIDC_TOKEN` from an approved Vercel development session. A configured `VERCEL_OIDC_TOKEN_FILE` without runtime context is rejected, not silently fallen back. Never pass ordinary user HTTP headers/body as the token supplier.
- OIDC input is bounded to 16 KB and checked for issuer/audience, immutable team/project, environment, subject and expiry before exchange **or cache hit**. Google STS provides cryptographic verification when minting. Decoded claims never choose billing or arbitrary target accounts. This workload identity is not an end-user login.
- Fixed official endpoints: `https://sts.googleapis.com/v1/token`, then `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/…:generateAccessToken`. STS has no Authorization header and requests only the IAM scope for impersonation. IAM requests one Places method scope, no delegates, lifetime `900s`.
- Each network phase has a three-second header/body deadline, bounded JSON, no redirects or retries. The documented 12 KB STS token is supported. No arbitrary credential-source URL or client endpoint. Uses the existing bounded transport instead of relying on generic auth-client internal STS/retry behavior. [STS API](https://docs.cloud.google.com/iam/docs/reference/sts/rest/v1/TopLevel/token), [IAM API](https://docs.cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/generateAccessToken).
- At most three method-scoped access tokens in a warm process, 60-second refresh margin, concurrent exchange deduplication. Trust rotation clears the cache; an old in-flight result cannot poison it. No OIDC/STS token is persisted or returned. Short-lived credential caching is not a Google business-content cache.
- Existing shared search budgets/rate limits precede identity acquisition. Failures stay counted. Missing DB budgets fail closed. Server WIF cannot prevent direct browser-key replay or replace provider controls/billing monitoring.
- Restrict deployment/editor access and preview code execution: authorized code can exercise the account's permissions. Code-level narrow scopes are not an IAM sandbox against malicious deployment code. Use dedicated accounts/projects, minimal roles, quotas and monitoring; untrusted fork code must not run in the trusted environment. For a kill switch disable the provider/remove the principal and turn off feature flags; already minted tokens can remain usable until expiry.

## Verification / live checks pending

Offline tests cover transport/scope/audience, missing/malformed config, wrong issuer/team/project/environment, expiry, oversized tokens, both provider error stages, header/body timeouts, no retries/credential fallback, concurrent reuse, rotation races, quota/input gates, EEA fields, internal fallback and client boundaries. They use **synthetic unsigned identities and mocked STS**: they do not prove live signature verification or IAM configuration.

On an explicitly approved preview deployment, verify:

1. Runtime supplies the intended team-issued identity; never log it.
2. STS accepts only this preview provider/project/environment; wrong-claim, production and untrusted-fork contexts cannot mint credentials.
3. IAM accepts only the exact principal and the account can charge the fixed quota project.
4. One manual-city and one consented-location search show real attributed UI Kit results using the restricted staging browser key. External appointment availability remains unknown. No map/Details call is added.
5. Booking revalidation, API failure, quota and kill switches work; no credential/token strings in public responses/bundles/logs. Inspect actual usage and approve production separately.

Local offline commands: `pnpm test`, `pnpm build`. The fictional dev mock requires no Vercel/Google credentials and never runs in production. Live local WIF requires a separately approved development-only provider/account and a short-lived token from the owner's trusted Vercel session; never paste it in chat or use a production/preview token to bypass environment checks.

## Separate staging database — schema verified, Preview credentials pending, 27 October

The owner approved preparing a separate Supabase project only if a free option is available, without changing the active database. Read-only dashboard checks showed organization **AI Receptionist / Free** (`owqwsqweklqohczaxyed`) with one visible project, the existing production project `ilpdtvbymxqgimrboyvh`. No other project was paused/deleted, no plan was changed and no production SQL was run. Supabase's account-wide two-active-free-project limit still needs to pass the actual creation step; seeing one project in this organization alone does not prove global quota availability.

In a **new Safari tab**, prepared the Free organization's new-project form with name **`gorez-staging`**, region **Central EU (Frankfurt), `eu-central-1`**, Data API enabled, automatic exposure of new tables disabled and automatic RLS enabled. Future schema setup must grant intended Data API access explicitly and retain the migration's private-table restrictions. No GitHub integration or paid add-on was selected. The original production SQL tab, including its unsaved editor content, was preserved.

Credential entry and final creation were handed to the owner, who reported completion. The new project was then verified through its own Dashboard: **`gorez-staging`**, reference **`dbvsfxkmljrwjberwodb`**, URL `https://dbvsfxkmljrwjberwodb.supabase.co`, Healthy, Nano, Frankfurt, in the same **Free** organization. No existing project was paused, deleted or upgraded.

The owner subsequently explicitly approved schema/security installation **only in staging**, and transfer of its API credentials **only to Vercel Preview**, excluding production-data copying, email activation and publication/deployment. This approval does not authorize a Git push that triggers an automatic deployment.

### Applied and verified

`scripts/prepare-staging.mjs` builds an offline, non-secret SQL artifact from the fifteen explicitly reviewed migrations, without connecting to a database or reading credentials. Its CLI accepts only the approved staging reference and an absolute new output filename. All migration bodies run in one transaction. Before any DDL, the SQL refuses existing public relations, Auth users or a nonempty migration ledger; any migration failure rolls back the installation. **The reference allowlist is an artifact-builder safeguard, not server-side project attestation:** independently verify the exact Dashboard URL before running. Do not rerun this bootstrap on an initialized project.

The owner-approved artifact was applied through the SQL Editor at `supabase.com/dashboard/project/dbvsfxkmljrwjberwodb/sql/…`, never the existing production project. Artifact SHA-256: `398c66e83daeb4a9fee81411799f273df72f796943955b11fe7b6716d7d7ab40` (86,365 bytes). Migration history has all fifteen versions, with each migration body stored as one valid SQL batch in its `statements` array; the builder does not reproduce the CLI's individual-statement parser.

The returned verification row showed **15 migrations, 22 public tables, all 22 with RLS**, and **zero** Auth users, businesses, customers, appointments and queued emails. A separate read-only query additionally returned true for private discovery budgets, restricted place-link writes, the actual appointment exclusion/collision constraint, absence of the `pg_cron` extension, no users and no email queue. No scheduler script or seed data was installed; no production records, password or keys were copied. Six PGlite tests exercise the complete original migrations with automatic RLS and the real `btree_gist` extension, permissions, refusal on existing data/history, safe rerun refusal and rollback on a final-migration failure. Full suite: **312 passed, zero failed**; `git diff --check` clean.

### Initial credential boundary — subsequently resolved below

Vercel's original `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are write-only Secrets shared by **Production and Preview**, dated 13 October. They were not revealed, rotated or successfully edited. Adding a separate all-Preview value was rejected as an existing-target conflict. A scope-only edit of the legacy public-prefixed Secret was also rejected by Vercel's current type validation; it was cancelled, preserving the original. Do not rotate or replace the shared value, which could affect Production.

A branch-specific Preview override is the safe intended path, but Vercel refused to save the staging URL for **`codex/ai-business-search`** because this local branch is not yet present in the connected Git repository. The unsaved form was closed. **No staging API key has been read or transferred, and even the new URL was not saved.** Other Preview branches remain backed by their original shared settings and must not be described as isolated.

Next requires separate owner approval for publishing the feature branch and a test Preview deployment. Before any push, temporarily disable **Preview Branch Tracking only** (leave Production tracking and deployment protection untouched), verify it is disabled, then publish the reviewed branch without merging to `main`. Once Vercel recognizes the branch, add the staging URL/public key and server key as branch-specific Preview overrides, using UI copy/paste without chat/log/file disclosure. Set the verified Preview app URL/callback configuration, explicitly keep mail/cron and all external-provider flags off, and inspect environment scopes before the first manual Preview deployment. Do not rely on an unverified commit-message skip marker. Restore Preview branch tracking only under the approved workflow after isolation is verified. Google UI Kit keys/provider activation and live paid requests remain separate approvals; never deploy with the original Production database settings as a shortcut.

### Owner-approved Preview preparation — 27 October

The owner has now explicitly approved temporarily stopping automatic Preview deployments, publishing the feature branch, connecting staging and making a **test Preview deployment only**, without changing the live site, enabling email, or activating paid AI/Google requests. Preview Branch Tracking was saved **off** and verified still off after reloading its exact Preview settings page. Production settings were not edited. A fresh local `pnpm build` succeeded before publishing. The three staging credentials are still pending at this point; do not deploy until their branch-specific overrides are saved and verified.

Published feature commit `a4cd76b03ed7320bb3e8b91fcd53a9ab5d7b6a53` to `origin/codex/ai-business-search`, without a merge or PR. Read-only remote verification still shows `main` at `6e474c538e1ca0c9af355eea2df76572d9f4bebc`. A fresh full suite again passed all **312 tests**. Preview Branch Tracking remains off.

Vercel accepted one Config batch after the branch existed. The submitted scope was **only `codex/ai-business-search`** (not all Preview and not Production): `NEXT_PUBLIC_SUPABASE_URL=https://dbvsfxkmljrwjberwodb.supabase.co`, `DISCOVERY_ENABLED=true`, both `EMAIL_NOTIFICATIONS_ENABLED` and `EMAIL_REMINDERS_ENABLED=false`, and all four daily/monthly `DISCOVERY_GOOGLE_*_LIMIT` / `DISCOVERY_AI_*_LIMIT` variables set to `0`. Internal rules-based discovery is intended for testing; paid interpretation, Google REST/UI Kit/Details flags remain false. The UI returned **Added Environment Variable successfully**; runtime/read-back validation is pending.

The Mac locked before the staging API-key page was opened. The owner was asked to unlock it. **No staging key has been copied or saved and no Preview deployment has been requested yet.** Resume with key transfer, environment-scope read-back, verified Preview URL/callbacks and deployment protection; never use the shared Production keys to unblock testing. Keep automatic Preview deployments disabled while this setup is incomplete.

### Staging credential transfer — completed after owner unlock, 27 October

The owner unlocked the Mac and work resumed in the already authorized staging/Preview scope. The existing **legacy anon and service_role keys** were copied through the staging Dashboard directly into the Vercel form using native clipboard actions, without creating/rotating keys, writing them to a file, or printing their values. Source JWT project-reference and role claims were checked against `dbvsfxkmljrwjberwodb` and the expected role; this is an operator check, not JWT signature validation. The public key was saved as Config (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), and the server key as a **write-only Secret** (`SUPABASE_SERVICE_ROLE_KEY`). The clipboard was replaced with the non-secret Vercel settings URL and the revealed-key page was navigated away from.

Read-back of the Vercel variable list confirmed all three new Supabase settings have **Preview `codex/ai-business-search` only** scope. Original shared Production/Preview settings still show their original 13 October timestamps and were not modified. Other Preview branches are not isolated by these overrides.

An additional branch-only Config batch explicitly set **false** for `GOOGLE_PLACES_UI_KIT_ENABLED`, `GOOGLE_PLACES_UI_KIT_APPROVED`, `DISCOVERY_AI_ENABLED`, `GOOGLE_PLACES_ENABLED`, `GOOGLE_PLACES_REST_USE_APPROVED`, `GOOGLE_PLACES_DETAILS_ENABLED` and `DISCOVERY_DEV_MOCK`. The submitted values and branch-only scope were checked, and Vercel confirmed the save. Daily/monthly AI and Google quotas remain zero; email flags remain false. No provider request, token mint or email was sent.

Existing Deployment Protection was checked read-only: Vercel Authentication **Require Log In** is enabled with **Standard Protection**, covering non-production deployments. No new bypass, shareable link, public exception or paid protection was added. With Preview Branch Tracking still off, **Create Preview Deployment** was submitted for `https://github.com/MetodiGG/AI-Receptionist/tree/codex/ai-business-search`. Build status, deployment hostname, the Preview app URL/callback configuration and runtime checks are pending; a submitted deployment is not a verified working feature.

### First Preview ready; final rebuild awaits owner reauthentication

Vercel marked the first deployment **Ready / Preview**, source `codex/ai-business-search`, at dashboard deployment `HRUzQww9zKtud76RmkqBC2izA7Xj`. Its immutable hostname is `ai-receptionist-x0pnhfnkk-ai-receptionist12.vercel.app`; its verified branch alias is `ai-receptionist-git-codex-ai-business-search-ai-receptionist12.vercel.app`. No Production promotion or custom-domain assignment was performed.

Saved **`NEXT_PUBLIC_APP_URL=https://ai-receptionist-git-codex-ai-business-search-ai-receptionist12.vercel.app`**, Config, **Preview `codex/ai-business-search` only**. The submitted value/scope, success notification and branch-only list entry were verified. The original Production/Preview app-URL entry retains its 15 October timestamp. This latest variable requires a new build; the first deployment does not yet include it.

Unauthenticated diagnostic GET of the Preview `/search` returned **302 to `https://vercel.com/sso-api`** (only origin/path inspected, no token/cookie output). This verifies the preview is not anonymously accessible; it is not a functional search test. No protection bypass was added or used.

The first deployment's **Redeploy** dialog was verified to target **Preview**, the correct feature branch and branch alias, with existing Build Cache unchecked. Submitting it triggered Vercel's **Reauthenticate → Send Code to Email** step-up screen, not a confirmed second deployment. The owner was asked to send/enter the code directly in Vercel and confirm only that Preview redeploy; no code was requested in chat, sent or read by the agent. Do not use another deployment path to evade this challenge. Keep Preview Branch Tracking off until the owner completes reauthentication and the final deployment is verified.

Runtime BG/EN/mobile search checks and client-bundle/staging-isolation checks are still pending. Supabase Auth redirect/site-URL settings have **not** been changed or claimed verified; do not run signup/password-recovery email flows as part of this no-email search test. No live Google/AI request, authentication email, booking, business seed or Production data access has been performed.

The owner subsequently reported reauthentication complete. Read-back confirmed a **second Preview deployment Building** at dashboard ID `7TyFuUUTKNAdHmw1qjpotsGsyMMp`, immutable hostname `ai-receptionist-q5zs2hrpf-ai-receptionist12.vercel.app`, with the same verified branch alias and feature branch. This confirms the challenge was completed by the owner, not bypassed. Final Ready status and functional verification are still pending.

### Verified test Preview — 27 October

The second deployment was subsequently verified **Ready / Preview**, still on `codex/ai-business-search`, with the branch alias above. Safari's existing authorized Vercel session opened `/search` through normal authentication, without a bypass. Live UI tests against the branch alias passed:

- Bulgarian: `Намери ми барбершоп в Младост, София, за утре след 17:00.` → barber, Sofia, Mladost, **2026-10-28**, time from **17:00**.
- English: `Find a car wash in Sofia under 30 euros tomorrow after 17:00` → car wash, Sofia, **2026-10-28**, time from **17:00**, maximum **30 EUR**.
- Bulgarian nearby request without location → one clarification, `В кое населено място в България да потърся?`, without automatically requesting browser location.
- Both concrete searches returned **zero results**, as expected from the empty staging database, with **rule-based interpretation**, an explicit notice that external discovery is off, and no internal-provider failure notice or fabricated availability. These checks do **not** verify the optional paid model or live Google results.

Because the owner was using Safari concurrently, independent responsive QA used an **agent-created temporary IAB tab** against a separate local server on **127.0.0.1:3009**, not the owner's port 3000 app or the live database. Public Supabase configuration was overridden with a localhost no-database URL and placeholder key; the server key and external-provider keys were empty, and mail/providers were explicitly off. Only the explicitly labeled fictional `/dev/discovery` fixture was exercised. Manual **Sofia → Mladost** selection and submission worked; two fictional cards rendered with **zero booking links**. DOM widths matched viewports exactly at **320 px, 390 px and 1440 px**; mobile screenshots were visually inspected. This is local responsive verification, **not a mobile test of the authenticated live Preview**. The captured console contained one earlier Vercel-login FedCM message, not an error from the local fixture. The viewport override was reset, the temporary tab closed, and the owned port-3009 server stopped (exit 130).

Scope remains test-only: no Production promotion/merge/settings or database change, no GoRez mail, live Places/AI call, seeded business, booking or Auth callback test. External providers and their application quotas stay off/zero. Initial free empty-staging testing therefore does not yet satisfy the original Google discovery acceptance criteria. Remaining work requires separately approved restricted browser-key/provider setup, live cost-limited Google verification, optional model verification and a later Production decision. Supabase Auth redirects remain pending if account/email flows are later included.

Operational follow-up: restore the originally enabled **Preview Branch Tracking** after saving this record and verify the saved value. All feature-branch database overrides remain in place; do not describe other Preview branches as isolated.

### Bounded live Google pilot and verified shutdown — 27 October

This later checkpoint supersedes the earlier pending/no-live-call status. Preview Branch Tracking was independently verified **on**. The weekly-channel loader passed all **312 tests** and `next build`, and commit `ba3ce2b` was pushed only to the feature branch. Its first automatic Preview was Ready at `3Eb2Aw7QsM1PqTzB44KbZ64vqVrD`.

The owner separately approved up to five manual city-only searches, five results each, no model/geolocation/map/email/Production. The owner created `GoRez Preview Discovery`, restricted to the exact feature-branch alias plus Maps JavaScript API / Places UI Kit. The existing key was privately copied only into a write-only `GOOGLE_MAPS_BROWSER_KEY` branch override; no server JSON key, new trust, cookie transfer, token file or broad IAM grant was introduced. The owner explicitly declined lowering the shared Google project quota; it was left unchanged.

After the owner personally completed GitHub/Vercel sign-in and Vercel email step-up in the isolated in-app browser, Config read-back confirmed the staging URL `https://dbvsfxkmljrwjberwodb.supabase.co`, the correct branch app URL, five-result maximum, Google reservation counts 10/day and 10/month, US$1 reservation envelope, both UI Kit flags true, and AI/email/REST/Details/mock flags false. AI counters stayed zero. The selected **Preview** redeploy became Ready at `AQ1svKUN1wCkyF5RmDYSEhx8sBxH` (`ai-receptionist-3ojmt693n-ai-receptionist12.vercel.app`), source `ba3ce2b`.

Two manual requests on the branch alias succeeded: a Bulgarian barber/Sofia/tomorrow-after-17:00 request, and an English car-wash/Sofia/30-EUR/tomorrow-after-17:00 request. Both correctly showed rules-based interpretation and **five native Google places despite zero GoRez businesses**, with attribution, ratings, visible Maps actions and unknown external prices/availability. No Google business-name/rating catalogue was stored. This validates the configured live happy path, **not** an independent STS/IAM audit or live wrong-claim/referrer-denial test. Actual Google billing telemetry was not independently reconciled; do not claim a measured zero bill.

Both UI Kit flags were then saved/read back **false**, both Google count limits **0**, and the shutdown Preview redeploy was verified **Ready** at `46kTAMY5q4TDFjx42zyN2pvmDv8n` (`ai-receptionist-gc26hec7c-ai-receptionist12.vercel.app`). A third manual search after shutdown showed the explicit external-disabled message and **zero Google regions**. The previous live SDK tab was closed. Anonymous GET of the alias `/search` still returned **302 to `https://vercel.com/sso-api`**, with no bypass.

The owner reported deleting **only** the dedicated test browser key. This was owner-reported, not independently read back in Cloud; provider revocation can take time. The retired write-only Vercel value must not be reused. Original website key, Google quotas, billing and Preview-only IAM trust were not changed by the agent. Production remained untouched. A 390 px viewport attempt still measured 1280 px, so real-widget mobile responsiveness is not claimed; the prior local fictional 320/390/1440 px checks remain separate evidence. See [the full pilot record and remaining limitations](ai-discovery.md).

Current authorization is test-only and **off after the pilot**. Do not enable ongoing use, restore the retired browser key, widen Preview trust or roll out Production without a separate owner decision.
