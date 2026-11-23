// One reviewed dental practice at its physical address, not a platform partner.
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-luckydent-dragalevtsi-gluharche10'
const address = 'София, кв. Драгалевци, ул. Глухарче 10'
const neighborhood = 'Драгалевци'
const profile = 'https://superdoc.bg/lekar/zhenina-peykova'

export const VERIFIED_INTAKE_20261123_RECORDS = [{
  id, name: 'Luckydent · д-р Женина Пейкова',
  cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.631164, longitude: 23.311752,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: profile,
    checkedOn, addressId: '9317', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'other', website: profile, phone: '+359895603180',
  services: [{
    name: 'Първичен дентален преглед', category: 'other', appointmentModel: 'appointment',
    description: 'Кабинетът моли да носите актуална панорамна снимка, за предпочитане дигитална и направена през последните 6 месеца.',
    price: { amount: 30, currency: 'EUR', kind: 'fixed', sourceUrl: profile, checkedOn, validUntil },
  }],
  booking: { kind: 'form', url: profile },
  verification: {
    status: 'approved', checkedOn, validUntil,
    booking: { url: profile, excerpt: 'Публичният профил за записване посочва клиника Luckydent, ул. Глухарче 10 и предлага първичен преглед в кабинета.' },
    contact: profile,
  },
}]

export const VERIFIED_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website: profile, bookingEntry: profile, bookingReview: 'provider_booking_reviewed',
  reviewedUrls: [profile, 'https://superdoc.bg/uslovia-za-polzvane', 'https://superdoc.bg/robots.txt'],
  notes: 'The practitioner-managed public booking profile identifies the physical Luckydent practice, Dragalevtsi, Gluharche 10 and the published professional phone; it is the external booking entry, not a separately owned site or a GoRez calendar. The visible reason menu says Първичен преглед; the visible practice price panel gives a literal EUR30 for that examination, with a typo in the display label. The preparation note is paraphrased as the practice’s request. Tartar cleaning has a listed price but is not a separately named reason in the reviewed menu and is not imported. No public fixed duration, weekly hours or available slots are retained. The separate provider terms and public robots were reviewed; no express restriction on these minimal factual details or onward link was observed, and no licence is asserted. No authored profile prose, photographs, patient reviews or ratings are reused. The hash-pinned municipal CSV contains one exact Sofia street-number record, rn9317. The point is a municipal postal address, not a surveyed entrance. No slot, form, contact or real appointment was used.',
  inventoryIdentity: 'aa9b7eda8b1d1f553a0f7ed12a6dcef1c72e1134ccf5ab328d8009b577b22912',
}]
