# Client accounts and refreshed homepage

- `/account?lang=bg|en` supports client registration, password sign-in, email verification, sign-out, upcoming bookings, paginated history, booking details and booking again. An account is optional for booking.
- Uses existing Supabase Auth, not a separate identity/password database. An owner can also use the client area; user metadata never grants ownership or authorization.
- Require Confirm email in Supabase Auth. Add exact production confirmation redirect URLs `https://www.gorez.co/account?lang=bg` and `https://www.gorez.co/account?lang=en`. Keep existing recovery URLs. No wildcard redirects.
- Apply `20261016120000_customer_booking_history.sql` before deployment. It adds an email lookup index, a private mailbox-proof table and a service-role-only read function. No booking backfill or mutation, queue activation or RLS widening.
- The API verifies the current bearer token through Auth, requires a confirmed non-anonymous email, ignores client identity/role metadata, and passes only the server identity to the SQL function. Before first history access it additionally requires a recent Auth-validated email OTP/magic-link AMR, persisted in the RLS-protected, service-only `customer_email_verifications` table. This closes the legacy auto-confirmed-account loophole. Password login alone, user metadata and `email_confirmed_at` alone cannot create that proof. The SQL function independently checks the proof and Auth's current email. Case-insensitive exact equality, not wildcard matching, finds guest bookings with that address across businesses. Changing the email requires a new proof. Shared email addresses share booking history: use a personal mailbox.
- History intentionally excludes internal CRM notes, intake answers, messages, staff notes, other customers' contact details and notification payloads. Its private booking links are bearer capabilities and must not be shared. Responses and the account page use no-store/no-referrer/noindex.
- The development-only `/dev/customer-account` uses fictional in-memory data; production returns 404. Automated tests use an in-memory PostgreSQL database, never live customers or real email.
- No paid AI, email plan, tracking, fake customer testimonials or real partner claims are added. Existing live-email flags and the example business's disabled preference stay unchanged.

## Release verification

- Automated suite: 114 passing tests, including the real PostgreSQL migration, identity isolation, pagination, private-field filtering, sign-in-only email links and the legacy auto-confirmation safeguard. Production build passes.
- Browser QA: BG/EN registration fields, required agreement, upcoming/history cards, private details and rebooking links, interactive category/date/time selection; no horizontal overflow at 320px and 375px. Desktop checked at 1280px. The history browser fixture never contacts Auth or sends mail.
- Production setup: Confirm email enabled, both exact `/account?lang=bg|en` URLs added while retaining recovery URLs, additive migration applied. Read-only SQL verified RLS, denied anon/client table/RPC privileges, allowed server access, zero backfilled proofs and no history for an unproven identity. Example business email preference remains false.
- A real registration + received email + mailbox-link return needs the account holder to enter their own password and open the received link. Do not claim that live roundtrip was tested with the fictional fixture. The first history access deliberately asks for a fresh secure email link, including for legacy accounts.
- During the user's phone test, Auth logged `User repeated signup: request completed` (200), and Resend had no new send. Supabase deliberately returns a non-enumerating response for repeated signup of an already confirmed account. The account screen now explains shared client/owner identity, offers a login-only email link (`shouldCreateUser:false`), and avoids promising that an accepted registration request sent mail. No account was deleted, auto-confirmed or recreated to work around this.

## Image assets

Built-in imagegen generated three fictional editorial scenes. Optimized, locally hosted WebP files are in `public/images/gorez-{salon,barber,garage}.webp`; originals stay in Codex generated images. The homepage explicitly labels the photos and interactive appointment times as illustrative. Its directory uses real published business data.

Prompt set (photorealistic-natural, landscape 3:2, no text/logos/watermarks):

1. Smiling female hairstylist styling an adult woman's hair in a contemporary Bulgarian salon; candid working interaction, warm daylight, cream/sage interiors, realistic skin and hands, premium approachable editorial photography. Include stylist's face, hands and client side profile. All people fictional adults.
2. Smiling male barber giving an adult man a haircut with comb and electric clipper in a neighborhood Bulgarian barbershop; warm daylight, cream walls, forest-green and oak details, candid natural anatomy and believable haircut action. All people fictional adults.
3. Smiling female auto technician in dark-green overalls explaining a diagnostic tablet to an adult male customer next to a stationary car with open hood in a tidy Bulgarian workshop; soft daylight, natural hands/skin, no readable tablet text, premium approachable editorial photography. All people fictional adults.
