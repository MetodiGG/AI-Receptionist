# Customer discovery homepage — local review

Checked 5 November 2026. Branch: `codex/customer-discovery-homepage`, based on local commit `58d7e33` (admin simplification and required onboarding photos).

**Local only:** no GitHub push, Preview/Production deployment, live migration, real booking, email, credential change or paid Google/AI search test was performed for this redesign.

## Final interface

- Compact header: complete owner-provided transparent logo, styled wordmark with bold orange **G** and **R**, an unframed flags-only language toggle, and a light-orange dimensional menu icon. No desktop navigation text beside the flags. Inner pages retain their existing Home link.
- Exact existing bilingual homepage headline, now smaller and bold in a faded-orange rounded search panel. The discarded scroll highlights and observer component are completely removed.
- Short placeholder: `Пиши тук…` / `Type here…`. The leading magnifier is the submit button; Enter also submits. Only the magnifier, filters and folded-map toggle remain in the bar—no separate arrow/continue button.
- The folded-map control explicitly switches nearby search on **and off**. Off removes coordinates from subsequent payloads and restores the selected city; default city/radius remain Sofia / 2 km. Turning on still invokes the existing permission-based geolocation helper only after a click. Denial keeps manual city search usable.
- No applied-location/options summary above the bar. City, quarter, category and radius remain in the focus-contained native filter sheet with Apply/Reset and Escape/backdrop dismissal.
- One native horizontal photographic category rail, followed by a compact real-partner business rail. No fabricated popularity, distances, ratings or appointment availability. The section is truthfully called **Разгледай бизнеси / Explore Businesses**.
- All 14 category pictures are now owner-provided. **Other services uses the final supplied orange cat/detective photo**, not Consulting, the rejected reception image or the discarded question mark.
- Soft, centered secondary cards: GoRez Partners uses the requested **handshake**, For Businesses retains the laptop. Smaller visuals, larger 19px mobile / 20px desktop card titles, and a prominent static orange **Безплатно / Free** label. These remain ordinary links to the existing partner/onboarding flows.
- Subtle warm backgrounds distinguish sections. Desktop content is capped at 1080px with smaller gaps, controls and thumbnails; mobile layout/touch targets remain comfortable. Interactive search/header controls are at least 44px.
- Menu order in both languages: Home → Find a service → Client account → Business Account → Become GoRez Partner → FAQ → Contact us. Bulgarian FAQ navigation is **ЧЗВ**.

## Existing behavior retained

The implementation extends `DiscoverySearch`; it does not replace the parser, search API, authentication, onboarding, booking system, subscription logic or Google integration. Existing results/source filters, verified partner eligibility, internal/external booking modes, outbound URL validation, slot revalidation, time interpretation, request limits, abort handling and results auto-scroll remain in place.

The browse rail reuses `useDirectory` and the public GoRez directory. Its API adds only validated public business latitude/longitude scalars—not an entire `public_profile`, customer data or private account fields. Unknown coordinates do not produce invented distances or enter a nearby radius.

External Google listings remain in the existing explicitly requested search workflow and official Google presentation. There is no passive Google request on homepage load, keystrokes, carousel scrolling or filter-panel opening; no Google business/photo dataset is copied into the homepage. Selecting a category, applying a valid search, or switching location for a valid query is an explicit search action and continues through existing server limits.

## Files

New UI: `components/discovery-home-rail.js`, `components/discovery-home-browse.js`, `components/discovery-filter-sheet.js`, `components/country-flag.js`; styles: `app/discovery-home.css`, `app/brand.css`, `app/header-controls.css`.

Shared integration: `components/home-page.js`, `components/discovery-page.js`, `components/discovery-search.js`, `components/marketing-navigation.js`, `components/site-footer.js`, `components/language-switch.js`, `components/brand-logo.js`, `components/icon.js`, `components/business-landing.js`, `app/layout.js`.

Helpers/data: `lib/discovery/home.mjs`, `lib/discovery/copy.mjs`, `lib/dialog-focus.mjs`, `lib/brand-assets.mjs`, `lib/public-directory.mjs`, `app/api/public/businesses/route.js`.

Brand metadata/PWA: `lib/seo.mjs`, `app/manifest.js`, `app/brand-icon/route.js`, `app/share-image/route.js`, `public/sw.js`. PNG image responses use the correct PNG data MIME type; production output tracing includes the new mark. The service worker retires only its own `gorez-` caches.

Local fixtures: `app/dev/homepage/page.js`, `app/dev/homepage/preview.js`. Automated coverage: new `tests/discovery-home.test.mjs`, `tests/brand-v4.test.mjs`, `tests/homepage-visual-refresh.test.mjs`, plus updated existing navigation/search/partner/Solar tests.

## Assets and provenance

The unchanged 1024px uploaded logo is preserved at `assets/brand/gorez-original-v4.png`, SHA-256 `c3ba1da1fbe1f3da6d11e69b63688cfddea7726ffa87fb27ffd06f2b52ba9d6d`. Optimized native PNG/WebP assets in `public/brand/` retain alpha. The original and optimized website marks have transparent surrounding pixels; no background extraction, recolour, crop or redraw was performed. The OS maskable icon deliberately uses a graphite background; that is separate from the transparent website mark.

Category mapping/source records: `docs/homepage-category-photos-2026-11-04.json` and `docs/homepage-other-art-2026-11-05.json`. All 28 active category variants together are **271,830 bytes**, with 160px/240px sizes and stripped metadata. Owner attachments are not independently licensed by their mere presence; publication rights remain the owner's responsibility.

The two decorative card illustrations were made with the **built-in image_gen tool**, not a new connected paid API. Final files:

- `public/home-art/partners-3d-v2.webp` (240×120) and `partners-3d-2x-v2.webp` (480×240): handshake, replacing chains.
- `public/home-art/business-3d-v1.webp` (240×240) and `business-3d-2x-v1.webp` (480×480): laptop/calendar.

The complete final prompts and original generated filenames are in `docs/homepage-card-art-2026-11-05.json`. These illustrations are decorative navigation art, never represented as photos of actual businesses. Unused generated alternatives are not referenced or bundled. Original generated PNGs remain in the Codex generated-images folder.

Reproduction helpers: `scripts/prepare-brand-v4.mjs`, `scripts/prepare-home-category-photos.mjs`, `scripts/prepare-other-category-photo.mjs`, `scripts/prepare-homepage-card-art.mjs`. They use the existing Sharp dependency, preserve selected source content/transparency and refuse accidental overwrites. No new package dependency or environment variable was added.

## Checks

- `pnpm test`: **727 passed, 0 failed, 0 skipped**.
- `pnpm build`: passed on Next.js 16.4.1.
- `pnpm audit --prod --audit-level high`: no known vulnerabilities (unchanged dependency inputs).
- `git diff --check`: clean. The project has no separate lint/typecheck script; no lint run is claimed.
- Browser matrix: 320, 360, 375, 390, 430, 768, 1024 and 1440px. Actual viewport width equalled document width; no page-level horizontal overflow. Search/header controls remained 44px or larger.
- Verified BG/EN menu order, flag-only switching and unframed computed styles, orange 900-weight G/R accents, native filter focus restoration, city/radius defaults, map on/off cycle, retained manual city after off, denied-location fallback, leading-icon submission and existing results interpretation/auto-scroll using local mocked search data.
- Checked that the final handshake and supplied Other photo decode in the actual page. An early local hot-reload request preceded the newly generated handshake file; a fresh reload verified both static variants return 200 and the image renders correctly.
- Local production-mode smoke checks cover the bilingual root, PNG brand/share images and development fixture/mock API exclusion. This is a loopback build check, not a remote deployment.

Screenshots in `docs/review/2026-11-05/`: `homepage-mobile-bg.jpg`, `homepage-mobile-en.jpg`, `homepage-desktop-bg.jpg`, `homepage-filters-mobile-bg.jpg`, `homepage-location-on-mobile-bg.jpg`, `homepage-other-services-desktop-bg.jpg`.

## Local review and remaining live checks

The running design review is `http://127.0.0.1:3037/dev/homepage?lang=bg` (also `lang=en`). It intentionally uses visibly labeled fictional businesses/coordinates and disables booking; it never requests real user GPS or paid Google/AI services. Fixture cases: `case=empty`, `case=error`, `case=loading`, `case=denied`.

To restart safely with the existing development mock flags:

```sh
DISCOVERY_DEV_MOCK=true DISCOVERY_ENABLED=true pnpm dev --hostname 127.0.0.1 --port 3037
```

`/dev/homepage` and `/dev/discovery/search` return 404 in a production build even if the mock flag is set. Normal local `/` uses the project's actual Supabase configuration; without it the genuine directory can display its existing unavailable state. The design fixture does not silently replace real businesses on `/`.

Before any future release: review this branch and the owner-supplied image rights; explicitly approve publication. A real iPhone/Safari permission popup, current live Google quotas/provider results and real database-backed bookings were **not** retested during this local visual pass. No new migration or external-service activation is required for these changes.
