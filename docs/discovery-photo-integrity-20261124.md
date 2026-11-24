# Discovery photo integrity — 24 November 2026

Scope: the checked-in catalogue approved on 24 November, 14 parent choices, 113
subcategory choices, and the nine checked-in exact partner-service overrides.
This is **not** an inspection of live partner uploads or a database export. Actual
partner gallery files and the GoRez logo are unmodified. The curated genuine
Megan photo remains in its original exact assignment and is not marked as AI.

## What changed

The old presentation assigned stock activity photos both to navigation choices
and to multiple distinct service names. It also reused re-encoded versions of
service artwork for business-cover fallback, and an old guided surface could
borrow the category's image if a subcategory photo failed.

- Navigation keeps its unique photos and receives five independently generated,
  locally hosted, 400 × 400 WebP replacements with visible AI disclosure. See
  the [before/after contact sheet](review/2026-11-24/discovery-photo-before-after.webp)
  and [prompts, provenance, sizes and hashes](discovery-photo-replacements-20261124.json).
- Exact category + NFC service name, with case and whitespace normalized, defines
  a generic service identity. The same identity can repeat its photo on its own
  card/profile or across rows offering that exact service. Different words,
  punctuation or categories are not equated. Reviewed partner overrides remain
  scoped to the exact business and service IDs; already authorized real images
  are not sent through the generated-art rules.
- Each previously shared source has a single owner. Responsive variants and
  proven cover/thumbnail derivatives do not count as new photos. A generated
  service image is displayed only when its candidate source belongs to that
  service. Images from unrelated categories are no longer used as error or
  business-cover fallbacks. If there is no distinct compatible photo, details,
  prices and booking actions remain intact and no generic photo is shown.

## Measured inventory and gaps

| Local cohort | Before | After |
| --- | ---: | ---: |
| Distinct subcategory sources | 108 / 113 | 113 / 113 |
| Shared-reference groups spanning different entities, incl. legacy error fallbacks | 1,021 | 0 |
| Cross-entity pairs sharing a known underlying source or cover derivation | 386 | 0 |
| Renderable service rows with a distinct photo after allocation | — | 2,348 / 10,298 |
| Illustrative business covers with a distinct source | — | 1 / 1,778 |

Before, all 10,298 rows resolved a legacy photo, but not necessarily a distinct
one. After, 7,950 rows have no selected distinct photo. The
[generation queue](review/2026-11-24/discovery-photo-generation-queue.json) records
the 4,647 exact service identities still lacking a new scene, and the identities
whose media work in some branch contexts but not in all. This is an acknowledged
remaining artwork gap, not a claim that all replacements have been generated.
The low illustrated-cover count does not count or alter genuine galleries.

The tool decoded 1,871 referenced files in the original mode, 1,876 including the
five new photos before the exclusivity policy, and 1,488 paths in current rendered
mode, with no unreadable files. It checked source-provenance
families, SHA-256 of actual files and decoded pixels, plus pHash and spatial
luminance agreement for common crops and flips. No additional perceptual review
candidates met both thresholds in this run. This heuristic does not prove that
arbitrary, extreme transformations or uninspected external images are distinct.
The five replaced pairs were additionally inspected as displayed photos.
[Mobile screenshot (390 px)](review/2026-11-24/photo-education-mobile.png) and
[desktop screenshot (1440 px)](review/2026-11-24/photo-education-desktop.png)
show the actual local GoRez preview in headless Chrome, not an iPhone/Android
test. Both 400px replacements loaded in their corresponding tiles; no
horizontal overflow was detected.

```sh
node scripts/audit-discovery-photo-integrity.mjs --as-of 2026-11-24 --baseline --report /tmp/gorez-photos-before.json
node scripts/audit-discovery-photo-integrity.mjs --as-of 2026-11-24 --public --report /tmp/gorez-photos-after.json --generation-queue /tmp/gorez-photo-queue.json
node --test tests/discovery-photo-integrity.test.mjs
```

The reports include every enumerated row, its selected source, source hashes,
perceptual candidates and dependent cover variants. The audit reads local
bytes only; no external media requests. Use a new output filename on repeat.
