# Client-first discovery and direct business applications

## Changes

- One lower homepage business CTA. Hero is client-only: native service, city/town and neighbourhood dropdowns, with dependent choices from published businesses.
- Shared directory loading, honest empty/error states and working service/location filters. No fabricated listings.
- Existing ten-second booking film gains restrained depth/material shadows, without player controls. Reduced-motion behavior remains.
- `/for-businesses` opens the five existing setup steps immediately. Business profile, services, team, hours and breaks are submitted together for final platform approval.
- New business Auth accounts are created server-side without sending a verification email. They remain unconfirmed until a verified platform administrator approves the application. No global Auth, SMTP, customer verification or email-history proof setting is changed.
- Existing verified users can apply using their own authenticated identity. Anonymous requests cannot attach an existing account, alter passwords or claim a reserved administrator address. Application-created identities cannot become platform administrators by email allowlist alone.
- SQL stores the prepared business and linked request atomically. Approval publishes through the existing audited business action. Rejection preserves the data and hides a published linked profile. Legacy contact-only leads keep their previous setup workflow.
- Owner calendar has Day/Week/List selection, expandable filters and date dropdowns. Mobile day appointments are readable cards; week is a vertical agenda. Manual/reschedule dates, service durations, opening times and breaks use selectors.
- Next.js patched from 16.4.0 to 16.4.1 for the October 14 upstream security release: https://nextjs.org/blog/nextjs-security-update-october-14-2026

## Deployment order and data safety

Apply `20261025120000_direct_business_applications.sql` before publishing. It adds optional request columns and service-role-only functions; existing visibility and booking data are unchanged. Pre/post production read-only count and visibility-digest checks were equal. Public and ordinary authenticated roles cannot execute submission or approval RPCs directly.

Public submissions pass strict schema validation, same-origin checks, an IP rate limit and a honeypot. Passwords go only to Auth and never enter application records, logs or notifications. Failure cleanup checks for a committed business before removing a transient identity, protecting against a lost RPC response.

## Verification

- Node test suite including PGlite transactions, rollback, approval/rejection, stale decisions, direct-publication synchronization and public/owner privilege rejection.
- Production build on patched Next.js.
- Local mobile checks for cascading dropdowns, calendar filtering/date/week/list, BG/EN, five setup steps and a retained 45-minute service / 12:00–13:00 lunch.
- No real bookings, existing-customer emails, account changes or real application approvals are created by QA.
- Production smoke checks should cover homepage, five-step entry, public directory/availability, unauthenticated admin denial, invalid submission validation, and production 404 for local QA fixtures.

The browser/SQL boundary and Auth service are separate transactions. If Auth activation succeeds but SQL publication fails, the business remains private; the admin sees an error and can retry. Publication always requires a platform administrator. Customer booking history still requires its independent mailbox-link proof.
