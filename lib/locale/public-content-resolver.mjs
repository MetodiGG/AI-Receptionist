import { serviceSourcePresentation } from '../discovery/service-presentation.mjs'
import { englishPresentationText, postalDisplay } from './public-content.mjs'

// Server adapter factory independent of the heavy authored dictionary.
export function createEnglishContentResolver(dictionary) {
  const lookup = (field, raw) => typeof raw === 'string' && Object.hasOwn(dictionary?.[field] || {}, raw) ? dictionary[field][raw] : ''
  const categoryIds = new Set(['hair', 'nails', 'beauty', 'barber', 'auto', 'auto_repair', 'car_wash', 'fitness', 'education', 'pets', 'home_services', 'health', 'consulting', 'detailing', 'other'])
  const contextualNames = new Set(Object.values(dictionary?.contextual || {}).flatMap(map => Object.keys(map)))
  function service(service, business = {}) {
    if (!service || typeof service !== 'object') return service
    const source = serviceSourcePresentation(service, 'en')
    const category = [service.category, business.businessCategory, business.category, business.industry].find(value => categoryIds.has(value)) || ''
    const contextual = dictionary?.contextual?.[category]
    const contextualName = contextual && Object.hasOwn(contextual, service.name) ? contextual[service.name] : ''
    // A token/history read may lack category context. Never pick the generic
    // meaning for a source with a materially different contextual translation.
    const uncertain = !category && contextualNames.has(service.name)
    const unit = service.priceUnit ?? service.price_details?.unit ?? service.price?.unit ?? ''
    return { ...service, presentationEn: {
      name: englishPresentationText(service.name, uncertain ? '' : contextualName || lookup('names', service.name), { service: true }),
      description: englishPresentationText(source.description, lookup('descriptions', source.description)),
      unit: englishPresentationText(unit, lookup('units', unit)),
      category: englishPresentationText(service.category, lookup('names', service.category)),
    } }
  }
  function prose(raw, supplied = '') { return englishPresentationText(raw, supplied || lookup('descriptions', raw) || lookup('businessDescriptions', raw) || lookup('staffBios', raw)) }
  function business(row) {
    if (!row || typeof row !== 'object') return row
    const description = row.details?.description || row.public_profile?.description || row.description
    const source = typeof description === 'object' && description ? description.bg || description.en : description
    const supplied = typeof description === 'object' && description ? description.en : ''
    return { ...row,
      ...(Array.isArray(row.services) ? { services: row.services.map(item => service(item, row)) } : {}),
      ...(Array.isArray(row.servicePreview) ? { servicePreview: row.servicePreview.map(item => service(item, row)) } : {}),
      ...(row.details ? { details: { ...row.details, ...(Array.isArray(row.details.services) ? { services: row.details.services.map(item => service(item, row)) } : {}) } } : {}),
      ...(Array.isArray(row.staff) ? { staff: row.staff.map(person => ({ ...person, ...(person.bio ? { bioEn: prose(person.bio) } : {}) })) } : {}),
      presentationEn: { address: postalDisplay(row.address, 'en'), city: postalDisplay(row.city, 'en'), neighborhood: postalDisplay(row.neighborhood, 'en'),
        description: prose(source, supplied), bookingTerms: prose(row.booking_terms), instructions: prose(row.bot_instructions) },
    }
  }
  function booking(value) {
    if (!value || typeof value !== 'object') return value
    return { ...value, ...(value.service ? { service: service(value.service, value.business) } : {}), ...(value.business ? { business: business(value.business) } : {}) }
  }
  return { service, business, booking, prose }
}
