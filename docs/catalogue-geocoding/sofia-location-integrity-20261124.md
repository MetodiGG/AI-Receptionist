# Sofia navigation and location audit · 24 November 2026

## Findings

The old directions helper sent most listings to Google Maps using their display address as a free-text destination. That helper **preserved** the reported suffix in a controlled replay, but a free-text query did not require Google to match the building exactly. The distance badge and map could use a different stored point. Imported/cache and public-profile paths also needed a single current-address check; an otherwise reasonable point does not prove the identity of a branch. No provider reply or screenshot from the reported click was captured, so the cause of that particular misroute cannot be asserted. The new resolver rejects unbound points and identifiers and does not use ambiguous address searches as directions. Unresolved addresses remain readable and copyable.

The coverage gate is **Sofia city, EKATTE 68134** ([NSI EKATTE](https://www.nsi.bg/nrnm/ekatte/territorial-units)). Sofia Province and the other settlements in the municipality are not Sofia city. [GIS Sofia land boundaries](https://urbandata.sofia.bg/dataset/zeml_sofia-zip) provide a negative test for selected known separate settlements, not a positive proof for any point inside the surrounding rectangle. Five existing points fall in separate settlements despite a Sofia address claim; another five fall inside a boundary-review band. They are conflicts, not permission to change the business's city or erase its street address. No point was moved to a centre or invented, and no partner was reapproved or demoted. Confirmed regional entries remain stored and retain their direct booking paths.

### Exact case: бул. Сливница 178Е, София

1. No exact Cyrillic `178Е` or Latin `178E` was found in the complete checked-in runtime catalogue or in the live published native directory. There are two separately identified branches at **178 without a suffix**, not at 178Е.
2. [SIMDA’s official contacts](https://www.simda.bg/%D0%BA%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/) name the building at **бул. Сливница 178**, with access by the Lions Bridge bus stop. [Ах Хорца’s official schedule and venues](https://ax-horca.com/) list their **Лъвов мост** hall at **бул. Сливница 178**; [MultiSport’s listing for the same named hall](https://locations.mymultisport.bg/location/ah-hortsa-lavov-most) repeats that address. Those names are not interchangeable business records.
3. The owner-supplied copy of the [municipal address register](https://urbandata.sofia.bg/dataset/address_sofia-zip), CSV SHA-256 `0cd8c9d19996c0654707f711cb8d559a23e0a95148d4b8c6016aad76de2140ef`, returned Sofia/Оборище row **49666** at **178**, civic point **42.704331, 23.325092**. It returned neither suffix for that boulevard. This is evidence of the existing civic point for 178, not proof 178Е does not exist or is the same place.
4. Both currently identified **178** branches resolve to the same reviewed civic building position via separate branch bindings. **178Е remains unresolved and no point was assigned.** For the exact reported case, obtain a GoRez profile link or the branch's business name plus its current address/directions evidence, then review that exact branch. Tests preserve the digit/letter string, keep Cyrillic and Latin variants distinct, reject an old place ID/nearby branch point, and do not equate a street with the boulevard.

### Accessible snapshot and disposition

The local inventory includes every current checked-in Sofia and regional listing, including records not now eligible for publication. The remote portion is the complete **published native directory returned by the live public endpoint** (HTTP 200, 24 Nov, 20:28:45 UTC); the endpoint reads all public rows in pages before returning JSON. No privileged GoRez/Supabase production connection, archived or pending production records, plugin admin credentials, production place-link table, or customer data were accessed. No live Nominatim geocoding, batch geocoder or paid service was used. The previously approved server-side registration path is versioned and cached; it does not autocomplete addresses, run on viewing directions or geocode the catalogue. See the [OSMF public Nominatim restrictions](https://operations.osmfoundation.org/policies/nominatim/).

| Scope | Examined | Eligible precise/independently reviewed destination | Point conflicts | Other unverified | Missing visit address | Outside Sofia | No customer-visit premise |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Tracked catalogue | 1,801 | 1,012 | 10 | 582 | 0 | 5 | 192 |
| Live published native | 8 | 6 | 0 | 1 | 0 | 1 | 0 |
| Total | **1,809** | **1,018** | **10** | **583** | **0** | **6** | **192** |

This is how the audited version treats previously recorded evidence, not 1,018 new field verifications. It includes exact address-bound reviewed points and a small number of independently reviewed owner map destinations. Review queue: **593**, of which **575** otherwise eligible/published. Records already confirmed outside Sofia are separately included in the review export for an administrator to confirm scope; they are not counted as awaiting address review. The native location still requiring evidence is **ЕлектроMAX**: the public branch says `ул. Булина ливада 7`; the checked municipal snapshot lists other numbers on that street, so neither that existing pin nor a nearby number proves №7. Neither the partnership nor the displayed address was rewritten.

### Reviewed native corrections (prepared in code, no database write)

These exact-ID and full-address bindings change the navigation destination and accepted display point in the next release. The fallback previously used a free-text address; its stored pin is shown below only to explain the before state. The public site did not change as part of this audit.

| Branch and published address | Existing public pin (not proof) | Reviewed municipal postal point | Independent branch evidence |
| --- | --- | --- | --- |
| Touch & Care, Пирин 42 | 42.6650291, 23.2825296 | №11818 · 42.665031, 23.282531 | [Owner contact page](https://touchandcare.bg/kontakti/) |
| Zen Barbershop, Казбек 63 | 42.6650223, 23.2867119 | №11423 · 42.664957, 23.286582 | [Owner's location listing](https://zenbarber.bg/bg) |
| ВЕСИ СТУДИО, Синанишко езеро 13, бл. 12 | 42.6649597, 23.2835227 | №98389 · 42.664921, 23.283594 | [Owner-published GoRez branch](https://www.gorez.co/book/vesi-studio) and [previously reviewed native address](all-locations-audit-20261113.json) |

These are postal/building points, not independently confirmed doorway positions. A later address change retires the exact binding automatically. To reverse one of these corrections, remove only its added receipt from `lib/business-directions-reviewed.mjs`; keep the resolver so unverified navigation remains withheld. The obsolete Kerelski alias for **Пирин 81** is not silently routed to **Пирин 83**. No database corrections were applied; no update was proposed for the unidentified 178Е branch.

## Read-only review and correction workflow

```sh
# Local runtime catalogue, all records or compact review queue.
node scripts/audit-sofia-location-integrity.mjs --json
node scripts/audit-sofia-location-integrity.mjs --review
# One live public GET (no private provenance, place IDs, or application records).
node scripts/audit-sofia-location-integrity.mjs --public-directory
# Privileged export previously obtained using the transaction below; do not commit it.
node scripts/audit-sofia-location-integrity.mjs --native /private/path/location-inventory.json --review
# No apply option: compares each proposal to the exact pre-edit state and evidence.
node scripts/plan-sofia-location-corrections.mjs --snapshot /private/path/location-inventory.json --decisions /private/path/reviewed-decisions.json
```

1. An authorized operator runs [the read-only SQL](../operations/sofia-location-audit-read-only.sql) in the appropriate GoRez database and saves the single JSON result cell to a private file outside Git. It reads one repeatable snapshot, including disabled, pending, and archived native records; not customer records, phone numbers, emails or private profile data. It records branch ID, original address, application state, existing point, separate location proof, provider ID and revisions. There is no dependency on an externally provided key or on obtaining one for this review. The SQL is compatible on either side of the new versioned location migration.
2. Review `--review`, sorted by conflicts first, then missing/unverified, and by publication within each group. Compare the exact public branch to a first-party branch address, a valid municipal civic point, and, where warranted, separate entry evidence. Do not read across a different branch of the same brand. Deep-link city/municipality conflicts are reviewed separately; do not alter partner eligibility in the address decision.
3. For each approved correction, put the stable branch `id`, the exported `expectedContentRevision`, `before` (the exported business record), `after` (new city code/city/neighbourhood, exact address, intended point or null, `place_id: null`), and `evidence` (same `businessId`, exact new `originalAddress`, kind `postal_address`, `owner_branch_entrance` or `remove_conflicting_point`, date `checkedOn`, `sourceUrl`, `reason`, and `coordinates` unless only removing a point) into the decision array. A letter number remains a string inside the address. The planner does not verify the content of a submitted source URL; a human must check it. It emits a dry-run before/after/rollback report with stale, missing or already-applied decisions skipped.
4. Re-export immediately before applying any separately authorized database correction. Use the existing audited administrator business-content workflow and its expected revision/row lock; set the actual address and revoke old evidence rather than copying it to a new address. Use separately reviewed/address-bound precise navigation evidence (as above) or a fresh exact on-approval lookup. Do **not** grant navigation trust just by saving naked latitude/longitude or a Google place ID. Any future batch writing tool must compare the exported location revision, old address, point, registration proof and provider snapshot under lock in the same transaction, fail closed on mismatches, and report its before/after values. This repository does not provide a bypass writer.
5. Re-export after the update to read back addresses, binding revision, and destinations; do not resend approval/notifications or make bookings. Roll back a database correction only if its resulting location and evidence/revision still match the saved post-edit snapshot; restore the postal values through the same audited workflow, but do not silently restore a known bad point or provider claim. The schema-side location change history keeps separate prior and current state. An intervening edit stops the rollback; re-review that branch.

Verification performed for this dossier: eight focused Node tests, including the privileged SQL in an isolated PGlite database, exact suffix regression, boundary conflicts, stale receipt/version checks, whole static input coverage, and revisions/rollback in the dry-run planner. One live public snapshot was used for the final counts; there was no private production query. The coordinates-only Maps URLs were parsed and checked against [Google's directions URL specification](https://developers.google.com/maps/documentation/urls/get-started); the web reader could not render Google Maps navigation. No mobile Maps application behavior or walking route was tested.
