# Registration simplification and free access — local review

Prepared on `codex/unified-business-rail`, after local unified-discovery commit `e4543e0`.

## Changes

- Shared inner-page Home navigation is now only a small white SVG house with light 3D shading, no visible “Начало / Home” text and no rectangular button background. The localized accessible name, keyboard focus indicator, fixed home URL and 44 × 44 px touch target remain. The actual homepage still omits this control.
- Business registration no longer asks for bilingual About descriptions, brands or a custom public page address. Existing saved content and the authorized owner/admin editing screens are unchanged. Physical address, business photos, services, schedule and booking-mode/consent checks remain.
- New page addresses are automatically transliterated from the business name with a stable per-registration random suffix. Two-character and non-Latin names work; the output satisfies the existing 3–48 character backend schema. A rare address conflict rotates the new registration's suffix and asks for an explicit retry instead of directing the user to a removed field. Existing business URLs are not changed.
- Below the registration heading, only **Помощ при регистрация → / Registration help →** remains; the trial paragraph and “Questions before you begin?” link text are gone.
- Public business copy, FAQ, metadata and share-image copy now describe free registration/use, no card requirement and no subscription fees. The 30-day trial and personal discussion of subsequent payment are not advertised. No future commercial plan is disclosed or scheduled. Dormant legacy internal numeric reference constants are not used by the public offer; no billing or expiry logic was activated.
- Business social-preview URLs include an offer cache-buster so an old trial image URL is not reused in newly generated metadata. Third-party caches of earlier shared links are outside this change's control.
- Owner-selected homepage heading: **Намери услуга. Запази час.** / **Find a service. Book a time.**
- Custom navigation actions now say **Google Maps** inside the button, not “Заведи ме / Take me there” with a duplicate caption below. The in-button Google attribution text stays untranslated, one line, normal 16 px sans-serif with compliant dark color. Third-party provider attributions remain where supplied, and the official Places UI Kit attribution is untouched.

## Verification

- `pnpm test`: **767 passed**, 0 failed, 0 skipped; nine additional focused tests.
- `pnpm build`: passed.
- `git diff --check`: passed.
- Mobile browser review at 390 px: white house visible without text/frame, 44 px target, no page overflow; short help link; removed signup fields absent. BG → EN preserves entered state and changes accessible labels correctly. A two-character name passes the name/address-generation gate and proceeds to the missing-city validation. External booking mode still reveals the direct URL and explicit consent fields.
- No account created or registration submitted in browser QA. No real bookings, production data, migrations, quotas, keys, paid service or dependency changes. No Google/AI provider tests were run. Not deployed.

Screenshots: [registration mobile BG](2026-11-05/registration-simplified-mobile-bg.jpg), [short heading and Maps buttons](2026-11-05/short-heading-maps-mobile-bg.jpg). Local registration review URL: `http://127.0.0.1:3037/for-businesses?lang=bg`; the homepage review uses `/dev/homepage?lang=bg` with explicitly fictional data. Browser DOM verification found one `Google Maps` label per custom directions button, zero duplicate captions below the cards, and no page-width overflow at 390 px. The original preview tab is left open; temporary viewport overrides and the registration test tab were cleared.

Google attribution reference checked 2026-11-05: [Places API policies and attributions](https://developers.google.com/maps/documentation/places/web-service/policies). Included Google UI attribution cannot be removed or obscured; relocating our own caption does not alter it.
