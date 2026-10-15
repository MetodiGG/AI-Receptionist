# Self-service owner account deletion

Settings → Account / Настройки → Акаунт now offers permanent deletion, separate from client anonymisation or archiving an individual service. It removes the sign-in identity and **all** businesses owned by that identity, not just the currently displayed business. The warning lists every owned business and counts future active bookings. Owners can switch to Data to export before continuing; clients are not automatically notified.

## Safeguards

- Server-verified bearer authentication; owner ID is never accepted from the body.
- Read-only, private/no-store summary, paginated across all owned businesses.
- Fresh password reauthentication using a non-persistent, isolated Supabase client. The password is sent only to Supabase Auth and is not included in the GoRez deletion request, URL, storage or logs.
- The server checks the verified token's password AMR timestamp (five minutes). A refreshed token with an old password authentication does not pass. MFA-enrolled accounts fail closed rather than downgrading their protection.
- Exact `DELETE` phrase, explicit acknowledgement, same-origin browser requests, strict input validation, owned-business anchor and rate limiting.
- Server-only `auth.admin.deleteUser(verifiedUser.id, false)`; no separate pre-deletion of business rows. Existing database cascades remove the businesses and their dependent data in the Auth deletion transaction. Upstream failure is not shown as success.
- Local sign-out and homepage return after success. Deleted identities cannot log in or refresh; owner APIs revalidate the user with Auth rather than trusting a cached browser session. Stateless JWTs can remain cryptographically valid until expiry, but the owned rows are gone.
- Keyboard focus, Escape/Cancel, disabled incomplete submission, cleared password on errors, responsive BG/EN warning and loading/error/success states.

## Verification

`tests/account-deletion.test.mjs` covers authentication, fresh/stale AMR, foreign owners, forged target IDs, exact confirmation, cross-site requests, MFA downgrade, rate limits, failure handling, private responses, pagination and client/server separation. The full suite has 70 tests. The actual component has a development-only fixture at `/dev/account-deletion`; production must return 404 for it.

The opt-in `scripts/pilot-e2e.mjs` additionally creates only fictional QA identities and businesses, checks account ownership and warning counts, then exercises hard Auth deletion including a second business for the same owner, old booking links, failed subsequent sign-in/refresh and another owner's continued access. Successful runs remove their newly generated Auth identities as well as business data; failures clean up the test business rows and report retained QA identities. It never targets existing accounts.

## Limitations

This is permanent deletion from the live application, not a remote erasure of exported files or instant purging of provider backups/logs. Any future user-owned Storage uploads, subscriptions or additional account-linked tables need lifecycle handling and a new regression test before release. The current application has no such upload or billing integration. Existing QA accounts from earlier runs are not retroactively deleted. No email/AI/payment provider or paid plan is enabled.

Official API references: [Supabase deleteUser](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser), [managing user data and deletion/session limitations](https://supabase.com/docs/guides/auth/managing-user-data#deleting-users).
