# Homepage navigation — 29 October 2026

## Change

- The shared marketing navigation omits the redundant Home/Начало link only at `/`, including both language query parameters and either hamburger state.
- Inner marketing pages retain their direct, localized Home link. Existing login, account, booking, owner and admin headers are unchanged.
- The homepage no longer reserves a grid cell for Home. At mobile widths the logo, language switch and menu share a row; at 360px and below the controls move to a second row to avoid overlap.
- No search, availability, authentication, booking, subscription, database or provider configuration changes.

## Verification

- Read the installed Next.js 16.4.1 `usePathname` and Client Component guides before implementation.
- `node --test tests/*.test.mjs`: 345 passed, zero failed.
- `pnpm build`: passed; `git diff --check`: passed.
- Local browser checks at 320px, 390px and 1280px: no Home on the homepage and no horizontal page overflow.
- Opening the homepage menu still shows no Home. BG menu → business login → Начало returns to `/?lang=bg`; EN menu → For businesses retains Home → `/?lang=en`, where Home disappears again.
- Local Google/AI provider integrations were disabled. No search, location request, booking, email or data mutation was triggered.
- These checks are local. This change has not been deployed to Production.
