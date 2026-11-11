# Price containment hotfix · 11 November 2026

Scope: shared discovery cards and their details menus only. No changes to
business records, service names, amounts, booking logic or external destinations.
The separate catalogue315 research batch is not part of this release.

## Cause and correction

The late shared stylesheet combined `fit-content(34%)` with `white-space:
nowrap`. The column could shrink while the real price text still painted over
the next card. Kerelski's actual haircut range reproduced the report: a95px
price cell had123px of overflowing content at a390px viewport.

Both home and details menus now have two shrinkable, bounded grid columns.
Price text and its unit wrap normally, with an emergency break for a long
unbroken amount/unit. The actual lower bound, upper bound, currency and
qualifications remain intact. No clipping, ellipsis, hidden prices, invented
amounts, card-wide overflow hiding or removed focus rings were used.

## Executed checks

- Full Node suite:1334/1334 passed,0 failures/skips.
- New containment/SSR coverage:20 tests, including BG/EN, real Kerelski
  ranges, fixed/from/zero/BGN/large values,100-character units, source-linked
  and plain details prices, and the Intl.formatRange-unavailable fallback.
- Catalogue/pricing check:955 records,932 eligible,0 blocked changes.
- Python pricing/extraction tests:8+4 passed.
- Production build:passed,81 pages.
- Browser: actual local non-bookable catalogue fixture at360,390,430,768,
  1280px. Ten neighboring barber cards in BG and EN showed no horizontal
  price/name/unit overflow; Kerelski's full seven-service details menu also
  showed no overflow at all five widths. Complete actual prices remained
  visible. After correction the390px card price cell/client content measured
  118/118px, not95/123px. Mobile result inspected visually.

Browser checks used element/client/scroll geometry and screenshots. Text Range
geometry is not exposed by the available read-only browser API and was not
claimed as executed. Responsive checks are not a physical iPhone Safari test;
the wider fallback formatting was separately tested in actual component SSR.

The fixture disables reservations and uses a synthetic QA location. No real
customer reservations, calls, notifications, database writes or paid-provider
requests were made. The temporary viewport override and owned preview server
were reset/stopped after testing. Publication is recorded separately after its
actual deployment result.
