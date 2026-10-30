# Eligible local partners first — 30 October 2026

## Implemented locally; no deployment or provider configuration changes

The owner requested that GoRez partners appear before external search results,
but only when relevant and convenient for the client's selected area. This
increment needs no additional migration, credentials, provider fields, paid AI,
location permission, or Google quota increase. The previous business editing /
media release still requires its separately proposed migration and Storage
activation; that pending approval has not been inferred from this request.

## Rules

1. First filter published active GoRez businesses by actual active services,
   city, requested quarter, budget and supported payment preference. A business
   name alone is no longer sufficient evidence for a service match.
2. Recognise district groups derived from the local neighbourhood registry:
   e.g. **Връбница** includes Връбница 1/2, but an explicit Връбница 1 does not
   include Връбница 2. BG and the existing Bulgarian transliteration work; common
   `ж.к.` / `кв.` prefixes do not break owned-business metadata matching.
   A typed quarter is retained even with consented Near me coordinates instead
   of a selected city. This does not infer the client's actual city or location.
3. Near me requires business coordinates inside the selected radius (default
   remains 2 km, minimum 1 km). Missing/invalid coordinates cannot qualify as
   nearby. Radius gates use full-precision straight-line distance, not the
   one-decimal display value. A place 2.04 km away cannot qualify for 2 km just
   because its display rounds to 2.0. Distance is not a travel-time estimate.
4. Reapply location eligibility immediately before ranking and deduplication.
   Eligible partners get a separate first tier, not an inflated relevance score.
   An excluded partner never reappears just to fill an empty partner section.
5. Existing availability checks are unchanged and still bounded. If all checked
   matching services are known unavailable for the requested date/time, remove
   that partner. Unchecked/provider-failed availability stays explicitly unknown;
   no estimated or fabricated appointments. Booking revalidation is unchanged.
6. Hide an external duplicate only for a reviewed Place ID association to a
   partner **actually visible** in this response. If availability removes that
   partner, the external UI Kit ID can remain; its availability is still unknown.
7. Render the partner group first in every search layout. Real partner cards
   carry the existing orange/green GoRez symbol, a readable 17px **GoRez партньор**
   badge and green accent. External cards/SDK listings never receive this badge.
   The All / GoRez partners filter continues to work in BG/EN.
8. Keep the EEA Google-rendered list separate and in provider order. Provider
   searches include the requested quarter; consented-radius searches discard
   out-of-radius IDs using the already permitted coordinate fields. We do not
   scrape UI Kit names/addresses or claim independently verified neighbourhood
   boundaries for Google's listings. No new Places fields, calls or billing tier.

If the client selects only Sofia and supplies no quarter/location, GoRez can
only return city-wide results. It never silently obtains GPS, infers a quarter
from IP/account data, calls these places nearby, or promises that they are the
closest. The UI's expandable ranking explanation discloses partner priority and
this location limitation. No extra helper paragraphs were added to the form.

## Verification

- Priority phase: 404 automated tests passed (393 previous + 11 new
  priority/locality tests). The combined category-art release now has 410
  passing tests; no previous tests were removed.
- Regression scenarios include the owner's Връбница versus Манастирски ливади
  example, zero local partners, exact numbered quarters, English names,
  stale/missing coordinates, 1/2 km precision boundaries, a higher-scoring
  external result, total result cap, service/budget/publication filtering,
  unknown versus unavailable slots, and EEA deduplication after availability.
- Local development fixture uses clearly fictional businesses and an injected
  in-memory provider response: no real Google/AI call, signup, booking, cloud
  write, email or geolocation prompt. Mobile BG/EN at 390px/320px has no horizontal
  overflow; the partner group precedes the external group and the partners-only
  filter removes external cards without relabelling them.
- Proof: `/tmp/gorez-partners-first-mobile-local-20261030.png` (fictional local
  fixture, not a screenshot of Production or real provider results).
- The priority-phase optimized build passed. The final combined build with
  category artwork is recorded in `premium-category-art-2026-10-30.md`.
  Actual live search and publishing remain unverified/not performed.
