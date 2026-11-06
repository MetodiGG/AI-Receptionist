# Catalogue cover photos

## Administrator workflow

Open the GoRez admin panel, select **Каталог**, then search by name, neighbourhood
or service, or filter by the existing GoRez category. This section contains
non-partner catalogue listings; partner photos are still managed in **Бизнеси**.

Choose **Добави снимка** / **Управлявай снимката**, select a photo, enter a short
permission reference (for example, the business's permission email date), and
confirm permission to publish. An optional description supplies accessible alt
text. **Запази основната снимка** publishes one cover photo for that listing.
The next search or page refresh displays it without another code deployment.
Replacing it requires a new permission confirmation. Removing it restores the
existing category illustration. No business account or partnership is created.

Do not paste private correspondence into the permission reference. Store the
original permission receipt separately. Public search/image responses never
return this reference or the audit history. Use photos the business supplied or
otherwise explicitly authorised, including permission from people pictured;
public visibility on Google is not a photo licence.

## Safety and storage

- Verified platform-admin authentication and the existing admin allowlist are
  required for every management request. Business owners and anonymous visitors
  cannot mutate catalogue media. Same-origin checks, request-body validation and
  write/read rate limits remain server-side.
- The existing browser photo processor accepts ordinary large phone photos
  (up to its existing 50 MB original-file limit), resizes before transmission,
  and reports unsupported formats. The server decodes the actual image, strips
  embedded metadata, and produces WebP up to 2000 px and 1 MB. Originals are not
  uploaded or retained.
- There is one cover photo per listing, not a gallery. A shared 128 MB catalogue
  cap includes active photos and private objects awaiting cleanup. It does not
  change the partner media allowance or any provider plan.
- Objects use the existing private `business-media` bucket under exact
  `catalogue/<stable-listing-id>/<random-uuid>.webp` keys. No public bucket,
  browser Storage credential, arbitrary remote image URL or signed URL is
  introduced. The image route serves only the current approved listing photo.
- Optimistic revisions prevent a second browser tab from silently overwriting
  an edit. An audit snapshot is private. Old/replaced and abandoned uploads are
  queued for exact-object cleanup after at least one day by the existing
  secret-authenticated maintenance cron. No new scheduler is enabled. There is
  no admin restore button; removed media URLs stop serving immediately.
- A catalogue media read failure leaves ordinary search operational with the
  existing category artwork. Expired/unapproved listings cannot gain public
  visibility by receiving a photo. Catalogue facts, booking links, partner
  profiles, customer records and appointments are unchanged.

## Migration and deployment

The owner explicitly approved `20261106100000_catalogue_photos` and publication
after tests on 6 November 2026. The migration was applied successfully to
Production after the owner completed Supabase sign-in. Apply only that migration to the verified
Production project after checking that `business-media` exists and is private.
It adds three service-role-only RLS tables and two restricted RPCs. Do not run a
full baseline or staging bootstrap against Production. The staging bootstrap
still lists this migration as pending separate staging approval.

No new environment variables, dependencies, Google/AI calls, subscriptions or
paid services are required. Storage, delivery bandwidth and function/database
requests consume the existing infrastructure allowances; this is not unlimited
free hosting. Production application should precede the matching application
release. Rolling the application back leaves these additive, private tables
intact; do not drop them or delete media as part of a routine rollback.

## Verification

```sh
pnpm test
pnpm build
DISCOVERY_DEV_MOCK=true DISCOVERY_PROVIDER_MODE=catalogue pnpm dev --hostname 127.0.0.1 --port 3037
```

Open `/dev/catalogue-admin?lang=bg` (or `en`) for clearly labelled fictional,
browser-only fixtures. This route returns 404 outside explicit local development
mock mode. It is not evidence of a successful Production upload.

Automated coverage includes admin/role/origin/rate gates; bounded multipart and
JSON bodies; real image decoding/metadata removal; permission validation;
optimistic conflicts; atomic database audit changes and rollback; the 128 MB cap
including orphan objects; lost commit-response reconciliation; current versus
stale image URLs; cleanup namespace isolation; and bounded public-search photo
attachment with outage fallback. The complete suite has 879 passing tests,
including four additional rail-rendering performance regressions.

Local browser checks exercised a 25.8 MB synthetic JPEG, replacement, removal,
category filtering, Bulgarian/English labels and the narrow mobile layout. No
real business photograph, customer data, reservation or paid-provider request
was used in those checks. A first live upload requires an actually authorised
photo supplied by the administrator; no invented permission is used for release
testing.
