// One priced birthday package at a single owner-verified physical venue.
import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-sharen-svyat-lyulin5-block519g'
const neighborhood = 'Люлин 5'
const address = 'София, ж.к. Люлин 5, бул. Райко Даскалов, бл. 519, вх. Г'
const website = 'https://clubsharensvqt.com/'
const contact = `${website}contact.html`
const prices = `${website}ceni.html`
const party = `${website}detsko-parti.html`
const terms = 'https://www.clubsharensvqt.com/obshti-usloviya.html'
const phone = '+359894229242'

export const SHARENSVYAT_INTAKE_20261123_RECORDS = [{
  id, name: 'Детски клуб „Шарен свят“ · Люлин 5', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.713674, longitude: 23.245399,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '52803', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'other', website, phone,
  services: [{
    name: 'Детски рожден ден · пакет за 10 деца', category: 'other', appointmentModel: 'group_reservation',
    description: 'Зала, украса, детско меню, кетъринг, аниматор и занимания. Още дете: 10,23 €. +30 мин: 30 €; +1 ч: 60 €. Без външна храна и напитки. Торта отделно; внесена: 7 € и сертификат. Невъзстановимо капаро 50 €; уточнете отчитане и отказ. Отлагане до 48 ч преди партито (3 дни при торта от клуба).',
    price: { amount: 299, currency: 'EUR', kind: 'fixed', unit: 'пакет за 10 деца', sourceUrl: prices, checkedOn, validUntil },
    durationMin: 120, durationSourceUrl: prices, durationCheckedOn: checkedOn,
  }],
  openingHours: {
    days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '21:00' }] })),
    sourceUrl: contact, checkedOn,
  },
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: contact, excerpt: 'Бутонът за резервация към пакета води към публикувания телефон. Условията на клуба потвърждават, че записването може да стане по телефон.' },
  },
}]

export const SHARENSVYAT_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, prices, party, terms],
  notes: 'The price card’s own reservation link opens the owner contact page with the business booking number. The owner terms independently confirm telephone reservations at the same number, with date, time, number of children and extras agreed with the club. The single regular 10-child birthday package is EUR 299 for 120 minutes of venue hire and carries the separately described inclusions, optional charges, outside-cake certification and postponement rules. The owner lists a non-refundable EUR 50 reservation deposit without stating here whether it is credited to the package; that ambiguity and potentially applicable cancellation conditions are left for the club to confirm. No fee is added to the base amount and no different package or optional service is admitted. The owner terms prohibit copying the club’s materials, photos and logos; only independently worded factual information is listed. The independently matched municipal entry is for entrance G, not a survey of the business doorway. No contact, credentials or booking were attempted.',
  inventoryIdentity: 'dfca4ae951fc0b5c0d95a7488faf3ebca9fe0cc771b6c8faadad524c42ac38e0',
}]
