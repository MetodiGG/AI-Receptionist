import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-27', validUntil = '2026-12-18', cityCode = '68134'
const wrap = {
  id: 'sofia-bs-wrap-studio-studentski-stranski3b', name: 'BS Wrap Studio · Студентски град',
  neighborhood: 'Студентски град', address: 'София, Студентски град, ул. Проф. д-р Иван Странски 3Б',
  website: 'https://bswrapstudio.bg/', phone: '+359882446888', category: 'detailing',
  addressId: '95055', latitude: 42.643543, longitude: 23.341124,
}
const school = {
  id: 'sofia-as-vavilon-vrabnitsa2-block632d', name: 'Автошкола АС–Вавилон · Връбница 2',
  neighborhood: 'Връбница 2', address: 'София, ж.к. Връбница 2, бл. 632, партер до вх. Д',
  website: 'https://as-vavilon.com/', phone: null, category: 'education',
  addressId: '18016', latitude: 42.736604, longitude: 23.292357,
}
const photo = {
  id: 'sofia-best-moments-photography-lyulin6-block641', name: 'Best Moments Photography · Люлин 6',
  neighborhood: 'Люлин 6', address: 'София, ж.к. Люлин 6, блок 641',
  website: 'https://bestmphoto.com/', phone: '+359899696209', category: 'other',
  addressId: '118132', latitude: 42.710241, longitude: 23.252639,
}
const wrapBook = `${wrap.website}kontakti/`, ppf = `${wrap.website}ppf/`, colour = `${wrap.website}smyana-na-cveta/`
const wrapTerms = `${wrap.website}obshti-usloviya/`
const schoolBook = `${school.website}all-inclusive-price-driving-lesson-957860`
const schoolMobile = `${school.website}all-inclusive-price-driving-lesson-961073`
const roadRegister = 'https://rta.government.bg/upload/18444/uchebni_centrove.html'
const family = `${photo.website}family-photography/`
const photoContact = `${photo.website}%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/`
const lyulinDistrict = 'https://call.sofia.bg/signals/765552'

const branch = ({ addressId, latitude, longitude, ...row }, services, url, excerpt, contact = url) => ({
  ...row, cityCode, locationKind: 'premises',
  coordinates: {
    latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: row.address, sourceCityCode: cityCode, sourceNeighborhood: row.neighborhood, sourceWebsite: row.website,
    checkedOn, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: services.map(service => ({ ...service, category: row.category, appointmentModel: 'appointment' })),
  booking: { kind: 'form', url },
  verification: { status: 'approved', checkedOn, validUntil, contact, booking: { url, excerpt } },
})
const review = ({ id, website }, bookingEntry, reviewedUrls, notes, inventoryIdentity) => ({
  id, website, checkedOn, bookingEntry, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, bookingEntry, ...reviewedUrls, OFFICIAL_SOFIA_SOURCE_URL], notes, inventoryIdentity,
})
const unpriced = (serviceUrls, notes, details) => ({
  ...details, pricingDecision: 'not_publicly_listed',
  priceSearch: { outcome: 'not_published', bookingUrl: details.bookingEntry, serviceUrls, notes },
})

export const VERIFIED_SOFIA_CROSS_QUARTER_20261127_RECORDS = [
  branch(wrap, [{
    name: 'PPF защитно фолио · предна част',
    description: 'Формулярът е заявка за оглед, не потвърден час. Студиото уточнява цената и часа след оглед според избраните зони. Автомобилът се предоставя измит, освен ако не е уговорено друго.',
  }, {
    name: 'Цветно фолио за автомобил',
    description: 'Формулярът е заявка за оглед, не потвърден час. Офертата е за външните панели; зоните около отворите на вратите се калкулират отделно по заявка. Автомобилът се предоставя измит, освен ако не е уговорено друго.',
  }], wrapBook, 'Формулярът приема заявки за оглед за защитно фолио и смяна на цвета. Работата е в ден и час, уговорени със студиото.'),
  branch(school, [{
    name: 'Шофьорски курс за категория B',
    description: 'Теоретично и практическо обучение за категория B. Записването за консултация е отделно от записването за курса. Цената и графикът за курса се уточняват с автошколата.',
  }], schoolBook, 'Бутонът „Да, интересувам се“ отваря формата за предварителна консултация на автошколата. Това не е записване за самия курс.'),
  branch(photo, [{
    name: 'Семейна фотосесия · Мини · 7 кадъра',
    description: 'За родители и едно дете: един декор, онлайн галерия и дигитална картичка. Цената е за целия пакет; допълнителните кадри и снимките с баба и дядо се заплащат отделно. Формулярът е заявка, а час се запазва с капаро.',
    price: { amount: 130, currency: 'EUR', kind: 'fixed', unit: 'за пакет', sourceUrl: family, checkedOn, validUntil },
  }], family, 'Семейната страница предлага избор на пакет „Мини“ във формуляра. Запазването на час изисква капаро.', photoContact),
]

export const VERIFIED_SOFIA_CROSS_QUARTER_20261127_REVIEWS = [
  unpriced([ppf, colour, wrapTerms], 'The inspection request, package pages and terms show no fee for the listed services. The final quote and date follow inspection; neither is inferred.', review(
    wrap, wrapBook, [ppf, colour, wrapTerms, 'https://bsprint.bg/kontakti/'],
    'Followed the direct inspection CTA and verified both exact service options on the first-party form before inspecting their pages and conditions. The same address, including Cyrillic 3Б, is stated by the studio and its associated operator BS PRINT. No submission or appointment confirmation.',
    'c2f7f50fba811a8c518087f53858f80c4bdbdfcde4b82c44c51e155b9a825a53',
  )),
  unpriced([schoolBook, schoolMobile], 'The reachable consultation form and the current first-party course pages do not publish a category B amount. The owner directs customers to discuss the price in its office.', review(
    school, schoolBook, [schoolMobile, roadRegister],
    'Followed the owner CTA to its visible consultation form. The course and Road Transport Administration entry 3447 agree on category B and the exact office next to entrance Д. The civic point is for that entrance, not a door survey. Kept conflicting phone numbers and a separate promotion out.',
    '4a4c9e1fe0dff4545c79ad915e36388b694cd64bde53f159a0f7ff8c5c484e6d',
  )),
  review(
    photo, family, [photoContact, `${photo.website}robots.txt`, lyulinDistrict],
    'The owner’s visible family menu and its enquiry form match for the Mini package at EUR 130 total for parents and one child, seven images, one set, online gallery and digital card. Deposit is required to reserve a time. Extras are separate. No date, availability or other package was imported. The owner and district place block 641 in Lyulin 6, and the exact pin is a civic block point. No form sent.',
    '513902719125422e44babfd22953789dabec529e242b3cc21c6cabfba9c1d13a',
  ),
]
