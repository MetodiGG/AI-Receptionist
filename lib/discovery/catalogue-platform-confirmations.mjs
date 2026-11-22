// Explicit, bounded platform-owner confirmations, not business-owner website
// reviews. Only the two branches requested in the 2026-11-22 conversation are
// admitted here. Price absence means NOT SUPPLIED, never an unpublished tariff.
// Literal inventory/full-facts hashes are sealed after schema normalization.
const services = Object.freeze([
  ['Мъжко подстригване', 'hair'], ['Дамско подстригване', 'hair'],
  ['Детско подстригване', 'hair'], ['Прически', 'hair'],
  ['Удължаване на коса', 'hair'], ['Сгъстяване на коса', 'hair'],
  ['Оформяне на вежди', 'beauty'], ['Боядисване на коса', 'hair'], ['Балеаж', 'hair'],
].map(Object.freeze))
const checkedOn = '2026-11-22', validUntil = '2027-02-20'
const publicMap = query => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
export const PLATFORM_CATALOGUE_CONFIRMATIONS = Object.freeze([
  Object.freeze({
    id: 'lom-azis-stil-krum-pastarmadzhiev7', reference: 'gorez-platform-confirmation-20261122-azis-lom',
    name: 'Азис Стил · Лом', cityCode: '44238', address: 'Лом, ул. Крум Пастърмаджиев 7',
    website: publicMap('Азис Стил Лом Крум Пастърмаджиев 7'), phone: '+359893804054', category: 'hair',
    services, checkedOn, validUntil, inventoryIdentity: 'd95a31d153b8fc3a368b95572b3a7bfcf106364d2a994f09d4c60af8f1880369',
    factsIdentity: 'a39ea4c46022c43870618d080d42b5645d88ad026aa551f200175e539af4779c',
  }),
  Object.freeze({
    id: 'brusartsi-azis-stil-septemvri8', reference: 'gorez-platform-confirmation-20261122-azis-brusartsi',
    name: 'Азис Стил · Брусарци', cityCode: '06570', address: 'Брусарци, ул. 9-ти септември 8',
    website: publicMap('Азис Стил 2 Брусарци 9-ти септември 8'), phone: '+359893804054', category: 'hair',
    services, checkedOn, validUntil, inventoryIdentity: '825b239b4da6857578ff4fcdeb839e7fb2d701072683eed40330713bf1941556',
    factsIdentity: '04adf935e547d2b26cffaf9d623408dfdbb5d04b9cbd147a76c17643d0e1881b',
  }),
])
const byId = new Map(PLATFORM_CATALOGUE_CONFIRMATIONS.map(item => [item.id, item]))
export const isPlatformConfirmedCatalogueId = id => byId.has(id)

// Client-safe exact-facts check, no network, crypto, database or generic waiver.
// A reference alone cannot turn another listing or additional facts into an
// approved manual record. Missing hours/points/prices are never synthesized.
export function platformCatalogueConfirmation(row) {
  const entry = byId.get(row?.id), verification = row?.verification
  if (!entry || verification?.sourceKind !== 'platform_owner_confirmation' ||
      verification.confirmationReference !== entry.reference || verification.status !== 'approved' ||
      verification.checkedOn !== entry.checkedOn || verification.validUntil !== entry.validUntil ||
      verification.booking?.url !== entry.website || verification.contact !== entry.website) return null
  for (const field of ['name', 'cityCode', 'address', 'website', 'phone', 'category']) if (row[field] !== entry[field]) return null
  if (row.neighborhood !== null || row.locationKind !== 'premises' || row.coordinates !== null ||
      row.openingHours !== undefined || row.photo !== undefined || row.gorezBusinessId !== undefined ||
      row.booking?.kind !== 'phone' || row.booking.phone !== entry.phone || Object.keys(row.booking).length !== 2 ||
      !Array.isArray(row.services) || row.services.length !== entry.services.length) return null
  if (!row.services.every((service, index) => Object.keys(service).length === 3 &&
      service.name === entry.services[index][0] && service.category === entry.services[index][1] &&
      service.appointmentModel === 'appointment')) return null
  return entry
}

// Explicit projection used by the OFFLINE hash gate. Unlike pricingIdentity,
// it also binds the branch/address/contact/category/verification source facts.
export const platformConfirmationFacts = row => [row.id, row.name, row.cityCode, row.neighborhood,
  row.address, row.locationKind, row.coordinates, row.category, row.website, row.phone,
  row.services, row.openingHours ?? null, row.booking, row.verification]
