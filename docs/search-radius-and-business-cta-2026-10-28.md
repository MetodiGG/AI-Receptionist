# Search form refinements — 28 October 2026

- Removed the two visible explanatory paragraphs below the radius, in both languages. The Near me button retains its tooltip and a screen-reader description, and the existing footer privacy link/public disclosure remains intact. Browser permission requests, location consent validation and visible failure/recovery messages are unchanged.
- Centralized the default radius at 2 km for the form, request builder and server schema. Choices are 1, 2, 3, 5, 10 and 25 km; an explicitly chosen radius is preserved. Server validation still rejects values outside 1–25 km and non-integers. Nearby provider requests use metres, so the default produces 2,000 metres, not 5,000. City-only searches remain city-based.
- Added a readable, full-width registration link immediately below the search form: “Регистрирай бизнеса си безплатно” / “Register your business for free”. It opens the existing locale-aware `/for-businesses` wizard; it does not create an identity, submit an application or change billing. The existing 30-day trial and explicit paid-continuation terms remain on that page.
- No new dependency, environment variable, migration, credential, provider activation, quota change, email or real booking/customer mutation is included.

## Verification before release

- All 332 automated tests passed. Added regressions for shared 2 km defaults, explicit choices and invalid bounds; the 2,000-metre provider request; absence of the visible helper paragraphs while consent/privacy/error recovery remain; and the localized onboarding CTA. Existing booking/security/database tests remain passing.
- Production build passed, including the compiler/type step. No separate lint command is configured.
- Local browser QA at 320 px confirmed a 2 km selected value, no visible helper paragraphs and no horizontal overflow. Clicking the Bulgarian CTA opened the genuine existing five-step onboarding route; nothing was submitted. The English page retained 2 km and its English CTA/locale-aware destination. Local QA had Google, paid AI, email and real database access disabled.
- Production observations are recorded after publishing. No real precise-location request is required to verify this display/default change.

## Production postflight

- Source `cfcd8cee6fde62a89a637aa8924ff872d3187917` reached Ready in Production deployment `AMCzCgZdcAkE2ECGVxdti14gMoPP` (`ai-receptionist-ris7liip0-ai-receptionist12.vercel.app`).
- On the actual `www.gorez.co` home page at 390 px, opening More filters confirmed the initial 2 km value, zero visible helper paragraphs, the requested Bulgarian CTA and its existing onboarding URL, without horizontal overflow. Evidence: `/tmp/gorez-2km-business-cta-20261028.png`.
- Clicking that live CTA opened `/for-businesses?lang=bg` with the existing five-step wizard. No fields or registration were submitted. Returning home retained 2 km; viewport was reset to the normal 1280 px and temporary QA tabs were closed.
- No real browser location was requested, no Google/model test calls were made, and no billing/subscription configuration or data was changed during this postflight. The 2,000-metre request is covered by the deterministic automated provider tests.

## Brighter centred CTA follow-up

- The owner requested a more eye-catching, glowing, slightly larger and centred registration label. This CSS-only product change uses a bright lime gradient, dark-green 800-weight text, 22 px desktop / 20 px mobile sizing, and a soft three-second shadow pulse. Equal-width outer grid columns balance the arrow, keeping the label at the true centre of the button.
- No flashing/opacity changes or layout movement are used. Reduced-motion preference disables the pulse while retaining the static highlight, and keyboard focus has a distinct dark outline. The text contrast against every gradient/hover background is tested at at least 7:1.
- All 333 tests and the Production build passed. Local 320/390 px checks had no horizontal overflow; the label/button centre difference was 0 px at 320, 390 and 1280 px. The registration URL and all search/radius/consent behavior remain unchanged. No provider, location, account, billing or database request was needed for this styling check.
- Production appearance is verified after release below.
