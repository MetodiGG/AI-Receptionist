# Sofia catalogue · checkpoint 327 · 11 November 2026

## Status and scope

Prepared in the implementation worktree; this checkpoint is **not a production
publication receipt**. Last verified production remains commit
`8d4220ec521a2a305e8f68dacd17fb8717721921`: 969 source records / 946 eligible.

Current working catalogue: **981 source records / 958 eligible / 23 intentionally
excluded general human clinics**. Compared with checkpoint315: **12 distinct
new premises from 12 independent operators, 91 literal EUR price facts**. No
existing price, business identity, booking destination or review baseline was
silently replaced. No service, teacher, learning mode or unproven second branch
was counted as an additional business.

Against the separate operational654-ID baseline:327 additions,272 premises,
55 mobile operators,1,995 service facts and1,991 current numeric price facts.
The 10,000 verified-business goal is **active and incomplete**, not redefined as
this smaller checkpoint. 569 records have source-reviewed inventories;412 legacy
inventories remain pending detailed pricing review. A catalogue checker passing
is not proof that every legacy menu is fully researched.

## This checkpoint by category, neighborhood and actual venue

| Business | Category | Source-stated neighborhood | Actual customer venue | Prices |
|---|---|---|---|---:|
| MusicRoom | Education | Not confirmed | Христо Ботев129 |6|
| Частна школа Мечтатели | Education | Зона Б-18 | Българска морава94А |25|
| Лингва Лукс | Education | Not confirmed | Пиротска20, ет.2 |2|
| Учебен център · Марин Дринов | Education | Not confirmed | Марин Дринов1, партер, ап.1 |1|
| Б&Е Алармени Системи | Auto repair | Овча купел | Стефан Кънев3 |2|
| Smart Repair · джанти | Auto repair | Not confirmed | Самоковско шосе151 |8|
| Lash Vegas | Beauty | Not confirmed | България53 |19|
| GuitarZone | Education | Not confirmed | Генерал Гурко27 |3|
| Flying Fingers | Education | Not confirmed | Пиротска45 |6|
| Рисуватели | Education | Not confirmed | Оборище73, НЧ Алеко Константинов1897 |2|
| GRADE UP | Education | Not confirmed | Неофит Рилски60, партер |15|
| Alpha Detailing | Detailing | Not confirmed | Батарея55Б |2|

Category totals: education8venues/60fees; auto repair2/10; beauty1/19;
detailing1/2. Neighborhood totals: Зона Б-18 one education venue; Овча купел one
auto-repair venue;10 premises have an actual street address but no source-proven
neighborhood. Streets or administrative districts were not promoted to guessed
neighborhood names. Complete cumulative category/neighborhood counts and dated
price-source URLs are in `neighborhood-expansion-snapshot327-20261111.json`.

All12 new exact GPS points remain unknown. Directions use the actual full postal
address; no neighborhood/city centroid or map viewport is used as a fabricated
pin or kilometer distance. No new geocoder request was made. Current catalogue
still has160 first-party and43 previously reviewed OSM address points.

## Source review and qualifications

Each operator's actual Book/enrollment entry or explicit appointment invitation
was read before importing the relevant owner tariff. Root separately inspected
the retained ordinary HTML fee/contact/condition pages and corroborated accessible
Book entries through the web. Cache misses are not called successful web reads;
the actual retained owner200HTML remains available for replay. Source inventories
are independently fingerprinted; only12 new static review keys were added.

Checkpoint322 verified50 raw receipt hashes/byte lengths. The final five venues
add29 selected own-host raw receipts; held operators' captures are not price
evidence for imported records. Raw sourcepages stay in ignored audit work, not
runtime payloads or published assets. Public records contain independently
phrased service facts and source links, not copied photos, teaching materials,
reviews, source prose or bank/payment account details.

- MusicRoom: literal30EUR/50min single lessons and110/210EUR whole4/8lesson
  packages for piano and solfege;30-day package use, not an invented per-visit
  division. Older cached22EUR snippets are not used.
- Dreamers:25 individual hourly subjects with prepayment and24-hour cancellation.
  Exact academic/astronomical lesson minutes are not stated and not invented.
  Expired2025/26 group tariffs, malformed currency row and unbound115branch held.
  Psychology/logics is explicitly a school subject, not a practitioner profile.
- LinguaLux:17EUR per45-minute academic unit, minimum two units per visit and ten
  prepaid units used within one month;12-hour cancellation. Not a17EUR90min visit.
- Educenter:33EUR per academic-hour individual course request, not a free level
  assessment, animated000BGN counter, started group course or instant booking.
- Alarm installation:FROM47/62EUR; only DRL's explicitly fixed60min is added;
  recorder's1–2hour range remains text, not a guessed fixed slot.
- Smart Repair: eight FROM prices102/120/140/160/180/200/225/255EUR for one wheel,
  face, excluding VAT. Inspection/quote and deductible50EUR/wheel deposit with
  no-show loss retained. Deposit is not a service price. Suspended tyre bookings
  and wheel products are excluded; registered-office apartment is not the studio.
- Lash Vegas: nine distinct styles, placement61.36EUR and maintenance35.75EUR as
  literally printed, plus5.11EUR color-accent addon. Duplicate brown3D style is
  collapsed. Addon is not a standalone set/visit. First-set10% banner is disclosed
  without calculating or promising the reduction; duration/maintenance interval
  remains unconfirmed. Source-stated Mon–Sat09–20 hours, Sunday closed, retained.
- GuitarZone: literal30/150/300EUR for one50min/5×50/11×50. BGN side amounts are
  inconsistent; they are neither imported nor used to convert the explicit EUR.
  Confirmation after payment and one-day cancellation remain visible.
- Flying Fingers: regular20EUR60min, first trial10EUR60min,80EUR whole five-lesson
  five-week packages separately distinguished for guitar/solfege. Actual matching
  booking phone, prepayment/24h cancellation and2.50EUR instrument hire after the
  first two lessons preserved. Different violin phone not inferred compatible.
- Risuvateli:20EUR single two-hour and55EUR whole monthly4×2hour children groups,
  six–12 participants, own sketchbook/watercolors versus supplied special materials.
  Group-reservation model, not an invented individual fee or100EUR adult scope.
- GRADE UP:15 literal individual and per-person two-student tuition/package rows
  from14Sep2026. Individual monthly prepayment minimum and24h cancellation,
  whole monthly package totals and per-person units remain explicit. Ambiguous
  individual “three academic hours=120minutes” row is not normalized/imported.
- Alpha:FROM30EUR ozone/FROM180EUR full interior according to vehicle size and
  condition; actual paid-service phone appointment follows inspection and quote.
  Free inspection form is not a guaranteed paid-treatment calendar. New-client
  10% banner is disclosed, not applied. Header/contact8vs9am conflict means no
  invented opening hours; approximate treatment times are not fixed durations.

## Held cases and source-access limitations

ABI M Auto is not imported: incomplete street address, independently unconfirmed
microsite/premises identity and source-designated OSM marker do not establish an
exact destination. Existing directions prioritize a nonempty address, so adding
that draft would not solve the precision problem. No global address-priority
change, guessed building number or unsupported exact pin was introduced.

TREND is not imported: booking invitation only in metadata/JSON-LD, not explicit
visible saved body, and same-source price/currency conflicts. Client rendering
or owner confirmation is still required, not an arbitrary choice of the cheaper
tariff. Other held sites include explicit commercial/reference access restrictions,
missing numeric tariffs, a non-Sofia venue and a compromised contact destination.
No alternate access route was used to evade those restrictions.

Beauty-v10 research recorded one error: an Auravel root request was grouped with
robots before the reviewer reacted to `Disallow:/`. That body is quarantined,
not parsed, used or imported; no further requests were made. This is a disclosed
research-process error, not a claim of perfect access-policy compliance. The
affected operator contributes zero catalogue records, prices or source facts.

## Executed validation

- Catalogue and pricing checkers: PASS981/958; no blocked new/changed inventories.
- Full Node suite:1361PASS,0fail/skipped, including17 new source/price regressions
  and the existing price-containment tests. Log:
  `/private/tmp/gorez-batch327-tests-20261111.log`.
- Pricing Python tests:4+8PASS.
- Production build:PASS81/81 generated pages. Log:
  `/private/tmp/gorez-batch327-build-20261111.log`.
- Independent read-only checkpoint322 audit: all63 fees/50 receipts and old969
  records/review baseline unchanged. Separate final-five audit:PASS all28fees,
  29receipt hashes/bytes, exact static review identities and deduplication against
  all976prebatch records. Snapshot327 recomputed deepEqual; old969 records,
  old315reviews and historical/operational baseline files remain unchanged.
- Local isolated browser QA: real LinguaLux card/full menu and long units fit
 360/390/430/768/1280 widths (page/rows/prices have no horizontal overflow).
  LashVegas full19-row menu at390px also has no horizontal overflow; source hours
  expand/collapse correctly. Desktop/mobile screenshots visually inspected in
  the tool, no screenshot artifact file saved. Booking actions disabled in this
  explicit dev preview; no live customer booking/call/notification tested or sent.
  Temporary viewport reset and owned local server stopped.

No database migration, partner/customer mutation, paid-provider activation,
source-photo copying, live booking or production publication performed by this
checkpoint. Existing G Point/icon changes and urgent price wrapping are preserved.
