// Owner-requested PUBLIC PRESENTATION exclusions only. The database rows,
// owner dashboard, authoritative booking reads and existing appointments stay
// intact. A renamed, described, repriced or otherwise qualified service returns
// automatically; do not infer additional placeholders from a name or price.
export const OWNER_HIDDEN_PUBLIC_SERVICE_PLACEHOLDERS = Object.freeze([
  'a8bfd4a9-1249-4a72-a1d3-5b78edfe2dd5',
  '146da856-04ad-40d2-8095-cdf34dc65bc6',
  '76f91048-afae-47ba-8d8b-003a99efe2c7',
].map(serviceId => Object.freeze({
  businessId: '6b57b901-acd8-494b-a992-2cec551b4b00', serviceId,
  name: 'Нова услуга', price: 0, approvedOn: '2026-11-13',
})))
const placeholders = new Map(OWNER_HIDDEN_PUBLIC_SERVICE_PLACEHOLDERS.map(row => [row.serviceId, row]))
const blank = value => value == null || typeof value === 'string' && value.trim() === ''
function unqualifiedZero(service) {
  if (service.price !== 0 && !(typeof service.price === 'string' && /^0(?:\.0+)?$/.test(service.price))) return false
  if (service.priceKind != null && service.priceKind !== 'fixed' || service.priceMaximum != null || !blank(service.priceUnit)) return false
  const details = service.price_details
  if (details == null) return true
  return typeof details === 'object' && !Array.isArray(details)
    && Object.keys(details).every(key => ['kind', 'maximum', 'unit'].includes(key))
    && (details.kind == null || details.kind === 'fixed') && details.maximum == null && blank(details.unit)
}
export function isPublicServiceVisible(service, business) {
  const expected = placeholders.get(service?.id)
  return !expected || business?.id !== expected.businessId || service.name !== expected.name
    || !blank(service.description) || !unqualifiedZero(service)
}
export function visiblePublicServices(business, services = business?.services) {
  if (!Array.isArray(services)) return []
  if (business?.id !== OWNER_HIDDEN_PUBLIC_SERVICE_PLACEHOLDERS[0].businessId) return services
  return services.some(service => !isPublicServiceVisible(service, business))
    ? services.filter(service => isPublicServiceVisible(service, business)) : services
}
