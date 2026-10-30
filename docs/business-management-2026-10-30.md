# Business editing, optional photos and compact navigation — 30 October 2026

## Scope and current boundary

Implemented locally, **not deployed or applied to Supabase**. The owner asked
for admin business editing, optional business/team uploads during onboarding
and afterward, and the account/legal/header polish. Earlier deployment approval
covered a different release; this new database/Storage/API capability needs
explicit staging/Production approval. No real businesses, customers, bookings,
emails, admin allowlist, Google services, provider quotas or billing were changed.

## User flows

- Admin → Businesses → Manage → **Edit details & photos**. Sections: business
  data/contact/address/category/booking rules, public descriptions/payments/
  brands/location, services/prices/durations, team/bios, specialist hours/breaks,
  and photos. Staff/service rows retain their IDs; deactivate rather than delete.
  Public slug changes are explicitly labelled as changing existing links.
- Administrative saves require a reason, are audited, and reject stale content
  revisions. Owner edits to business/service/staff/hours/mappings/photos also
  advance the revision. New admin writes do not silently overwrite changes made
  since their detail snapshot. Existing owner forms retain their established
  editing architecture; this is not a rewrite of all owner editing endpoints.
- Existing appointments are not rescheduled/cancelled by editing. A schedule
  which conflicts with upcoming booked/confirmed visits is refused atomically,
  under the same business advisory lock used for reservations. Time zone changes
  are refused while upcoming bookings exist. Service prices still use the
  existing product model; no new historical price-snapshot feature is claimed.
- Owners → Settings → **Photos**. Choose business gallery or an active team
  member. Gallery cover selection, hide and restore; one current portrait per
  person. Photos appear in partners/search/business galleries and the business
  team/booking specialist selector. The migration adopts metadata for the two
  existing curated Vesi photos by the exact business ID, retaining their order,
  bilingual captions and crop. New uploads append, not replace. Those existing
  photos can also be hidden/restored or used as the cover; reapplying the
  migration never restores an intentionally hidden photo.
- Onboarding: optional business photos in step 1 and a portrait per person in
  step 3. Required rights/people consent only if images are selected. Signup
  without photos retains its JSON workflow; photos use bounded multipart.
  Portraits map to server-assigned staff UUIDs, never duplicate display names.
  No upload token, account password or service-role key is returned to a browser.
- A photo outage after a committed application reports partial-photo success
  and tells the owner to add missing photos after approval, without creating a
  duplicate business or rolling back a durable account. Pending photos remain
  private. Core profile save failure retains the previous rollback protection.
- Account footer explanation and green generic legal disclaimer cards removed.
  Actual policy/terms, Google disclosures and consent/error messages remain.
  Business sign-in is a larger orange-tinted card. BG/EN is one consistent,
  compact button; Home/language share a row on public/mobile headers. Very narrow
  marketing headers can place the logo on a separate row, never Home above BG.

## Security, limits and lifecycle

- Reuse verified, non-anonymous Supabase identity and existing server-side
  `PLATFORM_ADMIN_EMAILS` checks. Admin content API is admin-only. Photo API permits
  the verified owner of the exact business or an existing platform admin; caller
  IDs/roles, cross-tenant team IDs and extra body fields are not trusted.
- Strict schemas, same-origin mutation checks, private/no-store management
  responses, request/upload limits and durable rate limiting. No new owner,
  publication, account, subscription or billing controls in a content payload.
- Sharp 0.35.5 is now a direct pinned dependency, reusing the version already
  brought in by Next. Server independently decodes JPEG/PNG/WebP (no SVG,
  animated images or remote-URL import), auto-orients, strips metadata including
  EXIF/GPS, resizes inside 1600×1600 and emits WebP. Browser preparation reduces
  upload size but is never the security boundary.
- Incoming single file ≤4 MiB; whole signup multipart ≤4 MiB, JSON ≤60,000
  characters; normalized object ≤1 MiB; source ≤40 megapixels. Client-side source
  selection ≤20 MiB before compression. HEIC/HEIF is not supported by this upload
  path; choose JPEG/PNG/WebP. Native Vercel request limits still apply.
- Up to 12 active business photos, one active portrait per staff ID, 50 uploads
  per business/rolling day, 100 retained records per business, 32 MiB registered
  objects per business and 512 MiB registered objects globally. Registered
  hidden photos count toward retained quotas. These limits and authenticated
  request limits reduce abuse; they are **not a guaranteed hosting/Storage or
  data-transfer bill cap**, and are not a new paid plan activation.
- Private `business-media` bucket, fixed generated UUID object paths; no public
  URL or signed URL is emitted. A restrictive Storage policy blocks direct
  browser-role access even if another permissive bucket policy exists. Existing
  unrelated buckets/policies are not weakened. Server routes recheck current
  publication/photo/staff state, or verified owner/admin permission, before
  returning private/no-store WebP bytes. The two already-public curated assets
  use an exact business/path whitelist and a same-origin redirect after the
  same access gate; arbitrary source URLs are forbidden in SQL and the route.
  Hidden photo metadata is excluded from
  the public business response; internal object paths/actor IDs are not public.
- Hide retains the file for restoration. Metadata deletion/cascade queues exact
  object keys for deletion; the existing secret-authenticated daily notification
  cron also drains at most 25 media cleanup items, without changing its schedule,
  notification flags or sending extra emails. File removal failure keeps queued
  work; current registered photos are never removed by cleanup. Public access
  stops when metadata disappears, independently of a cleanup backlog/provider
  outage. Uploads reserve a durable cleanup record before storing bytes, so a
  crash cannot leave an untracked object. Existing bundled/curated source assets
  still require operator removal if an erasure request concerns those assets.
- Owner JSON export includes photo metadata, not a ZIP of image bytes. No
  automatic content-safety classifier, external-photo scraping or paid image
  provider was added. Operators can hide photos/suspend a business as needed.

## Database / activation instructions

1. Obtain approval for this exact new capability and migration. No new admin
   account, Owner/Editor role, JSON key or third-party app access is needed.
2. Apply `supabase/migrations/20261030100000_business_content_and_media.sql` to
   **gorez-staging only** first. It adds two business fields, three RLS-protected
   private tables, content/media RPCs/triggers, private bucket and restrictive
   Storage policy; preserves application RPC signature/return and reloads the
   PostgREST schema cache. It adopts metadata for the two existing Vesi photos,
   without copying their bytes or changing business names/status/bookings.
3. The original staging bootstrap deliberately excludes this pending migration
   (`PENDING_STAGING_MIGRATIONS`), so previous staging approval cannot silently
   activate it. Run the additive file on the existing staging schema; do not
   rerun the empty-database bootstrap or copy Production customer data.
4. Deploy matching source to protected Preview after staging migration. Verify
   an approved fictional admin/owner upload, account-free public display only
   after explicit test publication, and denial for another owner/guest. Do not
   create real user accounts or upload real staff portraits without permission.
5. After the authorized staging checks, apply the same file to the real GoRez
   database, then deploy matching main source. Keep existing production secrets,
   auth allowlist, Google limits, email flags, cron secret/schedule and plans.
   **No new environment variables** are needed. Existing server-role credentials
   stay server-only. A publicly configured bucket with this name aborts setup
   rather than being silently reused or reconfigured.
6. Verify new authenticated endpoints, image permissions and controls on live
   pages without editing real profiles or making bookings during smoke checks.
   Restore/erase a photo only with an explicit test target and owner permission.

Rollback: redeploy prior code without dropping new data/guards. Uploaded photos
will not appear in the old UI; retain the private bucket/metadata. Cleanup work
remains durable and catches up when the new authorized worker is restored.
Do not drop a bucket, purge photos or remove audit/booking guards as rollback.

## Verification

- 393 automated tests passed, zero failed, including 24 new management/media
  tests. PGlite applies the actual pending migration to the complete original
  schema: privileges, restrictive Storage policy, revision protection, tenant
  IDs, transactional rollback on audit failure, schedules, quotas, portrait
  replacement/restore, signup UUID mapping and cascade cleanup. The actual SQL
  also verifies one-time adoption of existing curated photos, append ordering,
  hidden-state preservation on migration reapply and no static-asset cleanup.
- Image tests decode real generated metadata-bearing JPEGs and check oriented,
  metadata-free WebP output, malformed/type-spoofed/oversized input rejection.
  HTTP dependency tests cover verified admin/owner/guest boundaries, private
  image delivery, CSRF/body limits, quota failures, partial signup success and
  exact-key cleanup with provider outage retention. No cloud database used.
- Local browser QA: 390px and 320px compact account/partner/legal headers,
  no horizontal overflow, removed generic notes, styled business sign-in; admin
  fictional profile/service save with exact 10 minutes; business and team file
  selection/previews and optional consent in the five-step fixture. No real
  signup, reservation, business mutation, cloud upload, Google/AI request, email
  or location permission used. Local file tests use an already-public bundled
  business photo, not a new real portrait or external source.
- Final optimized Next.js 16.4.1 build passed (including the existing TypeScript
  phase and 57 prerendered pages). There is no separate lint/typecheck script.
  The compiled local account page was verified at 390px and 320px in BG/EN:
  Home is 44px high, language is 46px overall, their vertical centers coincide
  and the document does not overflow. Partner navigation at 390px has a 10px
  minimum gap between brand and language, with Home/language/menu on one row.
  Terms/privacy have no generic legal-note card; actual policy sections remain.
- Compiled HTTP smoke checks: guest media management and admin detail GET both
  return 401 with private/no-store headers; GET to the PATCH-only content route
  returns 405; `/dev/platform-admin` returns 404 under production mode.
  The local partner data request cannot complete before the required media
  schema/configuration is activated; this is not a successful cloud data test.
  A real Supabase Storage end-to-end test remains gated on owner-approved
  staging setup; local tests do not claim cloud activation.

Proofs: `/tmp/gorez-client-access-polish-20261030.png`,
`/tmp/gorez-admin-photo-editor-local-20261030.png`,
`/tmp/gorez-client-access-compiled-local-20261030.png`,
`/tmp/gorez-terms-no-note-compiled-local-20261030.png`
(local previews, not Production).
