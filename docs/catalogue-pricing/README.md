# Pricing audit — 10 November 2026

The full inventory was evaluated before the card redesign: **595 catalogue records + 4 registered profiles = 599**. The four database profiles were read through an authenticated, read-only SELECT. Owner prices, publication states, bookings and customer data were not changed.

This is a completed **inventory-level pass**, **not a claim that all public price menus have been exhaustively harvested**. The per-business report identifies unavailable sites and remaining PDF/JavaScript, branch, package, unit and conflicting-price reviews. Bounded crawling is deliberately not presented as a complete manual inspection of every possible page.

## Results

| Measure | Count |
|---|---:|
| Records evaluated | 599 |
| Valid official-site or owner booking URLs | 596 |
| Records with at least one accessible checked page | 513 |
| Records with price-related signals (not necessarily service prices) | 333 |
| Businesses receiving approved catalogue enrichment | 38 |
| Newly added named service variants | 885 |
| Previously absent prices added | 892 |
| Existing price metadata updated (seat pricing unit) | 1 |
| Existing prices reverified | 6 |
| Total imported price facts | 899 |
| Newly sourced durations | 148 |
| Records whose website was unavailable/restricted | 83 |
| Accessible records with no price signal in checked pages | 182 |
| Non-owner records with price signals but no approved import | 294 |
| Live database writes / migrations / paid requests | 0 |

The audit visited 2,196 pages across 444 hosts. “Price signals” include retail goods and finance offers; these were not misrepresented as appointments. Missing prices remain absent. EUR amounts are literal published EUR figures, not our conversions from BGN. The model can also preserve literal BGN, starting prices, ranges, units and expiry dates. Known old BGN-only menus were held for currentness review.

## Deliverables

- `audit-20261110.csv`: one row for **every** business with its ID, name, site, outcome and unresolved reasons. Open in a spreadsheet and filter the status/issues columns.
- `audit-20261110.json`: machine-readable report, checked URLs and unvisited relevant links, plus the explicit source-review allowlist.
- `../../lib/discovery/catalogue-data/pricing-20261110.json`: approved factual catalogue enrichment; no scraped HTML, third-party images, reviews, accounts or contact-person information.

The existing free catalogue is repository-backed, so its source data is enriched in place using the same IDs. Nothing creates new partner accounts or overwrites the live owner-managed `services` table. The suspended Test GoRez profile remains hidden. Active placeholder/zero-price owner services are flagged for the owner, not deleted or silently priced.

## Reproduction and safeguards

1. `node scripts/export-pricing-inventory.mjs` exports the current static inventory.
2. A read-only registered-profile snapshot can be supplied separately; never commit credentials or customer data. This run used `.audit-work/pricing-20261110/registered.json`.
3. `scripts/audit-business-pricing.py` is an explicit **offline research command**, not a request-time crawler. It respects robots/access failures, bounds requests and rejects action/cart/checkout URLs and private/Google destinations. Inspect its arguments before running. Do not schedule unrestricted crawling.
4. `scripts/extract-pricing-candidates.py --audit .audit-work/pricing-20261110/web` extracts **candidates only** from the ignored local cache. Structured metadata alone is insufficient without visible corroboration. Products, deposits, expired promotions and ambiguous rows are not automatically approved.
5. `node scripts/build-reviewed-catalogue-pricing.mjs` applies the explicit reviewed host/page/branch rules, rejects conflicting duplicates, validates the merge, and regenerates these reports and the enrichment JSON. It makes no network/DB calls. New sources must be reviewed before extending its allowlist.

Raw fetched pages, the database snapshot and research caches stay in ignored `.audit-work/`; they are not needed or shipped to clients. Price facts expire after the existing independent 90-day review period, without hiding the known service. Public details fetch a full menu only when opened; compact search cards receive at most two service previews.
