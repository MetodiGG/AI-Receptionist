# Service photographs in public business details — 2026-11-26

The public service menu used by the “Виж детайли” dialog and the standalone
catalogue profile now tries a separate photograph when the previous image
was absent or repeated the business cover. The compact cards and booking
profile components keep their previous resolver. Category and subcategory
artwork, business photos, catalogue records, prices, and booking behavior
were not changed.

The order in details is: use the already approved service photograph when
it differs from the business gallery and navigation; otherwise try an
appropriate, previously reviewed illustration from the service catalogue or
a manually reviewed alternate for that same action. The detail illustrators
are context-bound; for example, group yoga, online consultations, or
children's classes cannot borrow their adult one-to-one equivalents.
Different durations or tariffs of a genuinely matching activity can use
its representative image. Genuine service images retain their source and
are not labeled as AI; generated images retain the existing disclosure.
Missing or failed suitable images remain absent, never replaced by
notebooks, generic art or the same cover.

## Offline results

At 2026-11-26T12:00:00Z, the checked-in public catalogue contained 1,776
eligible businesses and 10,284 published service rows in 14 categories.
Details displayed an image for 1,980 rows before and 6,813 after (+4,833).
Nine newly generated square WebPs are used for 983 rows. The remaining
3,471 rows (2,403 exact service identities) still need another suitable
scene. Production database uploads and live partner inventory were not
included in this count.

The audit decoded 1,885 referenced image files, including 174 navigation
assets, and found no exact duplicates against the same business cover or
navigation. The optional perceptual pass found no candidates against the
same business cover or between the new scenes and navigation images.
The similarity audit is bounded, not proof of universal image uniqueness.

Reproduce the scope, counts, source checks and gap list without network:

```sh
node scripts/audit-detail-service-photos.mjs --as-of 2026-11-26 --near \
  --report /absolute/path/to/new-report.json
```

The image provenance manifest records the exact generation prompts, original
and WebP SHA-256 hashes, and review notes. The ABI Beauty detail dialog was
rendered at 390 px in Bulgarian and 1440 px in English: the three nail
services in the example show separate images with the same prices.
