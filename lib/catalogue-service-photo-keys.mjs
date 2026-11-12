import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS } from './catalogue-service-photo-associations.mjs'
import { specificServicePhotoKey } from './specific-service-photo-ids.mjs'
import { catalogueBusinessDetails } from './discovery/business-details.mjs'

// Only this server adapter imports the exact-name inventory. Browser payloads
// carry a small allowlisted image ID, not thousands of catalogue names.
const key = (businessId, category, name) => JSON.stringify([businessId, category, name.trim()])
const associations = new Map(CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS.map(([businessId, category, name, photoId]) => [key(businessId, category, name), photoId]))

export function catalogueServicePhotoFields(service, business) {
  if (typeof business?.id !== 'string' || typeof service?.name !== 'string' || typeof service?.category !== 'string') return {}
  const photoId = specificServicePhotoKey(associations.get(key(business.id, service.category, service.name)))
  return photoId ? { illustrativePhotoKey: photoId } : {}
}

export function catalogueDetailsWithServicePhotos(business, now) {
  const details = catalogueBusinessDetails(business, now)
  return { ...details, services: details.services.map(service => ({ ...service, ...catalogueServicePhotoFields(service, business) })) }
}
