# Required email for new bookings

- Email is required and labelled `Имейл *` / `Email *` in the public form, guided-chat details and owner manual booking form, including embedded booking pages.
- Shared server-side `bookingCustomerSchema` rejects omitted, null, blank, whitespace-only, malformed and overlong email values. Leading/trailing spaces are trimmed. A valid-looking address is not proof that the mailbox exists or belongs to the client; no verification email is sent.
- Guided review displays the submitted email so the client can catch a typo before confirming.
- Existing clients and bookings are not rewritten. Nullable customer email remains necessary for pre-booking chat visitors, legacy records and client erasure; no database migration is needed.
- Collecting an email does not enable delivery. `EMAIL_NOTIFICATIONS_ENABLED` and provider configuration are unchanged; email/SMS/Viber remain off. No paid service, AI model or plan is activated.
- Added four contact-validation tests (74 tests in the complete suite); build, diff and live-script syntax checks passed. The opt-in live regression covers rejected emails through all three booking paths and successful bookings with fictional addresses, with notifications disabled and test-data cleanup.
