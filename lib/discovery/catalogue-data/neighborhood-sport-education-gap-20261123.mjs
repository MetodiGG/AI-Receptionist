import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-umni-deca-obelya2-106-3'
const website = 'https://www.umnideca.com/'
const courses = `${website}services-4`
const contact = new URL('контакти', website).href
const phone = '+359883456852'
const neighborhood = 'Обеля 2'
const address = 'София, ж.к. Обеля 2, ул. 106 № 3, ЧСУ „Дружба“'

export const SPORT_EDUCATION_GAP_20261123_RECORDS = [{
  id, name: 'Център за развитие „Умни деца“ · Обеля 2', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  // A reviewed numbered street, not an automatic match or a campus entrance pin.
  coordinates: {
    latitude: 42.745418, longitude: 23.273875,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '99218', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'education', website, phone,
  services: [{
    name: 'Ментална аритметика за деца · математика с абакус', category: 'education', appointmentModel: 'appointment',
    description: 'Присъствен курс за деца от 4 до 12 години със смятане наум и упражнения с абакус. Изпратете заявка за пробен урок; центърът ще се свърже с вас. Графикът и таксата не са публикувани.',
  }],
  booking: { kind: 'form', url: courses },
  verification: {
    status: 'approved', checkedOn, validUntil,
    booking: { url: courses, excerpt: 'Публичният формуляр за пробен урок приема предпочитан курс и контакти. Центърът се свързва с родителя за уточнение.' },
    contact,
  },
}]

export const SPORT_EDUCATION_GAP_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: courses, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, courses, contact],
  notes: 'The first-party courses link opens the mental-arithmetic programme and the public trial-lesson enquiry form on the same page. The provider and host school independently state Obelya 2, Sofia, Street 106 No. 3. Municipal row 99218 is the exact campus postal point. No confirmation of an instant slot, free trial, separate school service, fixed duration, timetable or tariff is implied.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: courses, serviceUrls: [courses, contact],
    notes: 'The public trial request, regular course description, official contact and branch information do not publish a tariff for the regular course or trial lesson. The summer programme is a different service and not a price proxy.',
  },
  inventoryIdentity: '8639c43409cfd70b04f8d5ad9707a134f2bcaaae80e690fbeeeecc217aa307db',
}]
