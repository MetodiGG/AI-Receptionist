// Manually reviewed intake. Parent assigns identities and exact service photos.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const zaris = 'https://zarisspa.bg/'
const o2 = 'https://o2therapy.bg/'
const o2Venue = 'https://o2therapy.bg/masazh-sofia.html'
const o2Book = 'https://www.o2therapy.bg/rezervacii/'
const hbm = 'https://www.hbm.bg/'
const hbmBook = 'https://www.hbm.bg/запазване-на-час/'
const hbmPrices = 'https://www.hbm.bg/цени/'
const hbmContact = 'https://www.hbm.bg/контакти/'
const sense = 'https://sensewellnesssofia.freshasite.com/'
const senseContact = 'https://sensewellnesssofia.freshasite.com/contact'
const senseServices = 'https://sensewellnesssofia.freshasite.com/services'
const senseBook = 'https://www.fresha.com/a/sense-wellness-sofia-sofia-bulevard-tsar-osvoboditel-16-kn69c1w7/booking?pId=2523529&swb=1&swbs=01a11140-0af1-7997-ba75-e7c271da81ba&swbp=01a11140-0af4-7472-87bd-a6bf185995a3'
const grand = 'https://www.grandhotelsofia.bg/fitness-and-spa/'
const grandPrices = 'https://www.grandhotelsofia.bg/wp-content/uploads/2025/07/spa-menu-25-web.jpg'
const grandContact = 'https://www.grandhotelsofia.bg/contacts/'
const ortus = 'https://www.hyatt.com/en-US/spas/Ortus-Wellness/home'
const ortusAbout = 'https://www.hyatt.com/en-US/spas/Ortus-Wellness/about'
const ortusTreatments = 'https://www.hyatt.com/en-US/spas/Ortus-Wellness/treatments'
const ortusContact = 'https://www.hyatt.com/en-US/spas/Ortus-Wellness/contact'
const padmalaya = 'https://www.padmalaya.bg/'
const padmalayaContact = 'https://www.padmalaya.bg/masajno-studio-sofia/'
const padmalayaPrices = 'https://www.padmalaya.bg/ceni-na-masaji-sofia/'
const golden = 'https://goldenhandsbg.com/'
const goldenMenu = 'https://goldenhandsbg.com/масажи/'
const goldenContact = 'https://goldenhandsbg.com/контакти/'
const healing = 'https://studiohealinghands.com/'
const crystal = 'https://www.crystalpalace-sofia.com/fitness-services/crystal-palace-wellness-club-sofia'
const crystalContact = 'https://www.crystalpalace-sofia.com/contacts'
const crystalRequest = 'https://www.crystalpalace-sofia.com/services-request/19'
const crystalPrices = 'https://www.crystalpalace-sofia.com/uploads/manager/source/SPA%20menu/CP/2026/Wellness%20club%20PRICELIST_EN_EURO.pdf'
const crystalSwedish = 'https://www.crystalpalace-sofia.com/offers-and-vouchers/swedish-massage-classic-relaxation-and-balance/501'
const base = { cityCode: '68134', neighborhood: null, locationKind: 'premises', coordinates: null, category: 'health' }
const price = (name, amount, durationMin, sourceUrl, description, currency = 'EUR') => ({
  name, category: 'health', appointmentModel: 'appointment',
  price: { amount, currency, kind: 'fixed', sourceUrl, checkedOn, validUntil },
  ...(durationMin ? { durationMin, durationSourceUrl: sourceUrl, durationCheckedOn: checkedOn } : {}),
  ...(description ? { description } : {}),
})
const week = (sourceUrl, open, close) => ({ sourceUrl, checkedOn, days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open, close }] })) })
const o2Condition = 'Публикувана цена за София. Терапевтът, продължителността и крайната цена се потвърждават при записване.'

const records = [
  {
    ...base, id: 'sofia-healing-hands-chavdar39b', name: 'Healing Hands Studio Sofia', neighborhood: 'Витоша',
    address: 'София, кв. Витоша, ул. Чавдар Мутафов 39Б-1', website: healing, phone: '+359888677759',
    booking: { kind: 'phone', phone: '+359888677759' },
    services: [
      { name: 'Класически масаж', category: 'health', appointmentModel: 'appointment' },
      { name: 'Хавайски масаж Ломи-ломи', category: 'health', appointmentModel: 'appointment' },
      { name: 'Масаж с топли камъни', category: 'health', appointmentModel: 'appointment' },
    ],
    openingHours: { sourceUrl: healing, checkedOn, days: [{ weekday: 1, periods: [] }, ...[2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '11:00', close: '20:00' }] }))] },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: healing, excerpt: 'Запази час — собствен телефонен линк tel:+359888677759. Отделно се предлага записване чрез Viber.' }, contact: healing },
  },
  {
    ...base, id: 'sofia-crystal-palace-wellness-shipka14', name: 'Crystal Palace · Wellness Club',
    address: 'София, ул. Шипка 14, Crystal Palace Boutique Hotel', website: crystal, phone: '+359886185811',
    booking: { kind: 'phone', phone: '+359886185811' },
    services: [
      price('Шведски масаж', 41, 50, crystalPrices),
      price('Частичен масаж', 31, 30, crystalPrices),
      price('Ароматерапия', 58, 50, crystalPrices),
    ],
    openingHours: week(crystal, '09:00', '21:00'),
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: crystalSwedish, excerpt: 'For reservations & additional information: +359 2 9 489 496 | +359 886 18 58 11. Swedish massage — 50 min.' }, contact: crystalContact },
  },
  {
    ...base, id: 'sofia-padmalaya-sedmochislenitsi9', name: 'Padmalaya · център за масаж', neighborhood: 'Лозенец',
    address: 'София, ул. Свети Седмочисленици 9, на гърба на първия блок, втората врата', website: padmalaya, phone: '+359883331617',
    booking: { kind: 'phone', phone: '+359883331617' },
    services: [
      price('Класически масаж — 60 минути', 55, 60, padmalayaPrices),
      price('Релаксиращ масаж — 60 минути', 55, 60, padmalayaPrices),
      price('Релаксиращ масаж с етерични масла — 60 минути', 65, 60, padmalayaPrices),
    ],
    openingHours: week(padmalayaContact, '09:00', '20:30'),
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: padmalayaContact, excerpt: 'Ако желаете да направите резервация по телефона, обадете се, за да запазим час. 088 333 16 17.' }, contact: padmalayaContact },
  },
  {
    ...base, id: 'sofia-golden-hands-massage-home-visits', name: 'Golden Hands · масаж на адрес', locationKind: 'service_area',
    address: null, website: golden, phone: '+359895640727',
    booking: { kind: 'phone', phone: '+359895640727' },
    services: [
      { ...price('Класически масаж с посещение на домашен адрес — 120 минути', 61, 120, goldenMenu), appointmentModel: 'home_visit', description: 'Публикувана отделна тарифа за домашно посещение в София; услугата и часът се уговарят предварително. Не е тарифата за посещение в студио.' },
    ],
    openingHours: week(goldenMenu, '10:00', '23:30'),
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: golden, excerpt: 'Масажи във вашия дом или в студио в София. Свържете се с мен за записване на час. Запази час +359 895 640 727.' }, contact: goldenContact },
  },
  {
    ...base, id: 'sofia-zaris-spa-sredna-gora66', name: 'ZariS Spa',
    address: 'София, ул. Средна гора 66, вход в пасажа на жълтата сграда', website: zaris, phone: '+359879155555',
    booking: { kind: 'phone', phone: '+359879155555' },
    services: [
      price('Класически масаж — 50 минути', 45, 50, zaris),
      price('Частичен масаж — гръб', 40, 45, zaris),
      price('Ароматерапия ZariS', 60, 60, zaris),
    ],
    openingHours: week(zaris, '10:00', '21:00'),
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: zaris, excerpt: 'Запази своя час. Най-бързо ще се свържете с нас по телефон, Viber или WhatsApp. +359 879 155 555.' }, contact: zaris },
  },
  {
    ...base, id: 'sofia-o2-therapy-krichim65', name: 'O2 THERAPY · София',
    address: 'София, ул. Кричим 65', website: o2, phone: '+359877778507',
    booking: { kind: 'phone', phone: '+359877778507' },
    services: [
      price('Дълбокотъканен масаж за цяло тяло — жени, без корем', 60, 60, o2Venue, o2Condition),
      price('Дълбокотъканен масаж за цяло тяло — мъже, без корем', 65, 60, o2Venue, o2Condition),
      price('Масаж на крака и седалище', 35, 30, o2Venue, o2Condition),
    ],
    openingHours: week(o2Venue, '09:00', '20:00'),
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: o2Venue, excerpt: 'За записване се свържи със студиото на 0877 778 507 или използвай страницата за час. Часовете се потвърждават от екипа.' }, contact: o2Venue },
  },
  {
    ...base, id: 'sofia-human-body-masters-klementina36', name: 'Human Body Masters',
    address: 'София, ул. Княгиня Клементина 36', website: hbm, phone: '+359876303203',
    booking: { kind: 'form', url: hbmBook },
    services: [
      price('Релаксиращ масаж на цяло тяло', 45, 60, hbmPrices),
      price('Релаксиращ масаж на гръб и шия', 40, 50, hbmPrices),
      price('Релаксиращ масаж на гръб', 35, 40, hbmPrices),
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: hbmBook, excerpt: 'Избор на услуга и време: Релаксиращ масаж. Формулярът заявява желание за час; екипът се свързва за потвърждение на часа и услугата.' }, contact: hbmContact },
  },
  {
    ...base, id: 'sofia-sense-wellness-tsar-osvoboditel16', name: 'Sense Wellness Sofia',
    address: 'София, бул. Цар Освободител 16, Sense Hotel Sofia', website: sense, phone: '+35924462510',
    booking: { kind: 'phone', phone: '+35924462510' },
    services: [
      price('Шведски масаж — 55 минути', 75, 55, senseServices),
      price('Ароматерапевтичен масаж — 55 минути', 80, 55, senseServices),
      price('Масаж с топли камъни — 55 минути', 85, 55, senseServices),
    ],
    openingHours: week(senseContact, '09:00', '21:00'),
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: senseContact, excerpt: 'For reservations or personal assistance, our team is always happy to help. Phone +359 2 446 2510 — Call us. Advance reservations are recommended for all massages and treatments.' }, contact: senseContact },
  },
  {
    ...base, id: 'sofia-grand-hotel-sofia-health-centre', name: 'Grand Hotel Sofia · Health Centre',
    address: 'София, ул. Гурко 1, Grand Hotel Sofia', website: grand, phone: '+35928110840',
    booking: { kind: 'phone', phone: '+35928110840' },
    services: [
      price('Класически масаж с включен СПА ден', 129.08, 45, grandPrices, 'Редовна публикувана услуга с включен безплатен СПА ден. Изисква предварителна резервация; цената включва ДДС.', 'BGN'),
      price('Релаксиращ масаж с включен СПА ден', 129.08, 50, grandPrices, 'Редовна публикувана услуга с включен безплатен СПА ден. Изисква предварителна резервация; цената включва ДДС.', 'BGN'),
      price('Частичен масаж с включен СПА ден', 89.97, 30, grandPrices, 'Редовна публикувана услуга с включен безплатен СПА ден. Изисква предварителна резервация; цената включва ДДС.', 'BGN'),
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: grand, excerpt: 'Health Centre — aroma therapy and body massage. For reservations: +359 2 811 0840. An advanced reservation is required in the actual spa menu.' }, contact: grandContact },
  },
  {
    ...base, id: 'sofia-ortus-wellness-hyatt', name: 'Ortus Wellness · Hyatt Regency Sofia',
    address: 'София, пл. Васил Левски 1, Hyatt Regency Sofia', website: ortus, phone: '+35924476750',
    booking: { kind: 'phone', phone: '+35924476750' },
    services: [
      price('Релаксиращ масаж De-Stress — 30 минути', 85, 30, ortusTreatments, 'Публикувана единична 30-минутна услуга; предварително записване чрез рецепцията на Ortus. Цената включва ДДС.', 'BGN'),
      price('Релаксиращ масаж с подхранващи био масла', 150, 60, ortusTreatments, 'Публикувана единична 60-минутна услуга; предварително записване чрез рецепцията на Ortus. Цената включва ДДС.', 'BGN'),
      price('Масаж с топли камъни — 60 минути', 170, 60, ortusTreatments, 'Публикувана единична 60-минутна услуга; предварително записване чрез рецепцията на Ortus. Цената включва ДДС.', 'BGN'),
    ],
    openingHours: week(ortusAbout, '09:00', '21:00'),
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: ortusAbout, excerpt: 'Scheduling an Appointment: Appointments can be made by contacting the Ortus Reception. Tel: +359 2 447 6750. Advance bookings recommended.' }, contact: ortusContact },
  },
]

const reviews = [
  {
    id: 'sofia-healing-hands-chavdar39b', website: healing, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [healing],
    pricingDecision: 'not_publicly_listed',
    priceSearch: { outcome: 'not_published', bookingUrl: healing, serviceUrls: [healing], notes: 'Actual owner Book contact first: hero Запази час is an explicit native tel:+359888677759 link, independently of separate Viber chat buttons. Full native services/About/contact/footer and all relevant navigation reviewed. Selected classical, Lomi-lomi and hot-stone massages are explicitly offered individually. No appointment prices, duration tariff, separate Prices page or external booking engine are published. Numeric1200/2200EUR amounts are training-course totals, not massage visits; none imported. This is genuinely unpublished appointment pricing, not a blocked or unrendered menu.' },
    notes: 'Fresh own native HTML confirms explicit call-booking hero anchor, exact ChavdarMutafov39B-1/Vitosha/0888677759 and Monclosed/Tue–Sun11–20. The owner also offers Viber, but no chat URI is imported or voice booking inferred from chat alone. About identifies PetyoIvanov massage studio and fitness-training background, not a general doctor clinic. Only three ordinary standalone massage services; therapeutic/health-outcome, spiritual efficacy and accreditation claims excluded. No durations, fees, course prices, source photographs/reviews/ratings, coordinates or guessed rooms added. Contact link is an in-page anchor, not an unseen request form. Service-reviewed only, not price-reviewed.',
  },
  {
    id: 'sofia-crystal-palace-wellness-shipka14', website: crystal, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [crystal, crystalRequest, crystalPrices, crystalContact, crystalSwedish, 'https://www.crystalpalace-sofia.com/offers-and-vouchers/partial-massage-targeted-relief-and-recovery/502', 'https://www.crystalpalace-sofia.com/pages/terms-of-use'],
    notes: 'Actual wellness Send inquiry entry read first as public owner form, not hotel-room booking; selected phone method is independently explicit on ordinary Swedish/partial treatment pages with dedicated spa886185811. Native owner HTML declares base href=https://www.crystalpalace-sofia.com/; actual relative current2026 PDF resolves to root/uploads, while reader incorrectly resolved it under/fitness-services and returned404. Correct owner-linked PDF downloaded and visually reviewed whole page, not a guessed alternate path. Three standard single-visit EUR fees41/31/58 and durations50/30/50 read directly from current2026 menu, not voucher totals, hotel prices or discounts. Current simple treatment pages agree on selected fees; old unlinked BG PDF has superseded other amounts and was not used for pricing. Dedicated spa contacts bind Shipka14 and own daily09–21, not hotel24hour reception. Terms state spa reservations are arranged directly; no confirmed online-availability claim. Packages, clinical results, gym/relax-zone entry and source photos/reviews excluded.',
  },
  {
    id: 'sofia-padmalaya-sedmochislenitsi9', website: padmalaya, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [padmalaya, padmalayaContact, padmalayaPrices, 'https://www.padmalaya.bg/profesionalni-masaji-sofia/', 'https://www.fresha.com/a/padmalaya-massage-center-sofia-ulitsa-sveti-sedmochislenitsi-9-ymp7oq47/booking?menu=true'],
    notes: 'Actual owner Book entry first leads to the named Fresha booking at SvetiSedmochislenitsi9; reader exposes an unrendered shell, not a completed online-menu review. The fully read own contact page independently explicitly accepts telephone reservations0883331617. Fresh ordinary HTTPS native pricing confirms three standard single-visit60minute variants55/55/65EUR; discounted80minute variants, packages, therapeutic/results claims excluded. Owner contact distinguishes front #11 and back #9, but shared brand/menu/phone and no independently reviewed branch selector mean only ONE centre record is counted, at #9 as the owner root and actual merchant identify. Owner binds Kristina Kobido/Shiatsu only to11: neither service is imported here and #11 is not cloned as another business. Exact #9 entrance guidance and explicitly published Lozenets/Mon–Sun09–20:30 retained. Own About read; no physician credentials, medical outcomes, source photographs or reviews copied.',
  },
  {
    id: 'sofia-golden-hands-massage-home-visits', website: golden, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [golden, goldenMenu, goldenContact],
    notes: 'Actual native phone/Viber booking instruction read first, then full services and contact. Owner explicitly offers professional massage in the customer home in Sofia, not just an imprecise studio in Vitosha. One service-area operator only, no invented premises or quarter clones. Fresh ordinary HTTPS native menu now explicitly publishes home visits120minutes61EUR in the classical massage section; this is not the41EUR60minute studio fee or an EUR conversion. Reader cached one-year page has old BGN rates and GeorgiZlatarski5, whereas fresh canonical menu/contact remove the street and publish current EUR rates; old cached facts were not imported. Current native root and fee page both publish daily10–23:30. No claim to have opened Viber, contacted anyone or booked. Only ordinary classical home massage; therapeutic/injury/outcome claims, other services and photographs omitted. Address, neighborhood and coordinates remain null.',
  },
  {
    id: 'sofia-zaris-spa-sredna-gora66', website: zaris, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [zaris],
    notes: 'Full own native Services, Prices, About, contact and footer reviewed by ordinary public HTTP. The owner explicitly offers phone/Viber/WhatsApp appointment booking for this named studio; phone path is the reviewed booking method. Actual online buttons lead to https://s24.bg/m/556, which remains an unrendered separate menu and was not requested or claimed reviewed after access restrictions. Three independently published single-visit native EUR fees and exact durations retained. No evidence of a conflicting selected-service tariff on the inspected owner page. Weekly 10–21 is explicitly every day, not inferred from transient opening status. One venue at Sredna gora66 with owner entrance guidance. Ordinary relaxation massage only; no therapeutic efficacy, ratings, reviews, photographs, package totals, clinical claims or guessed quarter/coordinates imported.',
  },
  {
    id: 'sofia-o2-therapy-krichim65', website: o2, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [o2, 'https://o2therapy.bg/zapishi-chas.html', o2Book, o2Venue, 'https://o2therapy.bg/ceni.html', 'https://o2therapy.bg/cialo-tialo.html', 'https://o2therapy.bg/kraka.html', 'https://o2therapy.bg/za-nas.html'],
    notes: 'Owner Book entry first: zapishi-chas.html contains an ordinary meta-redirect to the current native /rezervacii/ page. Full public booking HTML inspected: explicit phone reservations for Sofia0877778507; dynamic city/therapist/service selections were not rendered and no menu-complete claim is made for that online path. Selected booking method is the independently explicit phone fallback. Current native Sofia-specific venue table and individual full-body/legs pages agree on the three selected EUR prices, durations, gender tiers and abdomen exclusion. Public descriptions retain the owner condition that therapist, duration and final price are confirmed at booking. Full About and venue/contact/footer reviewed. Only ordinary massage rows included; therapeutic injury/inflammation services, oxygenation/results claims, ABS packages, Plovdiv and Stara Zagora excluded. Exact Krichim65 and explicit Mon–Sun09–20; no guessed quarter or coordinates. No inputs, slots, dates, customer data, reservations, images or reviews used.',
  },
  {
    id: 'sofia-human-body-masters-klementina36', website: hbm, checkedOn, bookingEntry: hbmBook, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [hbm, hbmBook, hbmPrices, hbmContact, 'https://www.hbm.bg/услуги/релаксиращ-масаж/'],
    notes: 'Actual owner request form fully read before native Prices and contact: service selector explicitly includes relaxing massage; named time/date and customer fields were inspected read-only, never entered or submitted. It states that requests are not automatic appointments and the team contacts the requester to confirm. Fresh ordinary owner HTTP confirms three relaxation-zone EUR fees/durations and KnyaginyaKlementina36/0876303203; additional public phone0878828252 is not a separate venue. About identifies massage/manual-therapy operators with physiotherapy backgrounds, not an unrelated general physician clinic; intake is restricted to ordinary relaxation massage only. All rehabilitation, medical-treatment claims, electrotherapy, cupping, body-remodelling and packages excluded. No published full-week working hours on inspected own pages; form hour options and third-party/OSM schedules are not business hours. No guessed quarter/coordinates or imported ratings/reviews/photos.',
  },
  {
    id: 'sofia-sense-wellness-tsar-osvoboditel16', website: sense, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [sense, senseBook, senseServices, senseContact, 'https://sensewellnesssofia.freshasite.com/wellness-zone', 'https://www.sensehotel.com/sense-wellness'],
    notes: 'Actual owner Book a treatment entry followed first to named Fresha booking; ordinary public response remained an unrendered shell, not a reviewed calendar, availability or booking confirmation. Independently fully read own contact/About page explicitly offers reservations/personal assistance, recommends advance reservations for massages and presents Call us with native tel:+35924462510. This explicit reservations-context phone path is the selected method. Fresh own Treatments HTML publishes ordinary single-visit Swedish75EUR55min, aromatherapy80EUR55min and hot stone85EUR55min without selected-service conflict. Memberships, multipacks, gifts, pool access, retail products, facial/medical outcomes and source photos/reviews are not imported. Own contact gives exact TsarOsvoboditel16/SenseHotel and explicit daily09–21 including holidays; no hotel24hour inference. Hotel navigation links this owner-controlled wellness site; old /sense-wellness route returns404 and is not claimed a current fee source. Actual About navigation leads to /contact; no invented About page or coordinates.',
  },
  {
    id: 'sofia-grand-hotel-sofia-health-centre', website: grand, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [grand, grandPrices, grandContact, 'https://www.grandhotelsofia.bg/luxury-hotel-sofia/', 'https://www.grandhotelsofia.bg/hotel-services-policies/faqs/'],
    notes: 'Actual spa-specific booking entry is explicit Health Centre For reservations28110840, reviewed before actual owner-linked View menu image; generic Book Now is hotel room booking and is not represented as a spa form. Entire current linked tariff image visually read, confirming classic45min129.08BGN/66EUR, relaxation50min129.08BGN/66EUR and partial30min89.97BGN/46EUR, all including free SPA day and VAT with advance reservation required. Literal published BGN retained, not a conversion or a bare massage price that silently omits included access. These are regular menu rows, not voucher purchase, multipacks or expiring promotions. Fresh own venue page/contact/About/FAQ confirm one ordinary hotel wellness centre and Gurko1; no doctor-clinic or medical outcomes claimed. Hair salon is not cloned as another business. Own spa page gives09–20 without explicit weekdays and nearby unrelated08–20 block, so weekly hours omitted rather than inferred. No photographs, reviews, ratings, hotel-room services or coordinates imported.',
  },
  {
    id: 'sofia-ortus-wellness-hyatt', website: ortus, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [ortus, ortusAbout, ortusTreatments, ortusContact, 'https://www.hyatt.com/hyatt-regency/en-US/sofrs-hyatt-regency-sofia', 'https://www.hyatt.com/content/dam/hotel/propertysites/assets/regency/sofrs/documents/en_us/spa/Ortus_Brochure_EN_WEB_Sept_2025.pdf'],
    notes: 'Actual spa appointment instructions reviewed first on own About: contact Ortus reception; dedicated phone24476750 independently confirmed own Contact. Own native Treatments page fully readable and independently supplies three selected ordinary single-visit fees/durations85BGN30min/150BGN60min/170BGN60min, with literal EUR43.46/76.69/86.92 also present; price sources are Treatments, not inferred EUR conversions or PDF extraction. Current linked brochure text has matching selected amounts, but ordinary PDF download returned HyattE6020 error HTML, so PDF NOT visually reviewed or claimed completed; stopped further Hyatt requests, no alternative endpoint/UI. No conflicting selected fee was observed. Own hotel address line explicitly1VasilLevskiSquare; ordinary wellness scope and daily09–21 confirmed own About, not hotel24hour fitness. No separate salon clone, medical/therapy outcomes, facial protocols, addons, couples bundles, pool admission, source reviews/photos or coordinates imported. Arrival30min early and cancellation4hours are own guidance, not service duration or availability promises.',
  },
]

export default { records, reviews }
