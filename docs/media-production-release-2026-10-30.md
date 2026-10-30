# Business media and partner priority — Production release, 30 October 2026

This supersedes the pending/local-only activation status in the earlier media,
category-art and partner-priority notes. The review email end-to-end test is
still separate and incomplete; do not describe it as verified.

## Authorization / unchanged costs and credentials

Owner approved staging then Production media activation with no paid purchase,
and subsequently explicitly requested publication. Existing Supabase Free and
Vercel Hobby plans were retained. No Google query, quota change, paid AI,
subscription purchase, environment change, key disclosure, new email or real
customer/appointment edit was performed. Existing independently metered Google
usage and Hobby commercial-use restrictions are not removed by this release.

## Applied and verified

- Exact additive media migration applied to staging `dbvsfxkmljrwjberwodb`.
  Three media/audit/cleanup tables have RLS, browser roles cannot directly read
  media or execute mutation RPCs, and the private WebP bucket has a 1 MiB limit
  and restrictive Storage policy.
- Controlled Dashboard upload of the generated non-personal
  `public/category-art/barber-v1.webp` succeeded in staging only (13,580 bytes).
  The file was opened in authenticated Storage preview. It remains at
  `business-media/barber-v1.webp` as an explicitly documented operator test
  object, not application media metadata. No real business gallery was changed.
  Anonymous public-object access was denied: HTTP 400 / NoSuchBucket. This is
  a Storage smoke test, not a positive owner-upload/API/session end-to-end test.
- Pushed `ac5bf32` to `codex/ai-business-search`. Protected Preview deployment
  `CLJnFEsauJBQzrhpq6gsheYX36ZG` Ready (34s), source verified. Browser homepage
  and the empty staging partner directory loaded without a data/schema error.
  Unauthenticated CLI access returns Vercel Authentication 302.
- Applied the same migration to Production `ilpdtvbymxqgimrboyvh`. A temporary,
  session-local hash snapshot and in-transaction assertion verified unchanged
  customer and appointment rows before commit. No permanent snapshot table or
  broad policy was created. Postflight counts remain 3 businesses, 4 customers,
  1 appointment; 3 protected media tables, 2 adopted existing Vesi gallery
  records, 1 restrictive Storage policy and 1 active existing email scheduler.
- Fast-forwarded main from `e9dd36d` to `ac5bf32`; no history rewrite.
  Production deployment **BPtrTbBewYD5npxsvwJ9uXSB7JM2**, Ready/Current (34s),
  assigned `www.gorez.co` and
  `ai-receptionist-sg88tcd9b-ai-receptionist12.vercel.app`.
- Public home/partners/account/terms and directory API returned 200. Directory
  contains exactly Zen Barbershop (5 services) and Vesi Studio (2 services,
  2 photos); suspended Test GoRez remains absent. Guest admin detail and media
  management APIs return 401; dev category fixture returns 404. Barber artwork
  returns image/webp, 13,580 bytes.
- Actual live BG mobile check at 390px: document width 390px, all four homepage
  illustrations loaded; partner cards use barber/nails art and retain Vesi's
  real gallery. Temporary viewport reset. No live Google/AI search was issued.
- Existing verification for this exact code: 410 tests passed, optimized build
  and TypeScript phase passed. Preview and Production cloud builds passed.

Proof: `/tmp/gorez-release-home-live-mobile-20261030.png`,
`/tmp/gorez-release-partners-live-mobile-20261030.png`,
`/tmp/gorez-staging-private-upload-20261030.png`.

## Review email test boundary

Owner authorized a clearly labelled full test only to `info@gorez.co`. Existing
27 October template-only diagnostic was found in that mailbox's Inbox in Titan;
its button opens the homepage, not a real review credential. No new test email
or fake review was sent/submitted in this release.

Read-only Vercel search shows `RESEND_API_KEY` is **Production-only**. Preview
does not have a sending key. It was not revealed, copied, broadened or enabled.
Use a separately approved restricted Preview sender configuration and isolated
staging fixtures for the remaining completion → worker → actual email → one-use
review form test. Do not publish a fictional test business/review in Production
or enable the owner's suspended test account to make this test pass.

Authenticated admin/owner live edit/upload, full new-owner signup with photos,
and the complete review invitation transaction remain unverified. Their offline
tests and the Storage smoke test are not substitutes for those live scenarios.
