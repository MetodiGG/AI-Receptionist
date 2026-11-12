# Flyer-inspired booking actions — 2026-11-12

Presentation-only follow-up to Production `fc67e19061df49b2ce4e1b3fc2abd19e6152c7b4`; not deployed.

## Changes

- Customer booking/directions actions use warm cream/orange gradients, a light inset highlight and a shallow lower edge. Hover/focus deepen the orange; press compresses the relief. Disabled controls retain their inactive appearance. Reduced-motion users receive no movement.
- One shared decorative calendar component reuses `/booking-art/calendar-3d-v1.webp` (256 × 256, 39,640 bytes). Existing asset provenance remains in `docs/review/profile-control-art-20261110.json`; no new imagery or dependencies.
- Reused across homepage cards/details, public profile booking controls and service actions, partner directory, phone and protected outbound booking actions, and GoRez-owned Google result controls. Provider-owned widgets are untouched.
- The folded map component is byte-identical. `components/icon.js` SHA256: `ec3ade456639ebb62a5f5a856b9a9c43daf7b342e4b2fc71e3ea06cd89afed44`.
- Links, real service identifiers, telephone safeguards, external POST/event IDs, duplicate-submission locks, availability and booking rules are unchanged. No business data, reservations, schema or homepage browsing structure changed.

## Verification actually run

- `pnpm test`: **1617 / 1617 passed**, no skipped tests. Includes compiled-component booking action behavior, phone/outbound safety and disabled/focus/style regression checks. Two obsolete source-shape assertions were updated without removing their safety checks.
- `pnpm catalogue:check`: passed; 981 records, 958 approved, no blocked changed/new listings.
- `tests/booking-pricing-flow_test.py`: **4 / 4 passed**.
- `tests/pricing-extraction_test.py`: **8 / 8 passed**.
- `pnpm build --webpack`: passed. Webpack is used because the isolated checkout shares dependencies through a symlink outside its filesystem root.
- `git diff --check`: passed.
- Browser DOM measurements on safe local catalogue/profile fixtures at **360, 390, 430, 768 and 1280 px**: page width equals viewport, no action overflow, action pairs have equal heights, calendar assets loaded; profile service targets remain 46 × 46 px.
- Actual service-action click selected `QA Маникюр` and opened its one existing shared calendar. Hover and keyboard focus checked on non-submitting local buttons. BG/EN labels checked. Partner-directory inactive fixture checked after resolving the older solar-style specificity override.

Local fixtures are development-only and cannot create bookings, call a business or submit production actions. No real bookings, notifications, uploads, paid services or deployment were performed.

Evidence: `flyer-buttons-20261112` in this thread's visualization directory contains screenshots and responsive measurements. Existing calendar art is illustrative interface artwork, not a business/service photograph.
