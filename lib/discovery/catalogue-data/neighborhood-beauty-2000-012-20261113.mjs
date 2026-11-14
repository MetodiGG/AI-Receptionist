// Independent owner-native/phone research intake. Shared imports, identities and photos are parent-owned.
const checkedOn = '2026-11-14'
const validUntil = '2027-02-12'
const bestform = 'https://bestform.bg/'
const bestformFaq = 'https://bestform.bg/chesto-zadavani-vaprosi'
const bestformService = 'https://bestform.bg/reformer-pilates/'
const bestformPrices = 'https://bestform.bg/tseni/'
const bestformContact = 'https://bestform.bg/kontakt/'
const spider = 'https://spider-ink.com/en/'
const spiderAbout = 'https://spider-ink.com/en/about-us/'
const spiderFaq = 'https://spider-ink.com/en/faq/'
const spiderNotes = 'Actual owner homepage Book an appointment/Call to find a time href is tel:+359879136900; phonepath fully reviewed, no externalcalendar or actualcall. Owner About and FAQ independently offer customtattoos and cover-up, with priorconsultation for reworking oldtattoos. Full actual FAQ states individual fixedquote depends on size, complexity and placement, not a public hourlytariff; no amounts published for these selectedservices in whole root/About/FAQ. Actual voucherTerms reviewed fully,50EUR is voucherfacevalue NOT tattoo minimum/servicefee; no voucher, deposit, artwork or retailprice imported. No hidden or blockedknownprice menu relabelled unpublished. Current primary root/footer exactMladost3Block342groundfloor/Sofia; Privacy separately distinguishes registeredMalinov23office77 from operatingstudio behind342, legaladdress not substituted. Full Privacy and actualvoucherTerms read, no explicit automatedaccess/extraction/database/commercialsourceuse restriction identified, not blanketpermission; genericIP not licence. Initial nativeHTML only, no forms/service/date/staff/consent/clientinput/submission, sourceimages/reviews/ratings/Maps/API/assets. Only ordinary adulttattoos, no laserremoval/clinical/scar/treatment/safety/healthguarantee claims. No actualweeklyhours found; no dailyhours inferred. Fullruntime+ALL2000 intake brand/domain/879136900/block342 overlap0, one studio not artistclones. No coordinates/inventoryIdentity.'
const records = [
  {
    id: 'sofia-bestform-bulgaria60g', name: 'BestForm Reformer Pilates', cityCode: '68134', neighborhood: null,
    address: 'София, бул. България 60Г', locationKind: 'premises', coordinates: null, category: 'fitness', website: bestform, phone: '+359877381005',
    booking: { kind: 'phone', phone: '+359877381005' },
    services: [{
      name: 'Групова тренировка Reformer Pilates — единично посещение', category: 'fitness', appointmentModel: 'group_reservation', durationMin: 50,
      durationSourceUrl: bestformService, durationCheckedOn: checkedOn,
      price: { amount: 22, currency: 'EUR', kind: 'fixed', unit: 'единична групова тренировка', sourceUrl: bestformPrices, checkedOn, validUntil },
      description: 'Предварителна резервация по телефона при свободно място в група до 5 души. Тренировките са по чорапи; плащането е преди началото. Отмяна до 12 часа предварително; по-късно или при неявяване посещението се счита за използвано.',
    }],
    openingHours: { sourceUrl: bestformContact, checkedOn, days: [...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '08:00', close: '21:00' }] })), ...[6, 7].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '18:00' }] }))] },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: bestformFaq, excerpt: 'Собствените FAQ и Reformer страница изрично позволяват резервация чрез обаждане. Контактният телефон е 0877381005; бул. България60Г, София.' }, contact: bestformContact },
  },
  {
    id: 'sofia-spider-ink-mladost3-block342', name: 'Spider Ink Tattoo & Piercing', cityCode: '68134', neighborhood: 'Младост 3',
    address: 'София, ж.к. Младост 3, бл. 342, партер (зад блока)', locationKind: 'premises', coordinates: null, category: 'other', website: spider, phone: '+359879136900',
    booking: { kind: 'phone', phone: '+359879136900' },
    services: [
      { name: 'Татуировка по индивидуален проект — за пълнолетни', category: 'other', appointmentModel: 'appointment', description: 'Дизайнът, размерът, мястото и цената се уточняват предварително с артиста.' },
      { name: 'Cover-up на стара татуировка — за пълнолетни', category: 'other', appointmentModel: 'appointment', description: 'Предварителна консултация за нов проект върху старата татуировка; размерът, цветът и цената се уточняват индивидуално. Не е лазерно премахване.' },
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: spider, excerpt: 'Собственият Book an appointment / Call to find a time води към телефон0879136900. Студиото е Младост3, бл.342, партер, София.' }, contact: spider },
  },
]
const reviews = [
  {
    id: 'sofia-bestform-bulgaria60g', website: bestform, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [`${bestform}robots.txt`, bestform, `${bestform}obshti-usloviya`, `${bestform}politika-na-poveritelnost`, `${bestform}vatreshna-politika-i-pravila-za-polzvane-na-studio-bestform/`, 'https://book.bestform.bg/robots.txt', bestformFaq, bestformService, bestformPrices, bestformContact],
    notes: 'Actual owner Book target identified first. Exact linked bookinghost robots Disallow/ STOP before calendar, no calendar/menu/provider or alternative endpoint request. Full owner siteTerms, Privacy and internalstudioRules read before independentnative tariff. FAQ and actualReformer servicepage explicitlypermit directmessage/call reservation, exactphone877381005 and Bulgaria60Г/Sofia on Contact. Independent current whole native tariff singleReformer22EUR, servicepage50min/groupmax5; no package division, promotion, RelaxRoomdevice or medicaloutcome claim. Twelve-hour cancellation/prepayment/socks conditions retained. Fullweeklyvenuehours explicit Contact/footer; no classschedule used as openinghours. Owner siteTerms ordinary protectedsite-materials copying/IP clauses, no express automation/extraction/database/noncommercial-only clause identified in reviewed text, not global legalclearance or permission to reuse prose/media. Only minimal independently paraphrased facts. Runtime+ALL2000 intake normalizeddomain/name/phone no overlap; same building60Г psychologist is different business/operator/activity, not a staff/room alias. No source media/reviews/ratings/Maps, coordinate/identity writes, booking call/selection/input/consent/submission.',
  },
  {
    id: 'sofia-spider-ink-mladost3-block342', website: spider, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: ['https://spider-ink.com/robots.txt', spider, 'https://spider-ink.com/en/privacy-policy/', 'https://spider-ink.com/en/podari-tatuirovka/', spiderFaq, spiderAbout],
    pricingDecision: 'not_publicly_listed', priceSearch: { outcome: 'not_published', bookingUrl: spider, serviceUrls: [spiderAbout, spiderFaq], notes: spiderNotes }, notes: spiderNotes,
  },
]
export default { records, reviews }
