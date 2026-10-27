# Public subscription copy — 26 October 2026

Owner-requested local-only change: stop displaying the fixed GoRez subscription amount publicly and discuss subscription terms directly with businesses.

- `lib/product-config.mjs` remains the shared copy source for Bulgarian and English. Home, business onboarding/application, legacy business landing/FAQ, business SEO/Open Graph/Twitter descriptions and the generated share image no longer quote the amount.
- The legacy landing's amount card now invites a conversation rather than displaying a monthly number.
- The 30-day trial, no payment details at signup, explicit consent for paid continuation and no automatic charging remain stated. Nothing promises that the service stays free indefinitely.
- The internal `MONTHLY_PRICE_EUR` / `PRICE_LABEL` reference is unchanged. No subscription enforcement, billing/provider integration, business service price, booking, authentication or database behavior was changed.
- No deployment, domain, Google policy/IAM, account classification or hosting plan settings were changed. The feature remains local until deployment is explicitly approved. Previously cached social/search previews can continue showing older copy until the relevant caches refresh after an approved release.

Removing a public number does **not** change the purpose or commercial nature of an application. Do not represent this copy change as making GoRez eligible for Hobby or as concealing commercial activity. [Vercel's commercial-use guidelines](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage) govern plan eligibility independently of whether a price is shown or revenue has started.

Verification completed: **285 automated tests passed, 0 failed**; production `next build` and `git diff --check` passed. Tests preserve the internal values and trial, enforce amount-free public copy and metadata in both languages, and check that public consumers use the common copy without a numeric fallback. Fresh local production requests to `/` and `/for-businesses` in BG/EN returned 200, the direct-discussion copy and no quoted subscription amount. Both generated 1200×630 business share images were rendered and visually checked: no amount, clipping or missing copy. The temporary QA server was stopped. No live customer data, paid provider requests or deployment were involved.
