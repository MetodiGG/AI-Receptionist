import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS } from './catalogue-service-photo-associations.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261113 } from './catalogue-service-photo-associations-20261113.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261116 } from './catalogue-service-photo-associations-20261116.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261122 } from './catalogue-service-photo-associations-20261122.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_AZIS_20261122 } from './catalogue-service-photo-associations-azis-20261122.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_SUHODOL_20261122 } from './catalogue-service-photo-associations-suhodol-20261122.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_INTAKE_20261123 } from './catalogue-service-photo-associations-intake-20261123.mjs'
import { specificServicePhotoKey } from './specific-service-photo-ids.mjs'
import { catalogueBusinessDetails } from './discovery/business-details.mjs'

// Only this server adapter imports the exact-name inventory. Browser payloads
// carry a small allowlisted image ID, not thousands of catalogue names.
const key = (businessId, category, name) => JSON.stringify([businessId, category, name.trim()])
const associations = new Map([...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261113, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261116, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261122, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_AZIS_20261122, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_SUHODOL_20261122, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_INTAKE_20261123]
  .map(([businessId, category, name, photoId]) => [key(businessId, category, name), photoId]))
associations.set(key('sofia-mline-auto-detailing-gorublyane-pionerska2', 'detailing', 'Интериорен детайлинг'), 'sx-detail-complete-interior')
associations.set(key('sofia-luckydent-dragalevtsi-gluharche10', 'other', 'Първичен дентален преглед'), 'dental-exam')

export function catalogueServicePhotoFields(service, business) {
  if (typeof business?.id !== 'string' || typeof service?.name !== 'string' || typeof service?.category !== 'string') return {}
  const photoId = specificServicePhotoKey(associations.get(key(business.id, service.category, service.name)))
  return photoId ? { illustrativePhotoKey: photoId } : {}
}

export function catalogueDetailsWithServicePhotos(business, now) {
  const details = catalogueBusinessDetails(business, now)
  return { ...details, services: details.services.map(service => ({ ...service, ...catalogueServicePhotoFields(service, business) })) }
}
