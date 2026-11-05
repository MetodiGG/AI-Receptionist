# Compact cards, aligned navigation and partner rating preparation

Local changes on `codex/unified-business-rail`, based on `cb61086`. No push, deployment, production configuration/data write or live Google request was performed.

## Visual changes

- Returned both bottom promo rectangles to the original compact card padding/layout. In the checked 1440px viewport each is 372×143px; at 390px they are 171×181px; at 320px 136×204px with readable wrapping. There is no document-level horizontal overflow at those widths.
- The partner card keeps its small soft 3D handshake. Following the owner's latest revision, the business card has **no illustration and no separate “For Businesses” heading**: only the larger centered registration phrase and a warm orange Free accent. Registration text is 24px on desktop, 22px on ordinary mobile widths and 17–18px on very narrow phones to keep the Bulgarian word inside the card. The earlier built-in imagegen growth draft, its WebP copies and preparation script were moved out of public/runtime assets into a recoverable local draft archive; the original attachment is unchanged. Prompt/provenance for that discarded draft remain recorded in `docs/homepage-card-art-2026-11-05.json` and are explicitly marked unused.
- Home, language and menu now share one flex action group: 44px targets, 8px equal gaps, identical vertical positions at 320px and 1440px. Home stays absent on the homepage. Existing inner-page Home links and embedded-booking behavior remain intact.
- Maps button text reduced to 14px, icon to 19px, preserving the complete unaltered “Google Maps” name. At 320px and 390px the measured button scroll width equals its client width (124px and 134px respectively); the label stays inside.

Proof screenshots in this directory:

- `compact-text-registration-mobile-bg.jpg`
- `compact-text-registration-desktop-bg.jpg`
- `aligned-home-flag-menu-mobile-bg.jpg`
- `partner-google-link-offline-admin.jpg` (fictional local admin preview only)

The local browser was returned to `/dev/homepage?lang=bg`, marked as a deliverable and its temporary viewport override reset. Its names, coordinates and search responses are fictional; bookings and Google/AI calls are disabled in the fixture.

## Google rating implementation

See `docs/partner-google-ratings-2026-11-05.md` for opt-in, billing and source-policy details. The new `GOOGLE_PARTNER_RATINGS_ENABLED` flag remains off by default. Google owns and renders its rating/count through UI Kit; GoRez verified-visit ratings/comments stay separate and are never added to Google's score/count. One profile creates at most one rating widget, in its header, not another at the lower review list. No real partner identity link was created or changed.

Local browser checks confirmed:

- Admin → business → Edit → Google Maps: a save is disabled until a valid ID and explicit exact-branch identity check are supplied. The fixture's save reports “Само локален преглед — няма запис.” No real Google destination was opened.
- The public profile fixture shows its existing GoRez score with a GoRez source label and real-page review navigation; it creates no Google widget in preview mode.
- A local POST to the new public grant endpoint returned HTTP 200, private/no-store and `{ "plan": null }` under disabled/mock configuration.

## Final automated verification

- `pnpm test`: **781 passed, 0 failed, 0 skipped**, including new offline identity, origin/schema validation, rate/budget, native widget composition and blank-comment GoRez SQL aggregation tests.
- `pnpm build`: passed, including the new rating route. No separate lint/typecheck script exists in this checkout.
- `git diff --check`: passed.

The full suite caught the intentional FAQ count increase from 28 to 29; the regression expectation now also checks the new bilingual source-separation answer. Final rerun passed. Actual native Google rendering, real partner score accuracy and production activation remain unverified pending owner approval and a bounded live check; this document does not claim otherwise. The final visual test additionally enforces a text-only registration action, complete accessible label and high-contrast Free accent, preventing the discarded illustration from returning.
