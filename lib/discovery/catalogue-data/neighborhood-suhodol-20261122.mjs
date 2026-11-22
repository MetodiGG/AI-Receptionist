// One independently reviewed physical practice, not an online-only duplicate.
// Minimal current service facts only; no owner photos, patient reviews or biography.
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-22', validUntil = '2026-12-22'
const site = 'https://moetoslunce.com/'
const booking = 'https://superdoc.bg/lekar/maria-kamenova'
const address = 'София, кв. Суходол, ул. Щит 9'
const id = 'sofia-maria-kamenova-suhodol-shtit9'

export const SUHODOL_20261122_RECORDS = [{
  id, name: 'Мария Каменова · Моето слънце',
  cityCode: '68134', neighborhood: 'Суходол', address, locationKind: 'premises',
  coordinates: {
    latitude: 42.699806, longitude: 23.225159,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: 'Суходол', sourceWebsite: site,
    checkedOn, addressId: '120774', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'other', website: site, phone: '+359898636810',
  services: [{
    name: 'Психологична консултация', category: 'other', appointmentModel: 'appointment',
    description: 'Присъствена психологична консултация в кабинет с предварително записване. Часът се запазва през външния календар на специалиста.',
    durationMin: 60, durationSourceUrl: booking, durationCheckedOn: checkedOn,
    price: { amount: 50, currency: 'EUR', kind: 'fixed', sourceUrl: booking, checkedOn, validUntil },
  }, {
    name: 'Семейна терапия', category: 'other', appointmentModel: 'appointment',
    description: 'Присъствена семейна терапия в кабинет с предварително записване. Часът се запазва през външния календар на специалиста.',
    durationMin: 60, durationSourceUrl: booking, durationCheckedOn: checkedOn,
    price: { amount: 60, currency: 'EUR', kind: 'fixed', sourceUrl: booking, checkedOn, validUntil },
  }],
  booking: { kind: 'form', url: booking },
  verification: {
    status: 'approved', checkedOn, validUntil,
    booking: { url: `${site}contact`, excerpt: 'Страницата за контакт посочва Мария Каменова, ул. Щит 9 и връзка „Запази час през Superdoc“ към външния календар на специалиста.' },
    contact: `${site}contact`,
  },
}]

export const SUHODOL_20261122_REVIEWS = [{
  id, checkedOn, website: site, bookingEntry: booking, bookingReview: 'provider_booking_reviewed',
  reviewedUrls: [site, `${site}about`, `${site}contact`, `${site}privacy-policy`, `${site}robots.txt`,
    booking, 'https://superdoc.bg/uslovia-za-polzvane', 'https://superdoc.bg/robots.txt'],
  notes: 'Current owner About and Contact were fully rendered and reviewed in the main browser before admission: both identify the same specialist, professional phone and Sofia Shtit9 address, and explicitly link to this actual Superdoc appointment profile. The selected default in-office panel, not the separate Healee/video calendar, explicitly names Center Moeto Slantse, Suhodol, Shtit9 and the identical phone. The complete public visit-reason menu and expanded physical tariff were inspected without selecting any appointment: consultation60minutes50EUR, psychotherapy60minutes50EUR and family therapy60minutes60EUR. Only the two minimal standalone physical services are admitted; psychotherapy is not duplicated as another consultation, and no child, online, home-visit, general-medical or credential claim is imported. A second independent fresh public HTTP200 profile inspection confirmed the physical venue, current50/50/60EUR tariff and60minute durations. Its owner backlink is literally http://www.moetoslunce.com; the current canonical HTTPS owner site was separately verified, not falsely recorded as the literal backlink. The old mariakamenova.eu online-only60BGN description is an earlier different modality, not the current physical tariff; indexed40EUR is stale against both current rendered owner50EUR and the current physical50EUR panel. Neither older amount is imported or converted. The two live selected price facts remain literal fixed EUR fees with a short22December recheck, not guaranteed availability or a GoRez booking confirmation. Current owner privacy and complete provider terms dated7April2026 were reviewed; no express restriction on these minimal facts was observed, not a copyright licence or legal-clearance assertion. No authored materials, biography, patient information, reviews, ratings or source images are reused. Both public robots documents permit the reviewed paths. Exact source name, phone, website and address were deduplicated across the existing catalogue and intake, yielding one operator, not two domains or one record per clinician/service. Root separately verified the unchanged user-supplied municipal CSV and exactly one Sofia Shtit9 postal row120774; its administrative region OvchaKupel does not replace the independently named quarter Suhodol. The municipal pair is an exact postal-address binding, not a surveyed practice entrance. No guessed hours, extra services, coordinates from a map viewport, calendar availability, private API, account, consent, notification, form submission, booking, call, message or payment was used.',
  // Sealed once from the final schema-normalized two-service inventory after review.
  inventoryIdentity: '071a732c6c5d784a600e7dea7d82110fca917ca3f5ad32225e248fb6f3261502',
}]
