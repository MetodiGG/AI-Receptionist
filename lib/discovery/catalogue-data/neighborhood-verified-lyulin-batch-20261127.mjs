import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-27'
const validUntil = '2026-12-18'
const category = 'education'
const neighborhood = 'Люлин 3'
const cityCode = '68134'
const coordinates = ({ address, website, addressId, latitude, longitude }) => ({
  latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
  sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
  checkedOn, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
})
const price = (amount, unit, sourceUrl) => ({ amount, currency: 'EUR', kind: 'fixed', unit, sourceUrl, checkedOn, validUntil })
const education = fields => ({ category, appointmentModel: 'appointment', ...fields })

const solema = {
  id: 'sofia-solema-lyulin3-block348', name: 'Учебен център СОЛЕМА',
  address: 'София, ж.к. Люлин 3, бл. 348, учебна зала', website: 'https://solemabg.com/',
  phone: '+359884668954', addressId: '30865', latitude: 42.724474, longitude: 23.245073,
}
const solemaMenu = 'https://solemabg.com/Page6.htm'
const alice = {
  id: 'sofia-alice-academy-lyulin3-block389', name: 'Alice Academy',
  address: 'София, ж.к. Люлин 3, ул. Георги Дражев, бл. 389', website: 'https://alice-academy.bg/',
  phone: '+359887684473', addressId: '102604', latitude: 42.719985, longitude: 23.252379,
}
const aliceMenu = 'https://alice-academy.bg/courses/'
const aliceBooking = 'https://alice-academy.bg/contact/'
const branch = ({ id, name, address, website, phone, ...point }, services, url, excerpt, form = false) => ({
  id, name, cityCode, neighborhood, address, website, phone, category, locationKind: 'premises',
  coordinates: coordinates({ ...point, address, website }), services,
  booking: form ? { kind: 'form', url } : { kind: 'phone', phone },
  verification: { status: 'approved', checkedOn, validUntil, contact: url, booking: { url, excerpt } },
})

export const VERIFIED_LYULIN_BATCH_20261127_RECORDS = [
  branch(solema, [
    education({
      name: 'Групова подготовка по математика · двама ученици',
      description: 'Присъствен курс за 7. клас, матура или кандидатстване. Посочената цена е за един 40-минутен учебен час, не за целия курс или за самостоятелно посещение. Заплаща се на две вноски – в началото на курса и в началото на февруари.',
      price: price(8.20, 'учебен час от 40 минути', solemaMenu),
    }),
  ], solemaMenu, 'Страницата за връзка и записване посочва телефона и учебната зала за групите в бл. 348.'),
  branch(alice, [
    education({
      name: 'Индивидуален тест за ниво по английски · за възрастни',
      description: 'Предварителен тест с преподавател за избор на подходящ курс по английски за възрастни. Уговаря се отделно; безплатният тест не включва самия курс.',
      price: price(0, 'за теста', aliceMenu),
    }),
  ], aliceBooking, 'Линкът за запазване на безплатен тест води до формата за запитване на учебния център; часът се уговаря отделно.', true),
]

export const VERIFIED_LYULIN_BATCH_20261127_REVIEWS = [
  {
    id: solema.id, website: solema.website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [solema.website, solemaMenu],
    notes: 'Reviewed first-party contact/registration and permanent tariff together. The two-person group is taught at the Lyulin 3 block 348 classroom. Use the current page’s literal EUR unit price, not a computed course total. Do not use the undated prepayment promotion, a home-based individual lesson, or the different larger-group tariff.',
    inventoryIdentity: 'b21ee1a32f2eedfcb294dc006743598da5ad12f41820b38073873f7a225ab808',
  },
  {
    id: alice.id, website: alice.website, checkedOn, bookingEntry: aliceBooking, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [alice.website, aliceMenu, aliceBooking],
    notes: 'Followed the course’s actual placement-test link. It redirects to the owner’s usable request form with the address and local telephone, not a calendar or immediate confirmation. The owner’s front page identifies the current school year. Only the placement test is reviewed; no class amounts or slot availability are claimed. The separate provider hosted at this premises independently ties Alice Academy to block 389.',
    inventoryIdentity: '2275a635b62c2657c4c2d4dda4b6689eef6e101f02fbe17c2a79741948149a65',
  },
]
