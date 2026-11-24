import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-dca-garage-levski-v-letostruy27', cityCode = '68134'
const neighborhood = 'Левски В', address = 'София, ж.к. Левски В, ул. Летоструй 27'
const website = 'https://www.dcagarage.com/'
const contact = new URL('adres/', website).href
const servicePage = new URL('folirane/', website).href
const tariff = new URL('ceni-folirane/', website).href
const phone = '+359882708840'
const description = 'Поставяне на защитно фолио на задните стъкла. Формулярът изпраща запитване; сервизът потвърждава класа на автомобила, приложимата цена и точния час.'

function rearWindowFilm(vehicle, amount) {
  return {
    name: `Фолиране на задни автомобилни стъкла · ${vehicle}`, category: 'detailing', description,
    price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl: tariff, checkedOn, validUntil },
    appointmentModel: 'appointment',
  }
}

export const DCA_LEVSKI_INTAKE_20261123_RECORDS = [{
  id, name: 'D.C.A. Garage', cityCode, neighborhood, address, category: 'detailing', locationKind: 'premises',
  website, phone,
  coordinates: {
    latitude: 42.706986, longitude: 23.374326, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: cityCode,
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '50943',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [
    rearWindowFilm('купе', 179),
    rearWindowFilm('седан / комби', 230),
    rearWindowFilm('SUV', 255),
    rearWindowFilm('джип', 281),
    rearWindowFilm('хеви джип', 306),
  ],
  booking: { kind: 'form', url: contact },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: {
      url: contact,
      excerpt: '„Запази час“ за фолиране води към формата за запитване на сервиза. Сервизът уточнява автомобила, цената и точния час.',
    },
  },
}]

export const DCA_LEVSKI_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: contact, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, contact, servicePage, tariff, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Followed the owner’s Book action from the site to its public contact form, then reviewed the service and exact tariff pages. The form sends a message without selecting a time or confirming availability. The current owner-rendered contact lists No. 27 and both matching phone numbers; an earlier snapshot at No. 101 predates the operator’s September relocation. Only literal EUR amounts for rear-window film are used, separately for coupe, sedan/estate, SUV and the owner’s two distinct off-road vehicle tiers; the generic from-pricing and cleaning tariff were not used.',
  inventoryIdentity: 'e0979595ba6645467d299dcf90a959b8ade0129df9c4f2bb38566e52c89c6bce',
}]
