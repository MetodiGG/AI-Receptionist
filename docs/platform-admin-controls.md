# Platform business controls

## Scope

- `/admin?lang=bg` and `?lang=en`: business directory, application pipeline and latest 100 moderation events.
- Search by business name, slug, city or business contact email. Filter published, unpublished, suspended or trash.
- Details show services, staff and exact customer/booking/upcoming counts; no customer CRM records are returned.
- Publish, suspend, move to trash, restore and permanent deletion, with a reason and exact slug confirmation.
- Ordinary application status `active` is displayed as **Completed lead**, not a claim of business publication. Applications still do not create accounts or profiles. Owners use the existing business setup flow.
- Application cards show name, category, city, contact person, phone and email. Direct **Approve / Reject** buttons open an explicit confirmation. Approval uses the existing `onboarding` status (**Approved · setup needed**); rejection uses `declined`. No migration, new permissions, automatic account/profile creation, publication or email is introduced. Internal notes and advanced status editing are collapsed under Details. Decisions remain reversible there.
- Applications are grouped as To review / Approved / Rejected / Completed; pending requests sort first. Saved statuses update only after the server acknowledges them. Status-only decisions preserve internal notes. Conditional `updated_at` updates reject stale tabs with `409 LEAD_CHANGED`, instead of overwriting a newer decision. Edits are kept as drafts until saved; direct decisions are disabled for unsaved drafts.
- Administrator links are shown after a server-side role check on the home page, client account and owner navigation. No allowlist is bundled in browser JavaScript.
- Guests on `/admin` see an explicit sign-in prompt, not a silent homepage redirect. The client account remembers only a fixed `admin` return intent, never an arbitrary return URL. Email links keep the existing exact allowlisted callback URLs; cross-device email-link users may use the visible Admin panel link after signing in.

## Security and data lifecycle

- Every privileged route validates the current Supabase Auth user, verified email, non-anonymous identity and server `PLATFORM_ADMIN_EMAILS` allowlist. UI visibility is not an authorization boundary.
- Read and write responses use `private, no-store`, no-referrer and noindex. Mutations reject cross-site origins, validate strict bodies, rate-limit by administrator ID and use the server-verified actor ID.
- Migration `20261016160000_platform_business_controls.sql` adds moderation fields and an RLS-enabled audit table. It does not change existing business visibility, bookings, customer data or email flags.
- The service-role-only RPC locks the exact business, checks an optimistic revision and current slug, then commits audit and action in one transaction. Deletion failure rolls the audit back; audit failure rolls the action back.
- Owners cannot alter moderation fields through the Data API. A final database trigger prevents direct or racing new bookings for hidden businesses; normal completion/cancellation of existing visits remains possible.
- **Suspend:** hides public listing, page, chat and availability and blocks new bookings. Does not cancel visits or suppress existing-visit emails.
- **Trash:** same public restrictions; preserves records and appointments. Invalidates queued/in-flight delivery claims. The worker also rechecks archived status before sending. A provider request already sent cannot be recalled.
- **Restore:** returns to suspended, never automatically republishes or replays old mail.
- **Permanent delete:** only from trash, zero upcoming booked/confirmed appointments, recent password AMR (5 minutes), strict confirmation and acknowledgement. An isolated password reauthentication client is used. Passwords never enter the app API, audit log or persisted app state. Enrolled MFA blocks this password-only destructive path rather than downgrading security; trash remains available.
- Deletion removes only the selected business and its existing FK dependants. It never calls Auth `deleteUser` and preserves the owner's account and other businesses. Audit uses a non-FK business ID and survives deletion. Provider backup retention is not overridden.
- No management action is performed automatically against existing businesses during release or tests.

## Verification and release

Local verification on 2026-10-16: 130 passing tests, successful production build, production preview 404, guest access/detail/action APIs 401. BG/EN browser QA at 1280px, 375px and 320px; no horizontal overflow. Search, visibility filter, wrong-slug disabled confirmation, trash, restore-as-suspended, explicit guest sign-in path and upcoming-booking deletion block were checked. UI mutations used fictional preview data only; database mutation tests ran only in in-memory PGlite.

Application decision follow-up: 137 passing tests and production build. Fictional local UI checks covered Approve confirmation, Reject confirmation, saved status/filter counts, note preservation after approval, unsaved draft protection, reopening a rejected application and empty filtered results. BG/EN at 1280px, 375px and 320px, including the expanded editor and confirmation, had no horizontal overflow. No production decision or test email was used.

1. Run `node --test tests/*.test.mjs` and the production Next build.
2. PGlite tests execute the actual migration/RPC in memory, without a production connection. Test roles, revision/slug mismatch, setup checks, booking guards, queue invalidation, restoration, upcoming-blocked deletion, tenant/Auth preservation and rollback on audit failure.
3. Local-only `/dev/platform-admin` uses fictional records and no email/API writes. It returns 404 in production. Check desktop/mobile, BG/EN, search/filter, modal confirmation, keyboard handling, trash and restoration.
4. Obtain action-time approval before enabling new production administrator mutation permissions. Apply the additive migration first, then deploy the matching code. Keep current admin allowlist and notification secrets/flags unchanged.
5. Verify guest endpoints reject access and use an authenticated allowlisted session for read-only live checks. Do not test deletion, suspension, publication or archive on real businesses without a specific target and confirmation.

Rollback: redeploy prior application code. Do not drop moderation fields or their guards to undo a moderation decision; use the explicit restore/publish actions. A prior app version does not understand moderation filtering, so roll back application code only before live moderation actions are enabled, or keep public booking routes on the new version.
