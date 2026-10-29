# GoRez Solar redesign — 29 October 2026

## Scope

- Warm-white surfaces, graphite navigation and orange primary actions. Tactile button depth/pressed states and rounded instrument-like search controls.
- The owner rejected the initial orbital sculpture. It is removed entirely, including its animation and mobile miniature. A static three-card illustration now shows Service → Place → Your next visit on desktop; it is hidden at 760px and below so mobile prioritises the actual search form. Generic BG/EN labels, no fake business or appointment details, no interactivity or provider requests.
- Homepage stays focused on AI Search: four shortcuts (Фризьор, Маникюр, Автомивка, Спорт), Sofia initially selected, 2km radius, optional location permission and collapsed secondary filters. The exact Bulgarian placeholder is `маникюр, утре след 13:00ч.`; at 380px and below the submit button has its own row so this example is not cut off. No new menus, artificial reviews, customer counts or availability claims.
- The visible hero starts directly with „Каква услуга търсиш?“; the redundant GoRez AI Search kicker and its dot are removed in BG/EN. The approved introduction reads „Намери бизнес и резервирай за секунди. Опиши какво търсиш със свои думи по-долу.“, with an equivalent English translation.
- Footer adds GoRez партньори / GoRez partners immediately after Terms. `/partners` reuses the public business cards, curated photos, active services/prices and existing booking links, with no default city or filtering controls. Only active, platform-enabled GoRez businesses are listed, never Google places or pending/disabled accounts. Existing public API now reads stable 500-row batches beyond the default database cap and returns no-store responses; no new database fields, provider calls, migrations or account privileges. The homepage and legacy `/businesses` redirect remain AI-only.
- Shared visual treatment covers marketing navigation/footer, business sign-in/onboarding, customer account, booking/service/date/time selection, owner sidebar/calendar/settings and legal/review surfaces. Destructive controls and factual status indicators remain distinct from primary actions.
- `app/solar.css` is the final imported visual layer. Booking, database, authentication, Google attribution/content, provider limits, notification and subscription logic are unchanged.

## Complete logo

The compact legacy `gorez-mark.png` raster was actually cut at its lower edge. A self-contained square SVG recreates the full G/check/speed motif in the orange palette, with padding on every side. All `BrandLogo` variants share it; rendered dimensions preserve its square aspect ratio.

The same mark is used for browser icons, generated Apple/PWA PNG icons and the social-share image. Old application icon PNGs are preserved at `public/legacy-gorez-icon.png` and `public/legacy-gorez-apple-icon.png`; they are no longer automatic Next.js metadata assets. Original `gorez-logo.png` and `gorez-mark.png` remain on disk but are not used by the current components.

Owner refinement: the original dark green looked almost black at header size. The check now uses a brighter, clearly green `#238C50`, 7 units wide, over a 10-unit off-white separation stroke. It remains distinct on the warm-white website, orange G and graphite sidebar/icon tile. SVG and derived PNG URLs carry `v=3`, and the shell cache advances to `gorez-shell-solar-v5`, avoiding the previous nearly-black asset on reload.

## Sports wording and discovery

The public category and industry label is Спорт / Sports, with a racket icon, including onboarding and business settings. The stored `fitness` identifiers remain unchanged: no migration, archived business, rewritten service or booking.

Sports terms recognise coaching, yoga, Pilates, tennis, dance, boxing and swimming. Generic provider queries use sports/classes wording rather than general gym entry; the type mapping uses `sports_coaching`, `sports_school`, `yoga_studio` and `tennis_court`, checked against [Google's official Places type list](https://developers.google.com/maps/documentation/places/web-service/place-types). This does not establish external appointment availability or guarantee that every external result supports booking. Specific requested activities remain specific when matching actual GoRez services. Masks, result counts, request limits and provider activation are unchanged; no paid provider test was made.

The icon renderer accepts only 180px or 512px, reads only the bundled SVG and returns a publicly cacheable PNG. No upload, arbitrary URL or external provider call. The service-worker shell cache version changes so refreshed installs can obtain the new assets; installed OS icons may take time to refresh.

## Verification

- `node --test tests/*.test.mjs`: 359 tests passed, zero failed for the first release, including the final kicker removal and partners page. Seven design checks cover complete vector reuse, the substantial green check and separation stroke, contrast of orange actions and factual availability, hidden decorative content, localized introduction, reduced motion, icons/cache and embed-flow preservation. Three further discovery checks cover the exact short example, four shortcuts with Sports labels and specific sports/service/provider matching. Five partner tests cover pagination past 1,000 records, publication gating, failure/empty behavior, localized footer/card integration and readable service/price typography (final postflight refinement).
- `pnpm build`: passed on Next 16.4.1. `git diff --check`: passed.
- Browser checks: 320px English, 390px Bulgarian/English, 768px and 1440px; no horizontal page overflow. Homepage has no redundant Home link. Menu → login/onboarding → Home retains the selected language.
- Local fictional discovery request returns separately identified GoRez/external results and a disabled fixture booking action; no Google/AI requests. Local fictional profile retains service selection, photos and reviews. Calendar fixture retains Month/day selection and an agenda; mobile owner-shell fixture retains graphite navigation and the complete mark.
- SVG/180px/512px PNG icons and Bulgarian social-share rendering inspected. Browser metadata contains only the new icon/Apple targets.
- No real account creation, booking, review, email, GPS permission, cloud/account setting, provider quota, migration or billing operation.
- Purely visual browser QA is not a full end-to-end booking test, accessibility audit or a test on a physical iPhone. Existing operational regression tests remain separate from this visual pass.
- Partners page local browser check confirms BG/EN headings, footer position, localized Home link and no horizontal overflow at 390px. The local compiled server intentionally has no production database credentials, so its recoverable loading-error state is expected; real partner data must be verified on the released public page.

## Review and release boundary

Owner approved publication of this complete local design on 29 October 2026, then requested the final kicker removal and a separate partners page before publication. Existing requested homepage Home-button removal is included.

## Production release and postflight

- Main source `317db2c6ab9fd2b7453a95f02354394cb237bbdd` deployed the complete redesign and partners page. Visual postflight found the legacy directory's 13px service/11px price styles; follow-up `0ccb3b3c691130137183ddf22c32fec2f93df5de` explicitly raises both to 16px and removes duplicated nested padding.
- Final Vercel deployment `CyLhREV91NA5z83PDkTzWrbjaPhY`: Ready, Production, Current, assigned `www.gorez.co`; immutable hostname `ai-receptionist-hwqgpbcob-ai-receptionist12.vercel.app`. Confirmed main/source hash in Vercel, not merely a pushed commit.
- Final regression run: 360 tests passed, zero failed. Initial full production build passed locally; both source releases built successfully on Vercel. No new dependencies, production settings, provider flags, quotas, keys, paid plans or migrations.
- Live homepage shows the new mark/orange controls, approved description and four requested shortcuts, without the redundant kicker or Home button. The footer places GoRez партньори immediately after Условия, including visually on the next footer row at 1280px.
- Live `/partners?lang=bg` loads three active/platform-enabled records: Test GoRez, Zen Barbershop and ВЕСИ СТУДИО. The test-named record is already published in the existing database; no heuristic name filtering or business-status mutation was performed. Vesi's supplied photos, published services/prices and all three booking links render. Google listings are not part of this page.
- Verified BG↔EN headings, locale-preserving Home/booking links, no horizontal overflow at 390px/1280px, and computed 16px service/price text after the final release. Opened the real Vesi booking page and confirmed its profile/services, without choosing a slot, submitting a reservation or sending email.
- No paid Google/AI search, geolocation request, customer-data write, live booking/status edit, private owner-calendar inspection or real notification test was made during this release.
- Live proofs: `/tmp/gorez-solar-home-live-20261029.png`, `/tmp/gorez-solar-home-mobile-live-20261029.png`, `/tmp/gorez-partners-live-20261029.png` (local screenshot artifacts, not source assets).

Clean local compiled preview: `http://127.0.0.1:3013/?lang=bg`. Google Places, UI Kit and paid AI are explicitly disabled for this local process; no search was submitted to this compiled preview. The development-only fixture server on 3012 was stopped after QA.

Layout proof files (without the rejected orb): `/tmp/gorez-route-cards-desktop-20261029.png`, `/tmp/gorez-route-cards-mobile-20261029.png`. Latest combined proof: `/tmp/gorez-sports-green-check-mobile-20261029.png` (brighter green mark, exact short example and four requested shortcuts). These are temporary local artifacts, not public deployment evidence.
