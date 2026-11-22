import { PLATFORM_CATALOGUE_CONFIRMATIONS } from '../catalogue-platform-confirmations.mjs'

// Two distinct premises, directly requested by the GoRez platform owner.
// Public Maps establishes the branch references only; the shared phone and
// nine services are user-confirmed facts, NOT scraped Maps/AI menu content.
export const AZIS_RAW_RECORDS = PLATFORM_CATALOGUE_CONFIRMATIONS.map(entry => ({
  id: entry.id, name: entry.name, cityCode: entry.cityCode, neighborhood: null,
  address: entry.address, locationKind: 'premises', coordinates: null,
  category: entry.category, website: entry.website, phone: entry.phone,
  services: entry.services.map(([name, category]) => ({ name, category, appointmentModel: 'appointment' })),
  booking: { kind: 'phone', phone: entry.phone },
  verification: {
    status: 'approved', checkedOn: entry.checkedOn, validUntil: entry.validUntil,
    sourceKind: 'platform_owner_confirmation', confirmationReference: entry.reference,
    booking: { url: entry.website, excerpt: 'Контактът и деветте услуги са потвърдени от администратора на GoRez на 22.11.2026. Часът се уточнява със салона.' },
    contact: entry.website,
  },
}))

export const AZIS_PRICE_REVIEWS = PLATFORM_CATALOGUE_CONFIRMATIONS.map(entry => ({
  id: entry.id, checkedOn: entry.checkedOn, website: entry.website, bookingEntry: 'phone',
  reviewedUrls: [entry.website], bookingReview: 'platform_owner_contact_confirmed',
  pricingDecision: 'platform_owner_confirmed_unpriced', confirmationReference: entry.reference,
  inventoryIdentity: entry.inventoryIdentity, confirmationFactsIdentity: entry.factsIdentity,
  notes: 'Explicit platform-owner intake, not a salon-owner website or rendered booking-menu review. The user requested both branches, confirmed the same893804054 contact, specified nine services including children, then changed the main category to Hairdresser. Public Maps profiles were inspected independently for the two distinct premises. Prices were not supplied; this makes no claim that a public tariff does not exist. No duration, opening hours, precise point, appointment slot, first-party website or branch-specific fee inferred. No call, form, booking, customer input or notification submitted. Full confirmation receipt: docs/catalogue-regions/azis-style-confirmation-20261122.json.',
}))
