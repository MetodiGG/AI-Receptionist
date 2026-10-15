# Business password recovery

The login form links to `/forgot-password?lang=bg` (or `en`). This requests a recovery email through Supabase Auth, not the appointment notification outbox or Resend API. No subscription is purchased or enabled by this change.

## Deployment requirements

1. Set Supabase Authentication → URL Configuration → Site URL to the stable production origin (`https://ai-receptionist-beta-six.vercel.app` until GoRez's domain is purchased and connected).
2. Preserve existing allowed redirects and add both exact URLs:
   - `https://ai-receptionist-beta-six.vercel.app/reset-password?lang=bg`
   - `https://ai-receptionist-beta-six.vercel.app/reset-password?lang=en`
3. Keep the Reset Password email template pointing at `{{ .ConfirmationURL }}`. This implementation uses Supabase's default implicit email callback, not a PKCE `code` callback or a custom token-hash template.
4. Configure a verified SMTP sender in Supabase Auth before onboarding external businesses. Supabase's built-in mailer only sends to project team addresses and has a very low quota. Receiving an HTTP 202 is not proof of delivery, and the UI deliberately does not claim otherwise. SMTP is separate from `EMAIL_NOTIFICATIONS_ENABLED`, which remains unchanged.
5. Update `NEXT_PUBLIC_APP_URL` and the exact allowed redirects together when connecting the new domain. Do not allow arbitrary preview origins or caller-supplied recovery redirects.

## Safety and verification

- Five recovery requests per IP fingerprint per 15 minutes (rotating User-Agent does not bypass this), plus Supabase's own mail limits and a 60-second client cooldown.
- Same-origin JSON requests only; normalized valid email; no address lookup or user list; generic account-specific response. Provider failures and global quotas show safe error messages.
- The reset page removes tokens from the address bar before making an Auth request, disables referrers and indexing, and stores the recovery session only in memory. A saved normal login alone never enables the form. Reloading requires opening a fresh email link.
- Expired, missing, malformed and rejected tokens show a new-link action. New password confirmation, 8–128 character validation, and safe provider errors are included in BG/EN.
- Passwords go directly to Supabase Auth's `updateUser`, never to an application endpoint, logs, database tables or browser storage. Successful reset asks for a new login and signs out recovery sessions.
- `pnpm test` covers request validation, abuse controls, private responses, token cleanup, failed recovery, password validation and translation parity. `pnpm build` checks both routes.
- Delivery still needs an end-to-end test with an approved controlled mailbox after SMTP and redirect configuration. Do not reset a real owner's password for QA.

References: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail and https://supabase.com/docs/guides/auth/auth-smtp
