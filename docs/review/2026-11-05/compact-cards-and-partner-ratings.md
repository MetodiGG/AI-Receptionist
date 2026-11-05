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

## Follow-up: registration headline color

At the owner's request, “Регистрирай бизнеса си” now uses the exact partner-card headline color `#452719`. The Free accent, card sizes, wording and links are unchanged. Browser checks at 390px and 1440px confirmed both headings compute to `rgb(69, 39, 25)` and no document overflow. Proof: `signup-color-match-mobile-bg.jpg`. The added regression test verifies matching colors and contrast. Final follow-up checks: **782 tests passed**, build passed, diff check passed. Local only; no deployment or provider requests.

## Follow-up: bold Maps navigation and orange interaction feedback

- GoRez-owned business navigation labels now use bold 700 at the existing 14px size. Google-sourced fallback credit stays 400 and native UI Kit attribution is unchanged, following the [Google attribution typography requirements](https://developers.google.com/maps/documentation/javascript/policies#google-maps-attribution-requirements). No Google logo, rating or provider credit was replaced.
- Enabled Reserve controls have a warmer orange hover/keyboard-focus state and a deeper orange pressed state. The Free badge uses the same interaction palette inside the existing text-only registration card. Dark text remains at least 4.5:1 against every gradient endpoint; card sizes, labels, destinations and booking logic are unchanged. Busy/disabled controls are excluded from the new state selectors, and reduced-motion users get no new transition or pressed movement.
- Browser checks at 320px/390px found no document overflow. Maps button client/scroll widths remained equal (124px/134px respectively) despite the bold label. Read-only computed styles confirmed GoRez label weight 700 and Google fallback credit 400.
- A development-only, no-action `/dev/button-states` fixture allowed native pointer and keyboard checks without creating a booking or opening a real registration/Google destination. Hover/focus showed `#ffac62 → #ff8d3f`; while Space was held, both controls matched `:active` and showed `#ff9546 → #ff7725`. Keyboard focus outlines were visible. The fixture has no form, handler, link or provider script and calls `notFound()` outside development.
- Proof: `bold-maps-button-mobile-bg.jpg`, `orange-button-feedback-bg.jpg` (safe enabled-control fixture), and `orange-signup-highlight-mobile-bg.jpg` (actual local homepage in keyboard-focus state). The main local mock homepage was left open and the viewport override reset.
- Verification: **787 tests passed, 0 failed, 0 skipped**; `pnpm build` passed; `git diff --check` passed. No push, deployment, paid Google/AI request or production-data change.

### Darker Reserve follow-up

Reserve now uses the exact deeper pressed-Free gradient, `135deg / #ff9546 → #ff7725`, on hover, keyboard focus and press, instead of the earlier lighter hover orange. The border also uses the pressed-Free shade `#be551b`. The Free badge itself, resting Reserve style, dimensions, destinations, disabled/loading protections and reduced-motion rules are unchanged. The regression suite compares the complete gradient declarations to prevent color or angle drift. Native no-action fixture hover confirmed the compiled gradient and dark readable text, with no overflow; proof: `darker-reserve-hover-bg.jpg`. **788 tests passed**, build and diff check passed. Local only; no deployment or provider calls.
