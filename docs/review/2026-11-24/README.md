# Review: Sofia business locations and discovery photographs

This is a local review. No database corrections, bookings, notifications, migration or production release were made.

## Open the evidence

- [Location evidence and counts](../../catalogue-geocoding/sofia-location-integrity-20261124.md), including the unresolved **бул. Сливница 178Е** report, three exact branch receipts and the dry-run/rollback procedure.
- [Read-only database audit](../../operations/sofia-location-audit-read-only.sql): needs an authorized operator only for records not available through the public directory.
- [Mobile: conflicting location, address still copyable](directions-review-mobile.png) and [desktop: verified destination](directions-verified-desktop.png).
- [Before/after contact sheet](discovery-photo-before-after.webp), [mobile photo tiles](photo-education-mobile.png), [desktop photo tiles](photo-education-desktop.png), and [photo audit and reproduction](../../discovery-photo-integrity-20261124.md).
- [New asset assignments and provenance](../../discovery-photo-replacements-20261124.json) and [remaining exact service-image queue](discovery-photo-generation-queue.json).

## Reproduce the UI without production credentials

From the isolated checkout run `DISCOVERY_ENABLED=true DISCOVERY_SEARCH_V2_ENABLED=true DISCOVERY_DEV_MOCK=true pnpm dev --hostname 127.0.0.1`. For photo tiles use `/dev/sofia-catalogue` and select **Уроци**. Verified profile example: `/businesses/catalogue/sofia-in-beauty`; unresolved point example: `/businesses/catalogue/sofia-diana-tsarigradsko`. Append `?lang=en` to check English. The copy action uses the Clipboard API where allowed and otherwise presents selectable text.

Chromium browser verification used a 390 px touch-emulated viewport and a 1440 px desktop viewport, not a physical phone. The local production build showed the verified Maps link, municipal attribution and the copy-only conflict state; copying the displayed address succeeded. BG and EN status text was checked. An anonymous browser opened Google Maps at the IN Beauty coordinate destination with no supplied origin; a journey from a real starting point, arrival at the door, and device-app routing were not checked. No booking or telephone action was activated.
