import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-sm-group-korekt-druzhba1-block182'
const website = 'https://www.smgroup-bg.com/'
const contact = website + encodeURIComponent('контакти') + '/'
const bookingUrl = contact
const neighborhood = 'Дружба 1'
const address = 'София, ж.к. Дружба 1, бл. 182, офис 2'

export const SM_GROUP_INTAKE_20261123_RECORDS = [{
  id, name: 'С и М Груп Корект', cityCode: '68134', neighborhood, address,
  locationKind: 'premises', category: 'consulting', website, phone: '+359889542503',
  coordinates: {
    latitude: 42.663012, longitude: 23.392029, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '34234',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Първоначална счетоводна консултация', category: 'consulting',
    description: 'Безплатна първа консултация по счетоводните нужди на бизнеса. След заявката кантората се свързва с вас, за да уточни срещата. Месечното обслужване не е включено.',
    price: { amount: 0, currency: 'EUR', kind: 'fixed', sourceUrl: contact, checkedOn, validUntil },
    appointmentModel: 'appointment',
  }],
  openingHours: {
    days: [1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '18:00' }] })),
    sourceUrl: contact, checkedOn,
  },
  booking: { kind: 'form', url: bookingUrl },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: bookingUrl, excerpt: 'Бутонът за безплатна консултация води до форма за запитване, след което кантората се свързва с клиента.' },
  },
}]

export const SM_GROUP_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: bookingUrl, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, contact, website + 'schetovodni-uslugi/', website + 'tseni/',
    website + 'schetovoditel-druzhba/', website + 'privacy-policy/', OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Followed the published first-consultation CTA to the homepage contact section, then verified its equivalent request form on the owner’s linked contact page (the allowed fragment-free destination), before reviewing Services and Prices. The actual first consultation is specifically advertised as free, not a timed slot, quote for a subscription, or GoRez confirmation. Stored EUR 0 denotes the published no-charge initial meeting; the source does not print a currency for the free meeting. Optional monthly services are not imported. Its Druzhba page and contact identify the staffed block 182 office 2 and personal meetings; the unique block point in the municipal Iskar record is bound to the owner address. The dataset labels the broader residential complex Druzhba and does not identify office 2 or an entrance. The owner supplies the Druzhba 1 distinction. Weekdays are office contact hours only; the site does not describe weekends or an appointment duration. Reviewed the public privacy page; no contact, form submission, authored source text or owner imagery was reused.',
  inventoryIdentity: '81d3d3ed3afc21216957afd1b67a85d7c658ee431ec547ed5a10bf767fb321b2',
}]
