# Compact business details — 11 November 2026

Changes are local; no deployment, migration, paid provider, booking submission or
notification was performed.

## Implementation

- `components/discovery-business-details.js`: hours start closed behind a native
  details/summary row with the existing chevron; real schedules and unknown-hours
  handling remain intact. Removed the separate contacts section, visible hours
  source link and illustrative-service-photo paragraph. Address has compact spacing.
- `app/service-photo-surfaces.css`:44px hours control, visible keyboard focus,
  open-state arrow,4px address-heading gap, shorter footer gap; AI cover badge is
  now9px with a contrasting background, not hidden.
- `lib/dialog-focus.mjs`: summary participates in dialog Tab cycling; hidden
  disclosure content remains excluded by the existing rendered-rect check.
- `components/business-profile.js`: removed the same redundant photo paragraph;
  booking, service selection and profile layout are otherwise unchanged.
- `components/discovery-business-card.js` and
  `lib/discovery/public-details.mjs`: the one reservation action now uses the
  freshly loaded booking context, including current phone/form, partner slug
  and native/external mode. Cleared data cannot retain a stale preview action.
- `lib/discovery/rail.mjs`: reviewed forms/approved redirects have priority;
  a real phone is the fallback. A generic homepage is not falsely presented
  as an appointment form. Existing URL, expiry and approval safeguards remain.
- `lib/service-thumbnail.mjs`: reuse existing approved `makeup-v1.webp` for
  ordinary makeup application, including occasion/location qualifiers.

The catalogue contains62 makeup-title service rows:51 ordinary applications now
resolve to the approved makeup photo (14 additional previously missed rows).
All three ordinary makeup services at Vessy Mineva are covered. The existing
separate lash photo is preserved. Eleven art/SFX, removal, addon or mixed-activity
services are deliberately not assigned this ordinary makeup-application image;
they need a suitably specific approved or business-provided photo.
Exact business-provided service photos still take priority. Failure fallbacks,
honest alt text and the category-cover disclosure remain. No new image was
generated and no third-party/business gallery image was repurposed as service work.

No catalogue prices, booking URLs, business contacts or opening-hour facts were
invented or changed. Their source metadata is retained even where its visible
link was removed from the compact dialog.

## Executed checks

- Full Node suite:1314/1314 passed, no failures/skips.
- Python pricing extraction8/8 and booking-pricing flow4/4 passed.
- `pnpm catalogue:check`: passed;0 blocked new/changed listings.
- `pnpm build`: passed;81/81 pages generated.
- Safe local real-catalogue browser fixture: Vessy Mineva's three makeup photos
  and lash photo loaded; hours initially collapsed, click expanded actual seven
  weekdays, Enter collapsed them again. No contacts/photo-note paragraph.
- Actual viewport checks360,390,430,768,1280px: no page or dialog horizontal
  overflow; hours stayed collapsed and thumbnails loaded. Verified9px AI label.
- Mobile390px and desktop screenshots were inspected in the browser tool;
  no screenshot-file deliverable was saved. Preview bookings are disabled, so
  no production reservation or external form was submitted/click-tested.
- Runtime regressions cover fresh form→phone→none, native↔external modes,
  encoded current slug, BG/EN, safe URL/expiry guards and preserved directions.

New tests: `discovery-details-compact-ui`, `discovery-details-compact-styles`,
`discovery-details-booking-actions-ui`, `booking-contact-priority`, and
`makeup-service-thumbnail`. Existing card/source-structure expectations were
updated to require the fresh business context, not the stale preview object.
