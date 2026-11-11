# Complete service names · 11 November 2026

Follow-up to the price-containment and compact-card fixes. Scope: public
service rows, details menus, directory, profile and booking/assistant summaries.
No catalogue records, prices, identifiers, booking callbacks or APIs changed.

## Correction

The old bounded price grid reserved42% even for a short price. Combined with
`overflow-wrap:anywhere`, this left too little room beside the thumbnail and
split ordinary Bulgarian words such as „подстригване“ before their final letter.

Service rows now wrap as flex items. The name/photo group retains its natural
minimum word width; the complete price moves down when it cannot fit beside
that group. Text uses normal word boundaries, manual hyphenation and an
emergency `break-word` fallback only for a single token wider than the whole
available name area. Prices retain their existing full amounts, currencies,
ranges, from-prices, units and source links; they are never hidden or ellipsized.

Single-column grid wrappers use `minmax(0,1fr)` and shrinkable children so an
extreme unspaced token cannot expand an implicit grid track. The native profile
uses its existing760px breakpoint to place actions below the name on narrow
screens. Images and44px service-booking targets remain intact.

## Executed checks

- Full final Node suite:1447/1447 passed; no failures or skips.
- New regression file:13 tests covering full names, unchanged identifiers,
  actual component SSR, BG/EN formatting, safe local fixtures and CSS contracts.
- Python pricing tests:8+4 passed. Initial unittest discovery matched no files;
  both real test scripts were then executed directly successfully.
- Catalogue/pricing check passed:981 records,958 approved,23 deliberately
  excluded; no newly blocked listings. No catalogue acquisition was resumed.
- Production build passed;83 static pages generated.
- Temporary localhost production server: `/dev/service-text?lang=bg&stress=1`
  returned404; the preview is not publicly available in production mode.
- Actual browser geometry at360,390,430,768 and1280px in BG and EN: no page,
  row or service-list horizontal overflow. Checked ordinary names and stress
  cases with256-character unspaced names, full large ranges and long units.
- Actual details menus, home cards, native service lists and directory use
  production components in `/dev/service-text`. Assistant and selected-service
  examples are explicitly labelled CSS-only static markup, not live bookings.
- The development route is guarded with `notFound()` outside development and
  `noindex`. Fixture businesses, IDs and prices are fictional; outgoing booking,
  calls, notifications, provider requests and form submission are disabled.

Proof artifacts are in the thread's `service-text-qa-20261111` directory:
`details-bg-390.jpg`, `profile-en-1280.jpg` and `browser-checks.json`.
Screenshots were inspected visually. Text Range line geometry is not exposed
by the browser API and is not claimed as tested. This is not a physical iPhone
Safari test. No real booking or production mutation was performed.

The temporary browser viewport was reset, owned preview tab closed and owned
development server stopped. Changes are implemented locally, not deployed.
