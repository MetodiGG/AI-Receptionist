// Individually reviewed real teaching venues. Offices, departments and virtual
// courses are not additional premises. No imported media or availability.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const root = 'https://www.britanica-edu.org/'
const bookingUrl = `${root}form/svrzhete-se-s-nas`
const terms = `${root}obschi-usloviya-na-britanika-za-godishno-obuchenie`
const programmes = `${root}annual-programs`
const branches = [
  ['beli-brezi', 'Бели брези', 'Бели брези', 'ул. Хайдушка гора 48Б', '+35924666500', 'britanica-beli-brezi'],
  ['bulgaria', 'България', null, 'бул. България 53А, ет. 3', '+35924666571', 'bulevard-bulgaria'],
  ['geo-milev', 'Гео Милев', 'Гео Милев', 'ул. Едисон 47', '+35924666536', 'geo-milev'],
  ['lozenets', 'Лозенец', 'Лозенец', 'ул. Голо бърдо 22', '+35924666525', 'lozenets'],
  ['lyulin', 'Люлин', 'Люлин', 'бул. Царица Йоанна 57, ет. 2', '+35924666561', 'lyulin'],
  ['mladost1', 'Младост 1', 'Младост 1', 'бул. Йерусалим, бл. 12', '+35924666550', 'mladost-1'],
  ['mladost2', 'Младост 2', 'Младост 2', 'бул. Андрей Ляпчев 74', '+35924666568', 'mladost-2'],
  ['tulovo', 'Орлов мост · Тулово', null, 'ул. Тулово 7', '+35924666520', 'orlov-most-tulovo'],
  ['pliska', 'Плиска', 'Изток', 'кв. Изток, бл. 5', '+35924666530', 'pliska'],
  ['praga', 'Прага', null, 'бул. Прага 18', '+35924666510', 'praga'],
  ['suhata-reka', 'Сухата река', 'Сухата река', 'ул. Константин Фотинов 2', '+35924666545', 'britanica-sukhata-reka'],
]
const records = branches.map(([key, label, neighborhood, street, phone, slug]) => ({
  id: `sofia-britanica-${key}`, name: `BRITANICA · ${label}`,
  cityCode: '68134', neighborhood, address: `София, ${street}`,
  locationKind: 'premises', coordinates: null, category: 'education', website: root, phone,
  services: [{
    name: 'Годишен курс по английски език за деца', category: 'education', appointmentModel: 'appointment',
    description: 'Запитване за присъствено обучение в този филиал. Нивото, подходящата група, графикът и таксата се потвърждават от екипа. Записването изисква договор и плащане; заявката не е потвърдено място.',
  }],
  booking: { kind: 'form', url: bookingUrl },
  verification: { status: 'approved', checkedOn, validUntil,
    booking: { url: terms, excerpt: 'Приемът за езиков курс включва регистрация, договор и такса; новите курсисти се насочват към подходящо ниво след диагностика.' },
    contact: `${root}location/${slug}` },
}))
const reviews = records.map((row, index) => ({
  id: row.id, website: root, checkedOn, bookingEntry: bookingUrl, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [root, bookingUrl, row.verification.contact, programmes, terms, `${root}britanica-offices`, `${root}contacts`],
  pricingDecision: 'not_publicly_listed',
  priceSearch: { outcome: 'not_published', bookingUrl,
    serviceUrls: [row.verification.contact, programmes, terms],
    notes: 'Read the actual owner enquiry/enrolment entry, complete relevant annual programmes, this exact teaching-branch page and full annual terms. The terms explicitly direct readers to the tariff in each office; no numeric course fee is published on the inspected booking, branch or programme pages. Cancellation administration fees and exam fees are not teaching prices.',
  },
  notes: `Individually read the exact ${branches[index][5]} teaching venue, literal street/block, named branch telephone and explicitly offered annual English course for children; not inferred from a general chain directory. Actual linked public enquiry form displays name, phone, email, training-form choice, enquiry and consent; annual terms establish registration, contract, diagnostic placement where applicable, payment and capacity-dependent acceptance. No form submitted, personal fields entered, CAPTCHA solved or account created. The browser privacy reviewer rejected accepting all marketing cookies, so that action was not completed or bypassed; public readable form and independently readable source pages were used, not a claim of inspecting a hidden branch dropdown. Central office at 6thSeptember7 excluded as administration, likewise departments and online-only courses. Full weekly class hours and lesson duration absent; no conversion of annual-course length into a single visit. Only factual branch identity and a short newly written service description retained; no source prose, course materials, maps, reviews, ratings, photos or branding copied. Coordinates absent pending exact address validation.`,
}))
export default { records, reviews }
