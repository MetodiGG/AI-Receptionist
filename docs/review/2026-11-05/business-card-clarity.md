# Business card clarity — local implementation and provider boundary

Branch: `codex/discovery-card-clarity`, after published application revision `691a7e58c8504ae2d8667ecc0dd25cc19f9f7709` and its local release record. This change is **not published**.

## Implemented and verified

- Changed the public Bulgarian barber category to **Бръснарница**, retaining the short homepage **Бръснар**, existing IDs and accepted aliases. The new wording retains the exact `barber_shop` Nearby type instead of silently becoming a broader query.
- Normalized internal results retain a first-party `businessCategory`, `industry` and active public service names separately from the requested search category. A barber matching a hair search no longer becomes a hairdresser in its card. No tenant ID/name special case or database edit was introduced.
- Nail services say **Маникюр, педикюр** only when both are actually present. Accounting/tax specializations require service evidence; otherwise consulting stays generic. Other card details show at most two actual deduplicated active service names, never AI-invented specialties. Owner-entered service names are not automatically translated.
- A read-only request to the existing public GoRez directory verified the new pure presentation functions produce **Zen Barbershop → Бръснарница** and **ВЕСИ СТУДИО → Маникюр, педикюр** using the actual published service records. Their business names and records were not edited.
- Card order is photo/distance, partner badge, name, type, actual reviews, optional service detail, optional address, actions. Unknown ratings are not fabricated. Google/GoRez review sources remain separate.
- Removed the flex-stretch dependency between a GoRez card and the entire Google list chunk: business rail aligns at the start, card height is automatic, and action margin no longer consumes all free height. Empty reviews no longer reserve a fixed minimum height.
- Custom GoRez-owned card actions use **Резервирай час**. Existing permitted non-EEA/raw-contact cards use the same visible phrase and retain validated website-first/phone fallback, no action when no contact exists, and accessible explanatory labeling. A general website remains explicitly unverified as an online booking flow; no availability or completed reservation is promised. This custom fallback is **not** the live Bulgarian native Google widget and is not presented as a fix to it.
- Native Google rail gets only documented compact typography/spacing, orange theme values and `truncation-preferred` for long names. Attribution, provider content and actual actions remain intact. Provider rendering still needs a separately approved live check; no Google/AI search was run.

## Google requirements still unresolved

The existing EEA integration renders one attributed Advanced Place List per reserved batch. It is not the same component as the custom GoRez cards.

- Google documents that predefined `open-website`, `call`, `open-directions` labels ignore a custom `label`; custom links require an independently known `href`. A generic website is not proof of online reservations. The existing list does not expose website/phone data for choosing a single conditional custom booking action.
- A list's template selects content but the widget determines its order. Changing the order of the child declarations does not guarantee type-before-rating in the native cards.
- The batch widget has no documented per-card distance overlay control in the current integration. The server's permitted ID/coordinate calculations already support radius/ranking, but matching a separate overlaid badge to rendered cards would be unreliable when Google omits a failed item. No guessed positional overlays were added.
- Individual native widgets/custom independently sourced cards, additional contact enrichment or alpha-only custom slots would require a separately reviewed implementation, billing/permission decisions and live verification. This task did not switch APIs/channels, increase requests/quotas, fetch extra Google fields, scrape shadow DOM or replace native content with a counterfeit card.

Thus **native Google “Maps + one conditional Reserve button”, native type/review reordering and per-card km badges are not complete**. They must not be represented as working based on the development fallback fixture.

Official sources checked for this task:

- [Place links, actions and label limitations](https://developers.google.com/maps/documentation/javascript/reference/place-widget-child-elements#PlaceLinkElement)
- [Advanced Place List configuration and exposed interface](https://developers.google.com/maps/documentation/javascript/reference/places-widget#AdvancedPlaceListElement)
- [Widget content order](https://developers.google.com/maps/documentation/javascript/reference/place-widget-child-elements#PlaceContentConfigElement)
- [Documented styling](https://developers.google.com/maps/documentation/javascript/places-ui-kit/custom-styling)
- [EEA source/attribution restrictions](https://cloud.google.com/terms/maps-platform/eea/maps-service-terms)

## QA

- **797 tests passed, 0 failed, 0 skipped**. The one older exact-source art assertion was updated to use the independent business-category resolver; the new behavioral tests cover wrong search categories, real service evidence, inactive services, generic consultants, safe contacts and layout guards.
- `pnpm build` passed; whitespace check passed. No dependencies or migrations added.
- Development-only `/dev/business-cards?lang=bg` uses explicitly fictional names, reviews and distances, with all bookings/outbound actions disabled and no provider widget or script. A deliberately tall 850px block reproduces the former rail-height condition.
- At 1440px, cards are ~403–502px high next to the 850px block; the gap before the action grid is 6–8px, not hundreds of pixels. At 320px, document width remains exactly 320px and button scroll/client widths are equal at 124px. Type precedes reviews. BG and EN layouts were checked.
- An old long-running local server retained the previous server-side module while the client used the new version. Restarted only that verified worktree's server on the same port. A fresh server response and browser reload then agreed on all four categories and new button wording, with no new hydration error. This is not suppressed with a hydration bypass.
- Proof: `card-clarity-desktop-bg.png`, `card-clarity-mobile-bg.png`. These are **synthetic local card tests, not real Google card screenshots**. The viewport override was reset and the local review left open.

No production deployment, business/customer/appointment edit, Google key/quota/budget change, paid activation or real booking was performed.
