# AI Search as the only public finder — 28 October 2026

## Requested change

The owner retired the separate filter-and-list directory and requested AI Search immediately on opening the site. The existing full DiscoveryPage now renders at `/`, without the marketing hero, animated booking story, static directory, compact-to-results navigation or directory fallback. Search results appear on that same page after an explicit query. `/search` continues to expose the same finder for existing links.

All public Find an appointment actions (navigation, footer and customer account) now open the home AI finder. The standard-directory link and its error-state suggestion were removed. The former `/businesses` page redirects only to the fixed local home URL, preserving BG/EN but discarding old directory filters and untrusted redirect parameters. The retired route is removed from the sitemap. Old home hashes for clients/finder/how resolve to the AI input; the legacy business-login hash and account-deletion notice remain supported.

Business registration, owner/customer login, account history, real business booking pages, internal GoRez search and business data remain intact. Native Google results retain photos, attribution and external-only links. Existing directory helpers/components and the public data endpoint are not destructively deleted; they are no longer a public browsing mode. The booking-story component also remains available to its development QA fixture, not the home page.

## Safari city/icon fix

The city label now uses a genuine grid column for its location icon, followed by a separate native select column. The icon is no longer absolutely positioned over the native widget. This avoids relying on Safari's internal text padding, preserves the native picker/keyboard behavior and does not replace it with a custom JavaScript dropdown. At the narrowest breakpoint the icon is hidden and the select occupies the single column.

## Safety and cost

No database migration, tenant/appointment/customer deletion, credential or permission changes, paid-AI activation, provider quota changes, billing/subscription changes or new dependencies are included. The existing discovery flag still gates the home finder; when disabled the page shows a clear unavailable state, never revives the directory or mounts an ungated search. No provider request is triggered by simply opening the page.

## Checks before publishing

- 329 automated tests passed (four new AI-entry/icon regressions, plus updates to tests for the intentionally retired home/directory behavior). Existing booking, ownership, security, onboarding, email and database tests remain passing.
- Production build passed, including Next compiler/type step. No separate lint script is configured.
- Local browser checks: one AI heading/input on home, Sofia initially selected, no directory links/cards, closed secondary filters; 390 px and 320 px layouts without horizontal overflow. At 390 px the icon and select have separate bounding boxes with an 8 px gap; at 320 px the icon is hidden and Sofia remains readable.
- The actual browser followed `/businesses?lang=en&city=Sofia` to `/?lang=en` and displayed the English AI finder. Nine local HTTP checks covered BG/EN, malicious redirect/language parameters, home/search, account, onboarding and login. Next's streaming redirect uses its documented meta-refresh response where headers have already streamed, not necessarily HTTP 307.
- Local QA used explicitly disabled Google, AI, email and real-database credentials. Production/Safari postflight is recorded separately after publishing; local screenshots do not imply live provider verification.

## Production postflight

- Source `51ff34fa10f8cd34a38aa1144442b17c9ef9e7aa` reached Ready in Production deployment `J3fktEEVyp31ZF3QLNaHbswX1WAx` (`ai-receptionist-d68cazg2p-ai-receptionist12.vercel.app`). The public `www.gorez.co` root showed one AI heading/input, Sofia and zero catalogue links. No migration, secret, paid service or deployment setting was edited.
- An actual Safari tab on the public origin visibly confirmed that the location icon and Sofia no longer overlap. Evidence: `/tmp/gorez-ai-only-safari-20261028.png`. Production mobile checks at 320 and 390 px had no horizontal overflow; the visible icon and select at 390 px had an 8 px gap. Evidence: `/tmp/gorez-ai-only-mobile-20261028.png`.
- The old public `/businesses?lang=en&city=Sofia` URL actually navigated to `/?lang=en` and the English AI finder, with no legacy directory rendered.
- One explicit city-only manicure query from the new home page returned the genuine GoRez partner with its supplied photograph, service price and booking link, alongside the separately attributed native Google list. Opening the existing partner booking page confirmed its profile and booking controls still render. No appointment was submitted, no location permission was requested again, and no email was sent.
- Temporary viewport overrides were reset and temporary test tabs were closed. The new public home page was left open as the user-facing result. All code tests/build were completed before release; this follow-up only records observations.
