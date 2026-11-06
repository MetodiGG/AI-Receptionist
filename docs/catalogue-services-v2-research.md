# Sofia services expansion v2 — reviewed appointment providers

Checked: **2026-11-06**. Recheck deadline: **2027-02-04** (90 days).

## Result

Added **60** records from **53 independent owner website domains** to `lib/discovery/catalogue-data/services-expansion-v2.json`. No existing records or importer files were changed by this research subtask.

| Category | Additions |
| --- | ---: |
| pets (grooming only) | 4 |
| health (physio / rehab / massage therapy) | 17 |
| education (reserved lessons / trial consultations) | 10 |
| consulting (bookable professional advice) | 10 |
| other (dental, psychological, speech appointments) | 19 |
| **Total** | **60** |

**11 premises have owner-published coordinates**. 59 records are premises; PhysioHome is an explicitly mobile Sofia service area and has no point or street address. Booking destinations: 23 forms / officially linked appointment flows and 37 published phone contacts.

## Review method and scope

- Read the current policy/schema, base catalogue and all three expansion inventories before adding providers. Compared new IDs, booking destination plus address, and normalized phone plus address against the current combined catalogue.
- Each accepted row has an owner-site appointment invitation connected to its named service and an exact Sofia address or an explicitly described Sofia home-visit area. A telephone or general contact page alone was not sufficient.
- First-party pages were read through web search/open; where a page's text renderer omitted widgets, the public owner HTML was inspected read-only for appointment markup, address text and JSON-LD/config data. No contact forms were sent, no calls or reservations made, and no accounts created.
- Form means an actual appointment/signup request flow or an owner-linked scheduling destination. For example: Vasилена Христова's appointment page contains Amelia v2 booking markup; Dental Place includes its appointment picker; LegalMasters and Simeonov expose dated consultation request forms; DM Physio's owner page supplies a two-premises booking selector.
- Neighborhoods are copied only when explicitly supplied by the owner. Unpublished neighborhoods and exact points remain null.
- No metered Google or AI APIs, geocoding, Google/Studio24 bulk exports, copied map payloads, ratings, reviews, photographs, inferred opening hours or prices were used. Public owner HTML was queried only for facts needed to verify each record.
- Multi-premises sites were not expanded mechanically: Serkan Uzun's two offices, DM Physio's two offices, OKTO's two clinics, Haelan's two named physiotherapy offices, iSmile's two current clinics, Учебен Свят's two explicitly stated lesson locations, and Звук по звук's two published locations were inspected individually in the owner location/service context.

## Sources by accepted record

The table is an audit index; the JSON retains only a short appointment excerpt (at most 180 characters), source URL and contact URL. The form requests are not claims of immediate confirmation or current slot availability.

| Record ID | Category | Provider | Official evidence and premises | Destination |
| --- | --- | --- | --- | --- |
| `sofia-zdravi-lapi-grooming` | pets | Здрави Лапи · груминг | [Appointment evidence](https://zdravilapi.com/uslugi/gruming/) · [Contact / premises](https://zdravilapi.com/uslugi/gruming/) | Published appointment phone |
| `sofia-bumbachka-grooming` | pets | Груминг салон Бумбачка | [Appointment evidence](https://www.bumbachka.eu/) · [Contact / premises](https://www.bumbachka.eu/) | Published appointment phone |
| `sofia-serkan-uzun-lyulin` | health | Серкан Узун · МЦ Ориндж | [Appointment evidence](https://fizioterapiya.bg/) · [Contact / premises](https://fizioterapiya.bg/) | Published appointment phone |
| `sofia-serkan-uzun-ortopedia` | health | Серкан Узун · УМБАЛ Ортопедия | [Appointment evidence](https://fizioterapiya.bg/) · [Contact / premises](https://fizioterapiya.bg/) | Published appointment phone |
| `sofia-avitsena-rehabilitation` | health | МЦ Авицена · рехабилитация | [Appointment evidence](https://avicenabg.net/) · [Contact / premises](https://avicenabg.net/) | Published appointment phone |
| `sofia-radoslav-valev-law` | consulting | Адвокат Радослав Вълев | [Appointment evidence](https://www.rvalev.bg/) · [Contact / premises](https://www.rvalev.bg/) | Published appointment phone |
| `sofia-dm-physio-studentski` | health | DM Physio · Студентски град | [Appointment evidence](https://www.dmphysi0.com/kineziterapiya-sofia.html) · [Contact / premises](https://www.dmphysi0.com/kineziterapiya-sofia.html) | [Officially linked booking flow](https://www.dmphysi0.com/book) |
| `sofia-dm-physio-mladost` | health | DM Physio · Младост 1А | [Appointment evidence](https://www.dmphysi0.com/kineziterapiya-sofia.html) · [Contact / premises](https://www.dmphysi0.com/kineziterapiya-sofia.html) | [Officially linked booking flow](https://www.dmphysi0.com/book) |
| `sofia-aura-massage` | health | AURA Massage Studio | [Appointment evidence](https://auramassage.bg/) · [Contact / premises](https://auramassage.bg/) | Published appointment phone |
| `sofia-mieli-massage` | health | Mieli Massage Studio | [Appointment evidence](https://mielimassage.studio/) · [Contact / premises](https://mielimassage.studio/) | Published appointment phone |
| `sofia-svetoslav-grigorov-law` | consulting | Адвокат Светослав Григоров | [Appointment evidence](https://www.snglawfirm.com/advokatski-honorari) · [Contact / premises](https://www.snglawfirm.com/kontakti) | Published appointment phone |
| `sofia-linnea-language-school` | education | Езикова школа Линеа | [Appointment evidence](https://linneaschools.com/kontakti/) · [Contact / premises](https://linneaschools.com/kontakti/) | [Officially linked booking flow](https://linneaschools.com/kontakti/) |
| `sofia-etud-drawing-lessons` | education | Галерия ЕТЮД · уроци по рисуване | [Appointment evidence](https://etudgallery.com/bg/2025/01/03/drawing-lessons/) · [Contact / premises](https://etudgallery.com/bg/2025/01/03/drawing-lessons/) | Published appointment phone |
| `sofia-avarton-music-academy` | education | Avarton Music Academy | [Appointment evidence](https://avartonmusic.com/conditions) · [Contact / premises](https://avartonmusic.com/) | Published appointment phone |
| `sofia-daga-vocal-studio` | education | Вокална студия Дъга | [Appointment evidence](https://daga.karnolsky.eu/contacts) · [Contact / premises](https://daga.karnolsky.eu/contacts) | [Officially linked booking flow](https://daga.karnolsky.eu/contacts) |
| `sofia-legalmasters-consultation` | consulting | LegalMasters · Недева и Йорданова | [Appointment evidence](https://legalmasters.bg/online-uslugi/sadebni-dela/consultation/) · [Contact / premises](https://legalmasters.bg/online-uslugi/sadebni-dela/consultation/) | [Officially linked booking flow](https://legalmasters.bg/online-uslugi/sadebni-dela/consultation/) |
| `sofia-edelweiss-accounting` | consulting | Счетоводна къща Еделвайс | [Appointment evidence](https://ewsbg.com/schetovodni-konsultatsii/) · [Contact / premises](https://ewsbg.com/schetovodni-konsultatsii/) | Published appointment phone |
| `sofia-happy-kids-dental` | other | HappyKids Dental | [Appointment evidence](https://happykids-dental.com/) · [Contact / premises](https://happykids-dental.com/) | Published appointment phone |
| `sofia-face-id-dental` | other | Face ID Dental Clinic | [Appointment evidence](https://faceid.bg/) · [Contact / premises](https://faceid.bg/) | Published appointment phone |
| `sofia-vesi-todorova-psychologist` | other | Веси Тодорова · психолог | [Appointment evidence](https://proektshtastie.bg/appointment/) · [Contact / premises](https://proektshtastie.bg/appointment/) | Published appointment phone |
| `sofia-desislava-kolchevska` | other | Десислава Колчевска · психолог | [Appointment evidence](https://www.terapia.bg/zapazi-cas-1) · [Contact / premises](https://www.terapia.bg/zapazi-cas-1) | [Officially linked booking flow](https://superdoc.bg/lekar/desislava-kolchevska) |
| `sofia-dental-place` | other | Dental Place | [Appointment evidence](https://dentalplace.bg/zapazete-chas/) · [Contact / premises](https://dentalplace.bg/zapazete-chas/) | [Officially linked booking flow](https://dentalplace.bg/zapazete-chas/) |
| `sofia-hrisiyana-varbanska` | other | Хрисияна Върбанска · психолог | [Appointment evidence](https://nirvanabyhv.bg/) · [Contact / premises](https://nirvanabyhv.bg/) | [Officially linked booking flow](https://superdoc.bg/lekar/hrisiana-varbanska) |
| `sofia-denta-plus` | other | Дента плюс | [Appointment evidence](https://www.denta-plus.net/index.php/bg/) · [Contact / premises](https://www.denta-plus.net/index.php/bg/) | Published appointment phone |
| `sofia-daniela-baldzhieva` | other | Даниела Балджиева · психолог | [Appointment evidence](https://danielabaldzhieva.com/contact/) · [Contact / premises](https://danielabaldzhieva.com/contact/) | Published appointment phone |
| `sofia-q-life-kinezitherapy` | health | МЦ Качествен Живот · кинезитерапия | [Appointment evidence](https://www.qlife.bg/kineziterapia/) · [Contact / premises](https://www.qlife.bg/kineziterapia/) | Published appointment phone |
| `sofia-bo-bella-grooming` | pets | Bo & Bella | [Appointment evidence](https://groomingsofia.com/контакт/) · [Contact / premises](https://groomingsofia.com/контакт/) | Published appointment phone |
| `sofia-love-your-pets-grooming` | pets | Love Your Pets Grooming | [Appointment evidence](https://loveyourpets.bg/) · [Contact / premises](https://loveyourpets.bg/) | [Officially linked booking flow](https://book.loveyourpets.bg/reservations/start?site=1) |
| `sofia-sofia-physio-center` | health | София Физио Център | [Appointment evidence](https://sofiaphysiocenter.com/) · [Contact / premises](https://sofiaphysiocenter.com/) | Published appointment phone |
| `sofia-okto-oborishte` | health | OKTO · Оборище | [Appointment evidence](https://okto.bg/procedure/rehabilitatsiya/) · [Contact / premises](https://okto.bg/kontakti/) | Published appointment phone |
| `sofia-okto-lozenets` | health | OKTO · Лозенец | [Appointment evidence](https://okto.bg/procedure/rehabilitatsiya/) · [Contact / premises](https://okto.bg/kontakti/) | Published appointment phone |
| `sofia-kainezi-therapy` | health | Kainezi Therapy | [Appointment evidence](https://kainezitherapy.com/services/kinesitherapy/) · [Contact / premises](https://kainezitherapy.com/contact-us/) | Published appointment phone |
| `sofia-nikolay-chudotvorets-rehab` | health | МЦ Николай Чудотворец · рехабилитация | [Appointment evidence](https://nikolaychudotvorets.bg/rehabilitacia/) · [Contact / premises](https://nikolaychudotvorets.bg/rehabilitacia/) | Published appointment phone |
| `sofia-lilia-stefanova` | other | Лилия Стефанова · психолог | [Appointment evidence](https://liliastefanova.bg/) · [Contact / premises](https://liliastefanova.bg/kontakti/) | [Officially linked booking flow](https://liliastefanova.bg/kontakti/) |
| `sofia-vasilena-hristova` | other | Василена Христова · психолог | [Appointment evidence](https://vasilenahristova.com/zapazi-chas/) · [Contact / premises](https://vasilenahristova.com/zapazi-chas/) | [Officially linked booking flow](https://vasilenahristova.com/zapazi-chas/) |
| `sofia-art-uroci-zhanet-zhecheva` | education | АртУроци · Жанет Жечева | [Appointment evidence](https://arturoci.com/) · [Contact / premises](https://arturoci.com/contacts/) | Published appointment phone |
| `sofia-innovation-private-lessons` | education | Образователен център Иновейшън | [Appointment evidence](https://innovationcenter.bg/) · [Contact / premises](https://innovationcenter.bg/) | Published appointment phone |
| `sofia-silvia-petkova-law` | consulting | ЕАД Силвия Петкова | [Appointment evidence](https://petkovalegal.com/kontakti/) · [Contact / premises](https://petkovalegal.com/kontakti/) | Published appointment phone |
| `sofia-simeonov-law-sofia` | consulting | СИМЕОНОВ АДВОКАТИ · София | [Appointment evidence](https://simeonovlawfirm.com/konsultatsia/) · [Contact / premises](https://simeonovlawfirm.com/zapazete-chas/) | [Officially linked booking flow](https://simeonovlawfirm.com/zapazete-chas/) |
| `sofia-georgi-malchev-law` | consulting | Адвокат Георги Малчев | [Appointment evidence](https://www.advmalchev.com/) · [Contact / premises](https://www.advmalchev.com/) | Published appointment phone |
| `sofia-rastashki-law` | consulting | Адвокатско дружество Расташки & CO | [Appointment evidence](https://advokatsofia.bg/) · [Contact / premises](https://advokatsofia.bg/) | Published appointment phone |
| `sofia-nikolay-dimitrov-insurance-law` | consulting | Адвокат Николай Димитров · застрахователно право | [Appointment evidence](https://zastrahovatelnopravo.com/kontakti/) · [Contact / premises](https://zastrahovatelnopravo.com/kontakti/) | Published appointment phone |
| `sofia-kavazova-tax-law` | consulting | Адвокатска кантора Кавазова | [Appointment evidence](https://advokatkavazova.com/консултация/) · [Contact / premises](https://advokatkavazova.com/консултация/) | [Officially linked booking flow](https://advokatkavazova.com/консултация/) |
| `sofia-haelan-bulgaria-rehab` | health | Хейлан Кеър · бул. България | [Appointment evidence](https://haelan.bg/kabineti/fizioterapevt-i-rehabilitator) · [Contact / premises](https://haelan.bg/medical-centres/mc-haelan-care-1) | [Officially linked booking flow](https://superdoc.bg/klinika/mts-poliklinika-bulgaria) |
| `sofia-haelan-mladost-rehab` | health | Хейлан Кеър 2 · Младост | [Appointment evidence](https://haelan.bg/kabineti/fizioterapevt-i-rehabilitator) · [Contact / premises](https://haelan.bg/medical-centres/mdc-haelan-care-2) | [Officially linked booking flow](https://superdoc.bg/klinika/mdc-haelan-care-2) |
| `sofia-sofia-dental-ivan-asen` | other | SofiaDental | [Appointment evidence](https://sofiadental.bg/zapazvane-na-chas/) · [Contact / premises](https://sofiadental.bg/zapazvane-na-chas/) | [Officially linked booking flow](https://sofiadental.bg/zapazvane-na-chas/) |
| `sofia-denta-pro` | other | Дента Про | [Appointment evidence](https://dentapro.bg/Contacts) · [Contact / premises](https://dentapro.bg/Contacts) | [Officially linked booking flow](https://dentapro.bg/Contacts) |
| `sofia-uzunov-dental` | other | Узунов Дентал | [Appointment evidence](https://www.uzunovdental.com/bg) · [Contact / premises](https://www.uzunovdental.com/bg) | Published appointment phone |
| `sofia-doctor-dent` | other | Доктор Дент | [Appointment evidence](https://www.drdent.bg/) · [Contact / premises](https://www.drdent.bg/) | Published appointment phone |
| `sofia-ismile-lozenets` | other | iSmile Dental Clinic · Лозенец | [Appointment evidence](https://ismile.bg/) · [Contact / premises](https://ismile.bg/contacts/) | Published appointment phone |
| `sofia-ismile-lyulin` | other | iSmile Dental Clinic · Люлин | [Appointment evidence](https://ismile.bg/) · [Contact / premises](https://ismile.bg/contacts/) | Published appointment phone |
| `sofia-diana-radeva-logoped` | other | Диана Радева · логопед | [Appointment evidence](https://logopedsofia.org/kontakti.html) · [Contact / premises](https://logopedsofia.org/kontakti.html) | [Officially linked booking flow](https://logopedsofia.org/kontakti.html) |
| `sofia-osoba-kinezitherapy` | health | Център Особа · кинезитерапия | [Appointment evidence](https://osoba.bg/rehabilitacia/kineziterapia) · [Contact / premises](https://osoba.bg/contact) | [Officially linked booking flow](https://osoba.bg/rehabilitacia/kineziterapia) |
| `sofia-physiohome-home-rehab` | health | PhysioHome · домашна рехабилитация | [Appointment evidence](https://physiohome.bg/) · [Contact / premises](https://physiohome.bg/) | Published appointment phone |
| `sofia-soul-ceramics` | education | Арт студио Керамика за душата | [Appointment evidence](https://soulceramics.bg/) · [Contact / premises](https://soulceramics.bg/contact/) | [Officially linked booking flow](https://soulceramics.bg/contact/) |
| `sofia-pink-cormorant` | education | Розовия Корморан | [Appointment evidence](https://pinkcormorant.com/klasove-i-ceni/) · [Contact / premises](https://pinkcormorant.com/) | [Officially linked booking flow](https://pinkcormorant.com/klasove-i-ceni/) |
| `sofia-ucheben-svyat-ivan-vazov` | education | Частна школа Учебен Свят · Иван Вазов | [Appointment evidence](https://uchebensviat.com/) · [Contact / premises](https://uchebensviat.com/) | Published appointment phone |
| `sofia-ucheben-svyat-mladost` | education | Частна школа Учебен Свят · Младост 3 | [Appointment evidence](https://uchebensviat.com/) · [Contact / premises](https://uchebensviat.com/) | Published appointment phone |
| `sofia-zvuk-po-zvuk-pozitano` | other | Звук по звук · Позитано | [Appointment evidence](https://zvukpozvuk.bg/services) · [Contact / premises](https://zvukpozvuk.bg/booking) | [Officially linked booking flow](https://zvukpozvuk.bg/booking) |
| `sofia-zvuk-po-zvuk-velcho-atanasov` | other | Звук по звук · Велчо Атанасов | [Appointment evidence](https://zvukpozvuk.bg/services) · [Contact / premises](https://zvukpozvuk.bg/booking) | [Officially linked booking flow](https://zvukpozvuk.bg/booking) |

### Source quality notes

- iSmile's main page and current [contacts](https://ismile.bg/contacts/) agree on **Бунтовник 3** and **Царица Йоанна 57Б**, with individually named appointment phones. An old duplicate owner page at `/1619-2/` still shows a former Lozenets address, **Свети Осий Кордобски 124Б**; that obsolete address was not added. Direct owner opens timed out; the current indexed first-party main/contact contents were inspected instead. No third-party directory address was used.
- The current [Учебен Свят homepage](https://uchebensviat.com/) explicitly offers an on-site or online trial lesson and lists both Sofia lesson premises. It is one phone with two separately published addresses, not two records for different subjects at the same premises.
- [Haelan's physiotherapy page](https://haelan.bg/kabineti/fizioterapevt-i-rehabilitator) identifies physiotherapist Пламен Стойнев at both Bulgaria and Mladost. The inspected owner branch pages each provide their exact address, phone and branch-specific Superdoc destination. No The Mall branch or lab visit was inferred.
- The [Звук по звук services page](https://zvukpozvuk.bg/services) names 60-minute diagnostic appointments and lists both Sofia premises; the owner [booking page](https://zvukpozvuk.bg/booking) accepts a consultation request for confirmation. The published central appointment phone is retained for both.
- OMNI Amaya is **already present** as `sofia-omni-amaya-massage` in the base services expansion, so it was not duplicated. Owner content specifies massage therapy at Fitness Flais Amaya, not fitness admission.

## Coordinate provenance

No point was derived from an address, district name or map search. The following precise values come from the owner site's explicit coordinates/configuration, not a fetched Google Maps page.

| Record ID | Latitude, longitude | Source | Owner field |
| --- | --- | --- | --- |
| `sofia-bumbachka-grooming` | 42.6779305, 23.2914844 | [Owner source](https://www.bumbachka.eu/) | Published Waze / Moovit destination in owner HTML |
| `sofia-dm-physio-studentski` | 42.656166, 23.344392 | [Owner source](https://www.dmphysi0.com/kineziterapiya-sofia.html) | First-party JSON-LD with premises address |
| `sofia-mieli-massage` | 42.6842115, 23.2973189 | [Owner source](https://mielimassage.studio/) | First-party JSON-LD with premises address |
| `sofia-svetoslav-grigorov-law` | 42.6875119, 23.3011797 | [Owner source](https://www.snglawfirm.com/kontakti) | Wix businessLocationCoordinates, street number 55 |
| `sofia-dental-place` | 42.6589811, 23.2790842 | [Owner source](https://dentalplace.bg/zapazete-chas/) | First-party JSON-LD with premises address |
| `sofia-hrisiyana-varbanska` | 42.7105, 23.3492 | [Owner source](https://nirvanabyhv.bg/) | First-party JSON-LD with premises address |
| `sofia-denta-plus` | 42.688428, 23.328937 | [Owner source](https://www.denta-plus.net/index.php/bg/) | Owner mapCenterCoordinate config, Graf Ignatiev 41A |
| `sofia-kainezi-therapy` | 42.6730275, 23.3120305 | [Owner source](https://kainezitherapy.com/contact-us/) | First-party JSON-LD with premises address |
| `sofia-simeonov-law-sofia` | 42.7006813, 23.3351368 | [Owner source](https://simeonovlawfirm.com/zapazete-chas/) | First-party JSON-LD with premises address |
| `sofia-georgi-malchev-law` | 42.6992386, 23.3081066 | [Owner source](https://www.advmalchev.com/) | First-party JSON-LD with premises address |
| `sofia-uzunov-dental` | 42.68625, 23.299413 | [Owner source](https://www.uzunovdental.com/bg) | First-party JSON-LD with premises address |

### Candidate coordinate corrections for existing records (not applied)

These are reported separately for the integrating owner to audit; no existing JSON was edited.

| Existing record | Owner JSON-LD latitude, longitude | Sourced street address | Source |
| --- | --- | --- | --- |
| `sofia-physio-be-active` | 42.68699, 23.302904 | ул. Феликс Каниц 20 | [Owner homepage](https://physiobeactive.bg/) |
| `sofia-rhythm-academy` | 42.6351614, 23.3065149 | ул. Цветарска 12, кв. Драгалевци | [Owner homepage](https://rhythm-academy.com/) |
| `sofia-drum-action` | 42.6971, 23.3309 | бул. Княз Александър Дондуков 17 | [Owner homepage](https://drumaction.com/) |

### Rejected coordinate metadata

- [OKTO contacts](https://okto.bg/kontakti/) publishes JSON-LD latitude **42.6770432**, longitude **26.345472**. The longitude is outside Sofia and outside the catalogue schema, so neither OKTO branch received that point. Coordinates embedded in owner Google map hyperlinks were not substituted.
- [OMNI](https://www.omnibodyclinic.com/) JSON-LD describes **Dedeagach St 11A**, not the currently listed Iztok/Druzhba/Amaya premises, and supplies **42.6977, 23.3219**. It was not assigned to any existing branch.
- [MM Therapy](https://mmtherapy.bg/) JSON-LD also supplies **42.6977, 23.3219**, with only generic streetAddress “Sofia”; no exact-premises point was accepted.
- Other owners supply only address text, Google embed/link centers or short map URLs. Those do not establish an approved exact point here.

## Excluded / uncertain candidates

- **Happy Paws** (`happypaws.bg`): indexed owner text describes booked grooming and a Sofia address, but a direct read returned 403. Omitted conservatively; no retries or workaround.
- **City Music School**: the official indexed contact text supports reserved lessons at Graf Ignatiev 7B, but direct access presented a verification challenge. Omitted; challenge not bypassed.
- **Адвокат Венелин Йорданов** (`nakazatelenadvokat.bg`): direct owner read returned 429. Omitted; throttle respected.
- **Крумова и Партньори** (`e-advokat.bg`): direct owner read returned 403. Omitted.
- **Мирчев Акаунтинг** (`macbg.com`): indexed appointment evidence exists, but the service URL returned 404 and homepage 403. Omitted.
- **Sisters of Dogs / Kingdom of Grooming**: owner site publishes grooming, address and phone but no explicit advance appointment invitation was found. Omitted.
- **Син Кръст grooming**: official evidence is strong, but the exact published premises is Pancharevo, not a verified Sofia city-code 68134 premises. Omitted from this city-scoped file.
- **RoSSy's Art Grooming**: official owner page says Varna. **Стройкомерс 2002 / Evropc**: official consultation page says Burgas. Both omitted despite Sofia search matches.
- **Vox Studio**: explicit trial-lesson flow exists, but inspected owner text only says “Люлин - център” without a sourced street/block address. Omitted.
- **Healing Hands**: service/address are published, but the explicit scheduling invitation was Viber chat. No unsupported phone-as-booking substitution or chat destination type was introduced.
- **The Groom Room, Doreta, Joy, Hearty Grooming, CANE**: independent owner sites were unavailable, timed out, or did not expose adequate current appointment evidence during the bounded check. Directory details were not imported.
- No lab visits were added: this batch does not turn generic blood-test or walk-in laboratory contact pages into appointments.

## Validation

- `validateCatalogue([...SOFIA_CATALOGUE, ...newRecords])`: passed with the current schema.
- Existing/new duplicate IDs and booking-kind/destination/address checks: passed.
- Normalized phone plus address collision scan: passed.
- All rows have `approved`, checkedOn `2026-11-06`, validUntil `2027-02-04`; all evidence excerpts are at most 180 characters.
- All precise points use `first_party_coordinates`; the mobile service has coordinates null.
- Importer integration, application build, tests, deployment and any corrections to pre-existing records remain the root agent's responsibility.
