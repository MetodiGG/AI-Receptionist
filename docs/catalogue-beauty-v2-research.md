# Beauty catalogue expansion v2 — source review

Checked **2026-11-06**, expires **2027-02-04** (90 days). Deliverable: `lib/discovery/catalogue-data/beauty-expansion-v2.json`.

## Result

66 new distinct Sofia premises across 47 official website domains: **20 barber, 25 hair, 17 nails, 4 beauty**. Seven records have independently published first-party coordinates; **59 deliberately remain unlocated**. Those records should not appear in precise nearby results until a compliant point is separately verified. No importer, existing catalogue record, photograph, rating, review, opening-hours field or price was changed or copied.

Each approved record retains a short appointment invitation, a first-party evidence URL, the exact published premises address, and a published phone or owner-linked booking flow. A contact page alone was not used as appointment evidence. Services are appointment services (`appointmentModel: appointment`); barber records are actual men's barber services, not laser studios. Neighborhoods are null unless explicitly identified by the source.

## First-party points retained

| Record | Published point | Source/configuration |
| --- | --- | --- |
| GLOSS! Nails Sofia | 42.6783258, 23.299543 | [Official homepage](https://gloss.bg/), GeoCoordinates JSON-LD and geo metadata |
| Classy Barbershop | 42.6673803, 23.3493594 | [Official homepage](https://www.classy-barbershop.com/), GeoCoordinates JSON-LD tied to Tintyava 84 |
| MD Hairclub | 42.6763725, 23.320218 | [Official homepage](https://mdhairclub.com/), GeoCoordinates JSON-LD tied to Breza 6 |
| Neda Art Nails | 42.7323634, 23.2979074 | [Owner's Wix site](https://nedaartnails.wixsite.com/studio), `businessLocationCoordinates` in Wix business configuration |
| COCO Dry Bar & Nail House | 42.6708981, 23.3520064 | [Official contacts](https://www.cocodrybar.bg/contacts), Squarespace location configuration with Nikolay Haytov 2 |
| Beauty by Betyna Yovcheva | 42.67408, 23.27062 | [Official homepage](https://beauty-nails-by-betyna-yovcheva.com/), GeoCoordinates JSON-LD |
| Magama | 42.692979433637, 23.307194709778 | [Official contacts](https://magama-shop.com/contacts), independently published latitude/longitude microdata |

Only literal business coordinates in first-party structured data or owner configuration were retained. Google Maps `@`, `!3d/!4d`, iframe viewport parameters and map-link-only points were not used.

## Inspected source highlights

- [Stephan](https://www.stephan.bg/) explicitly invites appointment booking and links its Sofia salon pages. Individual pages establish each salon's exact address, phone and haircut/nail menu. The hair and nail academies are included only as their separately documented **client salons**, not as course registrations.
- [Inspire's owner site](https://www.inspirebg.com/saloni-sofia) links [its own booking host](https://booking.inspirebg.com/inspire/bg/objects). Seven branch-specific booking pages publish appointment selection, services, street/block addresses and phones. The published phone is the destination here; no account was created and no reservation was submitted. The Student City booking page publishes a different phone from the marketing page; the branch booking page is the recorded contact source.
- [Artemida](https://artemidanail.com/saloni/) links separate owner-branded booking destinations for Rilski ezera 26 and Atanas Ishirkov 3. [MurphyStyle](https://murphystyle.com/en/saloni/) publishes two distinct salons and its reservation link.
- [Alexiev's](https://www.alexievsbarbershop.com/) is client-rendered: its published `/static/js/main.2c0142bb.js` branch configuration identifies Slatina and La Barberia separately, including exact addresses, phones and service menus. [Rock'n'Roll](https://www.rockandrollbarbershop.com/) likewise publishes its Setmore link and address inside its public Portfoliobox page configuration; the owner-linked [Setmore flow](https://rockandrollbarbershop.setmore.com/) confirms the bookable men's services.
- Independent studios include GLOSS!, Luxury Nails, Queen Beauty Room, B.A.R.D., Neda Art Nails, Y.D Beauty Brand, Noxic, Anna Nailz Art, Betyna, DORADO, Texture, King Barber, Barberians, Kano, Cutters and Barrnat. These are not a laser-chain branch fill.
- [EL's Makeup](https://www.elsmakeup.bg/ceni), [ClassaQueen](https://classaqueen.com/kozmetichni-protseduri-2/), [Skinni](https://skinni.bg/home/) and [MG](https://www.mgtheartofbeauty.com/) provide the beauty-specific appointments. No medical efficacy claims were copied.

## Conservative exclusions and limitations

- Luxury Nails' generic JSON-LD geo differs from the business marker link; DORADO's organization-level location configuration differs from the named salon address. Their appointment/contact facts qualify, but their coordinates remain null.
- SuperBarber Iztok was skipped because the official page gives both 12 and 14 on G. M. Dimitrov; only the unambiguous Vitosha premise was added.
- Poseidon currently identifies Varna, not Sofia, and was skipped. Demo sites with placeholder addresses/phones were excluded.
- Skeyndor Institute returned 403; Milenium returned 502/fetch failure. Neither became a record. GLOSS!'s owner-linked Studio24 target returned 403; its verified official phone is used instead. No access-control bypass was attempted.
- Some official salon addresses are exact residential-block premises rather than a numbered street building. Published block/entrance details were preserved; no street number, neighborhood or geocode was inferred.
- No metered Google API, Google/Studio24 bulk export, review/photo reuse, booking, account creation, email, contact submission or marketing outreach was performed.

## Validation

All 66 rows passed `catalogueRecordSchema` and `validateCatalogue`. Checked against the imported catalogue **and every other existing catalogue-data JSON file** (228 distinct existing IDs at validation time): no duplicate ID, exact booking destination + address, or normalized phone + address. The final integration should rerun these checks after all concurrent expansion files are present.
