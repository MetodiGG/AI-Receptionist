# Compact pricing cards — implementation and verification

## Scope and data safety

The existing Next.js application, booking services, owner authentication, photo
rights checks and category vocabulary are retained. No dependency was added.
The repository-backed catalogue is enriched using its existing IDs; the live
owner-managed database was read only. There is no migration, live pricing write,
new account, copied third-party photo/review or paid Google/AI request.

The [audit report](README.md) separates a complete 599-record inventory pass
from the still-incomplete harvest of every possible public menu. Its CSV and
JSON list every record and its outstanding source/currentness/branch issues.
Only reviewed first-party facts from 38 businesses are imported.

## Implementation

- `catalogue-pricing-enrichment.mjs` and `catalogue-policy.mjs`: validated,
  same-ID service enrichment with source dates, independent 90-day fact expiry,
  fixed/from/range prices, literal currency, units and sourced durations.
- `preview.mjs`, `handler.mjs`, `rail.mjs`: at most two representative service
  previews and one cover photo at the HTTP boundary. Full data remains available
  to server-side matching, ranking, budget and availability checks. No Google
  rating-plan/SDK request is needed for free-catalogue partner cards; actual
  GoRez reviews are retained.
- `public-details.mjs` and `api/public/discovery/business/[id]/route.js`: lazy
  full-menu reads with strict IDs, same-site validation, existing rate limits,
  private/no-store responses, published/active checks and public-field
  projection. A suspended profile cannot be opened via a guessed UUID. There is
  one scoped partner read or one optional batched catalogue-photo metadata read,
  not a menu query for every search card.
- `discovery-business-card.js` / `discovery-home.css`: a full-card keyboard
  accessible details trigger; white lowercase photo label; compact two-row
  service preview; existing distance badge; only directions and valid booking
  actions at the bottom. Actions and review links do not trigger the dialog.
- `discovery-business-details.js` / `business-photo-gallery.js`: full grouped
  menu, prices/durations/source links, description, hours, address and contact;
  existing authorized photo gallery with swipe, arrows and enlarged view;
  graceful missing/broken-image fallback, native dialog focus/Escape behavior,
  retry/timeout states and a sticky existing booking/directions footer.
- `site-footer.js`: one shared OpenStreetMap credit and the existing ODbL data
  export. No interactive map's own attribution was removed.
- Guarded development routes provide an offline catalogue review and explicit
  edge-case fixtures. They do not create bookings or call external providers and
  are unavailable in production.

The preceding, separately approved address review also contributes seven exact
OSM points. Its finite request budget and evidence are documented in
[`../catalogue-geocoding/targeted-review-20261106.md`](../catalogue-geocoding/targeted-review-20261106.md).
Unknown distances are not fabricated or replaced by a street label.

## Automated checks

All commands completed successfully on 10 November 2026:

```sh
node --test --test-reporter=spec tests/*.test.mjs
python3 tests/pricing-extraction_test.py
node scripts/check-sofia-catalogue.mjs
pnpm build
git diff --check
```

- **972 Node tests passed**, none failed/skipped.
- **5 Python extraction tests passed**: mixed durations, thousand-separated
  ranges, literal currency, safe links and visible price corroboration.
- The catalogue validator accepts all 595 records and 132 verified points.
- The production build includes compilation and TypeScript validation.
- The project has no separate lint or typecheck script; no linter was installed.

Coverage includes zero/one/two/many services, missing/expired/conflicting prices,
units/from/ranges, long names, owner-protection, source/branch integrity, details
404/rate limit/unpublished records, internal/external/phone booking destinations,
directions, matching, proximity ranking and independent fact expiry.

## Browser checks

Checked the local catalogue and explicit fixtures at 320, 390 and 1280 px widths,
in Bulgarian and English, without accessing a visitor's real location or a paid
provider. Verified:

- no page/dialog horizontal overflow; at most two service previews;
- aligned bottom actions and readable prices, including units and ranges;
- actual catalogue search and lazy full-menu opening (Bobi Yarchev: 47 known
  services, including its existing unpriced generic service);
- photo-label and non-action card clicks, Tab/Shift-Tab focus trapping, Escape,
  focus restoration and body-scroll restoration;
- two existing authorized gallery photos, next/previous, enlargement and nested
  Escape closing only the enlarged photo;
- missing-photo category fallback and a single footer credit.

Local preview booking actions are deliberately disabled. No live reservation,
Production mutation or real Google search was used as a test.

## Performance sample and remaining limits

For an offline synthetic response containing the 15 largest known menus, UTF-8
JSON shrank from **410,823 to 25,297 bytes (94%)** after HTTP compaction. This is
not a measured production latency or a promise of zero lag. Full menus load only
when opened, images remain lazy and only the current details-gallery slide is
mounted. A failed optional photo store does not hide an otherwise valid menu.

Remaining menu research is explicitly recorded in the audit: 83 unavailable or
restricted websites, unvisited relevant pages, PDF/JavaScript/image menus,
branch ambiguity, unit/package scope, stale BGN-only menus and conflicting
facts. No current prices were invented to fill these gaps. Owner placeholders
and the separate Autocomplex RS catalogue/owner pricing conflict require owner
review; their managed records were not changed.

Prepared for review, **not merged into Production**. Production deployment and
any live database change require separate explicit approval.
