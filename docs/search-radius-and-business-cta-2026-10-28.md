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
