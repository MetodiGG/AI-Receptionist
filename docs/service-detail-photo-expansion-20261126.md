# Expanded service-detail photographs · 26 November 2026

The "Виж детайли" menu can use 65 additional visually reviewed AI scenes
for suitable services. The image matching uses the existing exact activity
source and, when needed, a reviewed positive service-name qualification.
Exclusions distinguish different techniques and cases such as group vs.
individual, in-person vs. online, and children vs. adults.

The catalogue audit on 2026-11-26 covered 10,284 published service rows from
1,776 checked-in businesses in 14 categories. The preceding detail-photo
layer showed 6,813 images. This layer keeps those 6,813 original selections
and adds photos to 2,264 more service rows: 9,077 show a distinct photo
(88.3%), and 1,207 still await a suitable scene. The audit decoded 1,950
referenced assets, including 174 navigation pictures, and found no exact
or probable visual duplicates in the checked cover and navigation pairs.
No live uploads or production customer data were used in the count.

All newly generated files are square 256-pixel WebPs. The detailed menu uses
the small white `AI` marker at the top-left on a transparent background;
localized attribution remains available to screen readers. Genuine photos
do not receive the marker. Sources are separate from business, category and
subcategory photos, all of which were left unchanged.

[Beauty and hair prompts](./service-detail-photo-beauty-20261126.json) ·
[Auto, home and pet prompts](./service-detail-photo-auto-home-20261126.json) ·
[Activity, education and consultation prompts](./service-detail-photo-activity-education-20261126.json) ·
[Specialty prompts](./service-detail-photo-specialties-20261126.json).
Each manifest includes the saved asset path, original and optimized
SHA-256, prompt, and visual-review note. All images use the built-in generator.

Reproduce the local coverage and duplicate audit with:

```sh
node scripts/audit-detail-service-photos.mjs --as-of 2026-11-26 --near \
  --report /absolute/path/to/new-report.json
```
