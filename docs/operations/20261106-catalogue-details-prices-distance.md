# Catalogue details, sourced prices and distance-only badges

## Scope

- An explicit **Виж детайли / View details** action above the aligned directions/booking buttons. It opens the existing lazy, accessible dialog with services, conditions, prices, hours, address and first-party sources. No new booking engine or inferred appointments.
- Existing GoRez rating summaries now follow the service list. No Google rating is copied, enabled, blended with GoRez reviews or stored in the catalogue.
- A street/quarter is never used as a distance badge. Exact points display straight-line kilometres from the allowed visitor point or the labelled city centre. An unresolved distance displays **— km**, never 0 km or an estimated neighbourhood pin. Full addresses stay in the dialog. Service-area businesses do not get a fake fixed premises point.
- Generic **бойни изкуства**, **бойна зала**, **martial arts**, **combat sports** searches match published reserved disciplines, not gym admission, yoga or arbitrary sports halls.

## First-party review completed in this change

Prices are literal EUR amounts from the service/price pages, scoped to each exact service and branch. Every price has a source URL and check date; existing 90-day expiry still applies.

| Existing records | Reviewed sources | Result / qualification |
| --- | --- | --- |
| Abi Beauty, six branches | https://abibeauty.bg/kontakti/ ; https://abibeauty.bg/tseni/ ; https://abibeauty.bg/manikjur-i-pedikjur/ | Manicure at four branches, pedicure only at Lozenets/Druzhba 1/Druzhba 2 (not Serdika); hair only at Lozenets and Druzhba 1. Laser prices distinguish women/men and require online booking. Published daily hours. |
| ZONA WASH | https://zonawash.bg/цени/ ; https://zonawash.bg/контакти/ | Attended appointment services only. Sedan/SUV/one-seat costs separated. Official Timify destination replaces phone-only action. No self-service wash added. |
| Моториста | https://www.motorista.bg/avtomivka/leki-avtomobili ; https://www.motorista.bg/avtomivka | Sedan/hatchback prices; maintained vs heavily soiled vehicle conditions retained. Ranged upholstery price shown as “from”, with full range in details. Published hours. |
| Wash & Go | https://www.washandgodetail.com/services | Actual named packages/from prices. The site's 00:00–00:00 text is not imported as 24/7 hours. |
| Автомивка LUX · МБАЛ Света София | https://www.mbal-sofia.com/services/1 | Read the linked 2026 EUR price-poster image, not just HTML. Separate sedan, seat and wheel prices. Exact hospital-address building point manually disambiguated from the **already saved approved batch**: OSM hospital building way/1551254006, not the neighbouring ATM. No new geocoding request. Public ODbL point export updated. |
| Бастет | https://bastetkickboxing.com/цени/ | Coach-specific individual price; monthly group pass explicitly labelled, not a single-session price. |
| Цанев, five existing halls | https://tsanev.bg/ | Only the first reserved trial is free; not all karate classes. |
| Beauty Studio Marry, two branches | https://beautystudiomarry.com/services ; https://beautystudiomarry.com/booking ; https://beautystudiomarry.com/contact | Published styling types and Mon–Sat hours. No public service price found; the 50 EUR deposit is **not** imported as a service price. Kuklata's text address and embedded map query conflict, so no inferred point. |
| Twisted, two gyms | https://twistedjiujitsu.com/contact/?lang=en | Branch-labelled coordinates published in the owner's contact-page map configuration. No Google request. |

Abi's contact-page structured coordinates do not align reliably with its published branch addresses/existing independently reviewed points. They are **not** imported. ZONA WASH's iframe viewport centre is **not** accepted as its exact entrance point. No new Nominatim batch without the requested owner authorization.

This is a targeted review of existing records, **not** a claim that all 595 businesses, prices or missing coordinates have been rechecked. The original catalogue still excludes walk-in-only car washes, gym entry and unverified appointment availability.

## Google rating-only option: research, not activation

Checked 2026-11-06 against official documentation:

- https://developers.google.com/maps/documentation/javascript/places-ui-kit/place-details supports selecting `gmp-place-rating` without `gmp-place-reviews`. Required Google attribution/notices remain visible. Never scrape a widget or cache its numeric rating into catalogue JSON.
- https://cloud.google.com/terms/maps-platform/eea/maps-service-terms — EEA restrictions apply; Places UI Kit has a specific exception under 15.3 and attribution obligations under 16.1. An arbitrary REST rating badge in a discovery catalogue is not assumed permitted.
- https://developers.google.com/maps/billing-and-pricing/pricing and https://developers.google.com/maps/billing-and-pricing/sku-details/places — Basic **Places UI Kit Query** currently has 10,000 free events/month, then US$1/1,000 in the first paid tier. **Advanced Places UI Kit Pro** has 5,000, then US$5/1,000. Billing is per widget request, not per comment or only for extra fields. Shared account usage and other SKUs still matter. Ten independent place widgets can mean ten events, not one search.

A next implementation would require owner-approved API configuration, verified Place ID mappings, current EEA/product suitability review and explicit budget protections. Prefer opt-in/on-detail loading rather than charging for every catalogue card/visit. No paid request, SDK activation, key/environment/quota change or live database mutation is part of this change.

## Validation

Unit tests cover true/unknown distances, source dates, branch restrictions, package units, free trials, ambiguous/deposit prices, martial-arts matching and the modal action/order. Browser QA must cover desktop/mobile, BG/EN, keyboard/Escape and equal footer alignment. Search remains the existing free catalogue path.

Completed locally: **951 tests passed**, production build passed, `catalogue:check` and `git diff --check` passed. Browser QA at 1280/390/320 px: no page/dialog horizontal overflow, all visible card-footer baselines equal, details open, Escape returns focus to the triggering button, BG/EN controls work. No Google SDK script loaded in the catalogue fixture. Bookings disabled in the local fixture; no production appointment was created.

Inventory after this change: **595** businesses (unchanged), **125** reviewed points (86 first-party + 39 OSM), **90** priced services at **31** businesses, **76** with sourced hours. Searchable appointment-service coverage includes **11** car washes and **17** martial-arts records; nearby eligibility still requires an actual point. This adds 65 priced services at 16 previously unpriced businesses and three points; it does not complete the remaining unlocated inventory.
