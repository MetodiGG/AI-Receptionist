// One independently confirmed dental premises with the practice's phone booking.
import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-galileodent-nadezhda4-lomsko182'
const neighborhood = 'Надежда 4'
const address = 'София, ж.к. Надежда 4, бул. Ломско шосе 182, ет. 1, ателие 2'
const website = 'https://galileodent.com/'
const phone = '+359888910328'
const procedure = new URL('процедури/лечение-на-зъбен-кариес/', website).href
const menu = new URL('процедури/', website).href
const offers = new URL('специални-оферти/', website).href

export const GALILEODENT_INTAKE_20261123_RECORDS = [{
  id, name: 'Галилеодент', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.734741, longitude: 23.293965,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '104319', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'other', website, phone,
  services: [{ name: 'Профилактичен дентален преглед', category: 'other', appointmentModel: 'appointment' }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil,
    booking: { url: website, excerpt: 'Кабинетът публикува телефон за записване на час; страницата за лечение на кариес посочва профилактичния преглед като начало на първото посещение.' },
    contact: website,
  },
}]

export const GALILEODENT_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, menu, procedure, offers, new URL('sitemap_index.xml', website).href,
    'https://reports.nhif.bg/nhif_reports/nhif_partners/?district=&page=dentists&rzok=22'],
  notes: 'The practice explicitly offers telephone appointments on its landing page and the specific procedure page. The service page identifies an in-office preventive dental examination at the beginning of the first visit. No standalone treatment, fixed examination duration or appointment availability is asserted. The official NHIF row names the same independent dental practice and telephone and specifies floor 1, studio 2 at 182 Lomsko shose. Sofia order RA50-391 identifies no. 182 and the adjacent regulated parcel in the Nadezhda 4 plan; the single exact postal point is municipal row 104319, not a surveyed door or floor. No case stories, patient information, owner photographs, public reviews, provider form submission or call.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: website, serviceUrls: [menu, procedure, offers],
    notes: 'Read the visible owner telephone booking invitation, the procedures menu, the first-visit examination section and the special-offers page; none displays a price for the selected examination. The owner public page/project sitemaps had no tariff page. A redundant contact view later presented verification; no workaround or tariff inference relied on that view.',
  },
  inventoryIdentity: 'd1e25c4f6778f183e3877c17b889259fe28c53cd88d3e5872da369437b1e5faf',
}]
