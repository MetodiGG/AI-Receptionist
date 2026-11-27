import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-ramirus-levski-v-letostruy91a', name = 'Автошкола Рамирус'
const cityCode = '68134', neighborhood = 'Левски В', category = 'education'
const address = 'София, ул. Летоструй 91А'
const website = 'https://ramirus.com/', phone = '+359896603600'
const manual = website + 'kategoria-b/', automatic = website + 'kategoria-b-za-avtomatik/'
const refresh = website + 'opresnitelni-kursove/', courses = website + 'shofiorski-kursove/'
const contact = website + 'kontakti/', privacy = website + 'politika-za-poveritelnost/'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'
const followup = 'Изпрати заявка през сайта. Автошколата ще се свърже с теб за графика и цената.'
const lesson = (name, details) => ({ name, category, appointmentModel: 'appointment', description: details + ' ' + followup })

export const VERIFIED_RAMIRUS_LEVSKI_V_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.706486, longitude: 23.383339, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '28282', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [
    lesson('Шофьорски курс категория B · ръчни скорости', 'Теоретично обучение и кормуване с автомобил с ръчни скорости.'),
    lesson('Шофьорски курс категория B78 · автоматик', 'Теоретично обучение и кормуване с автомобил с автоматични скорости.'),
    lesson('Индивидуални опреснителни часове по кормуване', 'Практически часове с инструктор за шофьори с книжка.'),
  ],
  booking: { kind: 'form', url: website },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: website, excerpt: 'Във формуляра за записване избери курс или опреснителни часове. Автошколата се свързва с теб, за да уточните обучението.' },
  },
}]

export const VERIFIED_RAMIRUS_LEVSKI_V_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: website, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, manual, automatic, refresh, courses, contact, privacy,
    'https://rta.government.bg/upload/18445/uchebni_centrove.html', OFFICIAL_SOFIA_SOURCE_URL],
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: website, serviceUrls: [courses, manual, automatic, refresh, contact],
    notes: 'The actual owner enrolment form and all reachable exact selection/course pages were inspected by ordinary public HTTPS GET with HTTP 200, not a challenge or empty provider shell. Категория B, Категория B автоматик and Опреснителни часове are genuine selector options. The course index, two exact theory/practice pages, individual-refresher page, homepage booking section and contacts disclose no monetary amount, fee, package total or public tariff for the three selected options. No separate tariff link appeared in the reviewed owner navigation or footer. Prices are not inferred from estimated durations, market listings, historic conversions or other providers.',
  },
  inventoryIdentity: '1a668a2429ca482c8c5b7fa53cd3dd573a97ff18a3b305189ef875b8637a5051',
  notes: 'One licensed school; no claimed tuition rate, guaranteed slot, exact theory/practical duration, licence eligibility or other instructor listing. The first-party form asks for name, phone and course and promises a later reply; no public current availability or confirmed enrolment. Official IAAA register #3831 independently matches the complete visit address, matching phone and B/B(78). Municipal RN28282 is the exact building number, not a doorway pin. Owner prints generic Левски; the location-specific driving-school register locates this street number in Левски В. Each exact first-party course page was directly inspected, no source of prices was blocked. No form submission, account, booking, marketing or calendar/analytics change.',
}]
