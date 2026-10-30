# Partner category browsing

The `/partners` directory opens with category cards instead of one mixed business list. Categories and counts are computed from the existing public directory response: only published, active GoRez partners. Empty categories are omitted. No extra Google/AI calls, external listings, database changes or new dependencies.

## Navigation

- `/partners?lang=bg` — category overview.
- `/partners?lang=bg&category=beauty` — all public beauty partners.
- `/partners?lang=bg&category=auto` — all public automotive partners.
- `/partners?lang=en&category=all` — all partners, explicitly selected.
- `Всички категории` / `All categories` returns to the overview.
- Category selection survives reload, shared URLs, browser Back/Forward and language changes.

Category identifiers and labels come from `INDUSTRY_KEYS` / `getIndustryLabel`, shared with business onboarding. Unknown legacy industries are kept under `other`. No business name heuristics are added by the category UI. The existing public endpoint's publishing rules, photos, services, prices and booking links remain in use. Other consumers of `BusinessDirectory` retain their previous behavior unless `partners` and `categoryBrowsing` are both enabled.

Newly published partners appear in the matching category on the next directory refresh; existing focus refresh behavior is preserved. Categorization uses the public business industry, not its individual services. Changing a business's industry is still done through the existing business settings/admin workflow.

## Verification

- `node --test tests/*.test.mjs` — 613 passed, zero failures.
- `node node_modules/next/dist/bin/next build` — passed, including TypeScript checks.
- Local guarded fixture `/dev/partner-categories`: beauty has two businesses, auto/sport/other have one each; verified category isolation, totals, all-partners list, Back, keyboard Enter, localization and empty/error states.
- Responsive checks at 390px BG and 320px EN: no horizontal overflow; category artwork loads.
- Read-only live public API check: HTTP 200, three public partners; beauty: two, automotive: one. Category grouping matches those public industries; no private/admin data was accessed.
- Fixture requires explicit development mock mode and is unavailable in production, including when the mock flag is set. It contains conspicuously labeled fictional businesses and disables booking.
- No real reservation, business record, email or paid search was created during these tests.

Local fixture startup: `DISCOVERY_DEV_MOCK=true node node_modules/next/dist/bin/next dev --port 3033`, then open `/dev/partner-categories?lang=bg`. Normal `/partners` uses the real public directory, never fixture data.
