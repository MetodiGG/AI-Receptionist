// One independently verified in-person school; enrolment by phone, not calendar availability.
import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-horo-moderno-predgradie-evropa20'
const neighborhood = 'Модерно предградие'
const address = 'София, кв. Модерно предградие, бул. Европа 20, НЧ „Св. св. Кирил и Методий – 1922“'
const website = 'https://horo-bg.org/'
const programme = `${website}танцувай-с-нас/`
const enrollment = `${website}танцова-школа-хоро-открива-нова-група/`
const contact = `${website}контакти/`
const phone = '+359887927762'

export const HORO_INTAKE_20261123_RECORDS = [{
  id, name: 'Танцова школа „Хоро“ · Модерно предградие', cityCode: '68134', neighborhood,
  address, locationKind: 'premises',
  coordinates: {
    latitude: 42.721792, longitude: 23.271684,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '15217', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'fitness', website, phone,
  services: [{
    name: 'Български народни танци за начинаещи',
    category: 'fitness', appointmentModel: 'group_reservation',
    description: 'Присъствени групови занимания за начинаещи. Уточни по телефона приема в групата, графика и таксата.',
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: contact, excerpt: 'Школата насочва желаещите за групата за начинаещи в тази зала към своята програма и към контакт с хореографа. Участието се уточнява по телефона.' },
  },
}]

export const HORO_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, enrollment, contact, programme, `${website}услуги/`],
  notes: 'The first-party enrolment announcement names this beginner group and exact hall, then sends prospective dancers directly to the owner’s contact and standing programme. The announcement’s original opening date and times are historical and are not imported. The current standing programme again lists the same hall and beginner group; the live owner contact names the choreographer and repeats the public telephone. Only the procedure to request enrolment is described; a call is not a confirmed slot. A second Sofia hall is not included. The municipal address export records the alias Slivnitsa 20; the SofiaPlan named community-centre feature identifies the same site as Evropa 20, within about 6.5 metres of the unique Sofia municipal row. Only the municipal point is retained. No timetable, duration, photos, website prose, account, submission, call, booking, payment, geocoder or production action.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: contact, serviceUrls: [programme, enrollment, `${website}услуги/`],
    notes: 'Read the actual public branch enrolment invitation and contact entry first, followed by the stand-alone recurring group programme and the owner’s Services page. None publishes an amount, price link or restricted tariff menu for the selected beginner group. The Services page covers performances, which are not classes. No performance fee, membership assumption or old unofficial amount is published.',
  },
  inventoryIdentity: 'b3cff2506266b23b8dd62f1d4e21dc2de590451f99b5df0714a5693a2f848842',
}]
