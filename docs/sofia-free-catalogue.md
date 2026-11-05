# Sofia appointment catalogue — local review, 6 November 2026

Status: **implemented locally on `codex/sofia-free-catalogue`; not deployed**. No live migrations, business/contact changes, emails, bookings, Google API requests or paid AI calls were made. Existing live deployments have not been changed or switched off.

## Actual coverage

**203 distinct premises/service providers — 188 additions to the 15-record pilot**, sourced from **127 official website domains**. These are not 203 GoRez partners or necessarily 203 unrelated companies: a chain's separate published premises are separate records. The catalogue contains 176 premises and 27 mobile/service-area providers. All records have a first-party source, specific appointment-service evidence, public contact/booking destination and review dates.

[Complete list of all 203 listings, addresses, sources and reservation actions](./sofia-catalogue-index.md). The actual versioned records are in `lib/discovery/sofia-catalogue.mjs` and `lib/discovery/catalogue-data/*.json`. No empty templates or synthetic businesses.

Primary category counts (sum = 203):

| Existing GoRez category | Records |
| --- | ---: |
| Красота | 52 |
| За дома | 21 |
| Спорт | 20 |
| Автосервиз | 17 |
| Бръснарница | 14 |
| Друга услуга | 14 |
| Груминг | 12 |
| Терапии | 11 |
| Маникюр | 10 |
| Уроци | 10 |
| Консултации | 8 |
| Детайлинг | 7 |
| Фризьор | 4 |
| Автомивка | 3 |

Some objects publish services in additional existing categories: searches can find **15 manicure/pedicure providers, 9 hair providers and 4 appointment car washes**, for example. These are service matches, not extra businesses added to inflate the total.

There are **89 officially linked/onsite booking/signup flows** and **114 published appointment-phone actions**. No phone call was placed and no calendar submission made. A published contact check does not prove telephone reachability, quality, live opening hours, ownership or current appointment availability.

## What the free version changes

- `DISCOVERY_PROVIDER_MODE=catalogue` is the safe default. Old Google/AI flags or credentials cannot silently opt catalogue requests into metered providers. `google` remains an explicit, separate opt-in; unknown mode strings select catalogue.
- Existing Bulgarian/English service/date/location parsing runs deterministically, without model tokens. The existing endpoint, public partner data, authentication, calendars and horizontal mobile-first UI are reused. Catalogue listings do not become claimed accounts or GoRez partners.
- **15 cards per page, not 15 total.** Deliberately scrolling right near the end automatically appends the next page to the same rail; there is no “Още бизнеси” button. Already displayed cards retain their order and scroll position. Changing the query aborts an in-flight page, rejects stale responses and resets the rail to the beginning. A failed page preserves existing cards and offers an explicit error-only retry.
- Initial display, ResizeObserver notifications, resizing and card append alone never fetch more pages. A rightward wheel, swipe/pointer gesture, keyboard advance or Next arrow arms a one-use gate, consumed near the current end. No observer-driven recursive loading of the entire catalogue. Native scrolling stops at the final real card, without clones or a blank tail; Next disables when no page remains.
- **Closest to farthest**, globally before paging, including empty-query city browsing. A permissioned nearby query uses the device point; location-off browsing uses the labelled city-centre point. Unknown coordinates sort last, without fabricated distances. Category interleaving is removed. A partner badge stays visible, but membership breaks distance ties rather than outranking a nearer non-partner.
- Eligibility comes before ranking: correct service, city, requested neighborhood, exact radius and supported preferences. Existing internal availability checks remain bounded; unknown/external slots are never marked available. Booking confirmation still uses the existing booking engine and its conflict checks.
- One **Резервирай час / Book a time** opens a reviewed booking flow; otherwise it opens the published appointment phone. A generic homepage/contact form is not labelled a calendar unless an actual appointment flow is present there. A click is not an appointment confirmation, and external calendars are not synchronised.
- The Google Maps button is an ordinary outbound navigation URL, not a paid API/embed. The visitor's precise origin is not added to that URL.
- No Google ratings, reviews, cached photographs, browser keys or provider plans are returned. Existing first-party GoRez reviews are preserved. All 203 new/catalogue records currently use the existing category artwork: no business photograph was copied or presented as licensed. Same-sized cards keep their footer buttons aligned.

## Source quality and locations

Public facts were reviewed on **5 November 2026**, with approval expiring **3 February 2027** unless reviewed again. Expired/draft/rejected/malformed records fail closed; no script silently renews their review date.

**58 records have usable coordinates published by the business itself** in site structured data or its owner location configuration. The 43 G Point premises were cross-checked against the public location document used by its own booking site: all included points match, and the development “Тест” entry is excluded. Separate booking locations are retained; an additional location without a checked booking-flow entry is not automatically published.

Questionable/coarse structured points (including city-centre-like values), mismatched addresses and obsolete seasonal booking destinations were not promoted to precise locations or current booking links. No Google geocoder/iframe/photo/review data was copied.

The remaining **145 records have no approved precise point**. They are available in manual Sofia/service/verified-neighborhood searches, but not misrepresented as “near you” and not shown with made-up km. The 27 service-area providers have no fake office or Maps destination. A broad service area is not treated as a point.

Default nearby range remains **2 km**, followed in the same rail by the eligible **2–5 km** band as the visitor scrolls right. No additional “further” button is needed. Explicit neighborhoods/radii are never widened. With location off, distances for located premises use the existing city-centre reference labelled “от центъра”; this is not permissioned device location. User coordinates and queries are not persisted by the catalogue.

The existing Автокомплекс РС partner identity was checked through the public GoRez directory on 6 November and mapped by its exact public UUID, matching phone and independently published street address. It is suppressed from catalogue results when that partner is returned even when the owner uses a different address spelling. No live business data was edited.

No ordinary gym admission, self-service-only car washes, home-improvement retail stores, or unverified walk-in laboratory admission were added. Medical/laboratory brand vocabulary is not evidence of a connected calendar. This is a substantial reviewed starting catalogue, **not a claim of complete Sofia coverage**.

## Safe updates

1. Review the official site's exact Sofia premises/service coverage, named appointment service, destination and public contact. A phone, category or HTTP 200 alone is insufficient. Respect source restrictions; do not bypass blocked/throttled content or bulk-copy other directories.
2. Prefer an explicitly linked and inspected booking page; otherwise use the published appointment phone. Do not infer a calendar from a domain or generic enquiry form. A third-party calendar link is allowed when linked by the business; its account/deposit rules remain that provider's.
3. Keep stable IDs, exact existing category IDs and current source URLs. Record `checkedOn` and `validUntil` no more than 90 days apart. Recheck on reports and before expiry, not by extending dates automatically.
4. Only use reliable independently sourced points. Do not use neighborhood centroids or cached Google geocoder results. A service area must have `coordinates: null`.
5. For real photos obtain owner permission or a suitable licence, optimise locally under `public/catalogue-media/`, and record the rights basis/receipt reference. Never commit private permission emails, attachments, credentials or personal correspondence.
6. Duplicate identity requires a manually verified GoRez ID, or published phone **plus** exact premises/site evidence. Names alone do not establish identity; branches with distinct premises stay separate. When an object joins GoRez, record the verified `gorezBusinessId` and review address variants. The current partner database is not overwritten/imported.
7. Corrections, removals and photo permission requests go to info@gorez.co; joining GoRez is not required. Set a rejected status or correct facts after review. Preserve separate outreach/consent statuses; no campaign emails are sent by this feature.
8. Run the offline checker, regressions and build before review. The checker validates schema, approval dates, duplicate contacts/premises and photo asset existence; it does not fetch/renew sources or prove real-time service availability.

This is a version-controlled catalogue, not an unauthenticated upload API or new live database table. No migration/dependency is needed. Admin catalogue editing, automated source-change monitoring, independently licensed geocoding and expansion beyond Sofia remain follow-up work; they are not represented as complete.

## Local review

```sh
pnpm catalogue:check
pnpm test
pnpm build
DISCOVERY_ENABLED=true DISCOVERY_DEV_MOCK=true DISCOVERY_PROVIDER_MODE=catalogue pnpm dev --hostname 127.0.0.1 --port 3037
```

Open `/dev/sofia-catalogue?lang=bg` for the sourced records without database/Google/model calls, with booking/navigation controls disabled. `?lang=en&case=nearby` uses an explicitly labelled **synthetic QA point**, not OS location. These fixture routes return 404 in Production and Vercel Preview. The QA server was stopped after testing.

## Verification

- Offline check: **203 valid/current records**, **127 website domains**, **58 first-party location points**, 89 booking-flow and 114 phone actions; no borrowed business photos.
- Automated regression suite: **853 passed, 0 failed**, including the existing 172-scenario search corpus, booking/auth/security tests, and new catalogue/pagination/gesture-gate cases.
- Tests retrieve every eligible record over bounded pages, deduplicate updates, reject stale/different queries and looping cursors, preserve strict service/radius/quarter filtering, handle partner database outages/changed slots, enforce same-site/rate/offset validation and keep Google pagination/endpoints closed.
- 100 concurrent dependency-isolated catalogue searches invoke no Google/model/provider budget. This is not a public infrastructure load test.
- Production build succeeds; no separate lint/typecheck scripts exist in the project. `git diff --check` passes.
- Browser review: Bulgarian/English, desktop 1280×720 and mobile 390×844; no real location permission or provider calls. All **203 cards** were reached through 14 bounded pages; the final rail reached `scrollLeft = max = 59402` and disabled Next, without a blank tail.
- A deliberate native horizontal wheel scroll appends one page of 15; subsequent resize/append does not cascade into the whole catalogue. Keyboard End reaches each next page, and old card names/order remain stable. Switching to the auto-service category resets the rail to 0 and reaches all **17** matching records. Mobile manicure controls are 136.4 px wide without text overflow; cards share the same footer baseline. Page width equals viewport at both sizes. This is browser viewport testing, not physical iPhone touch testing.
- The synthetic nearby case starts with nine eligible cards within 2 km followed by its farther band in increasing distance order (0.1, 0.1, 0.2, 0.7 … 3 km on the initial page). Turning location off resets the list and returns city-centre labels. Unknown coordinates are not invented.
- Local screenshots: `/tmp/gorez-distance-scroll-desktop.jpg` and `/tmp/gorez-distance-scroll-mobile.jpg`. Customer-facing technical no-Google/AI search wording was removed; local safety/test labels remain.

## Production boundary and cost

**Not deployed.** Activate only after owner approval, by deploying this reviewed branch with `DISCOVERY_PROVIDER_MODE=catalogue` and `DISCOVERY_ENABLED=true`. Optional `DISCOVERY_MAX_RESULTS=15` controls the page size. `DISCOVERY_CATALOGUE_REQUESTS_PER_MINUTE=30` controls abuse limits (0–120; invalid values fail closed); same-site validation, bounded JSON and durable per-IP limiting remain. There is no per-search Google/AI charge in catalogue mode.

Hosting, requests, database/rate-limit storage, bandwidth and transactional emails retain their provider quotas/prices; this is not unlimited infrastructure at €0. No paid service or subscription is activated.

To stop old Google billing exposure, the owner must separately review old keys/access and Preview/Production deployments that may still issue Google calls. Deploying a flag does not revoke a browser key in an older deployment. No shared keys, IAM grants or Google quotas were changed. Only Google Cloud Billing can establish whether previous usage was billed.
