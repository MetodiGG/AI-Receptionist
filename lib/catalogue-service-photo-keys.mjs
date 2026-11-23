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
associations.set(key('sofia-part-time-pavlovo-duychev12v', 'education', 'Групово актьорско майсторство на английски за деца'), 'sx-acting-child')
associations.set(key('sofia-galileodent-nadezhda4-lomsko182', 'other', 'Профилактичен дентален преглед'), 'dental-exam')
associations.set(key('sofia-vm-auto-service-obelya-2-lomsko248a', 'auto_repair', 'Компютърна диагностика на автомобил'), 'auto-diagnostics')
associations.set(key('sofia-umni-deca-obelya2-106-3', 'education', 'Ментална аритметика за деца · математика с абакус'), 'sx-child-abacus-group')
associations.set(key('sofia-doichinova-lyulin3-block368', 'other', 'Първичен дентален преглед'), 'dental-exam')
associations.set(key('sofia-dbros-vrazhdebna-botevgradsko431', 'auto_repair', 'Компютърна диагностика на двигател и електроника'), 'auto-diagnostics')
associations.set(key('sofia-dbros-vrazhdebna-botevgradsko431', 'auto_repair', 'Проверка на окачване и кормилно управление'), 'sx-auto-suspension-diagnose-repair')
associations.set(key('sofia-kabident-lyulin9-vlaikov27', 'other', 'Лечение на кариес'), 'dental-filling')

export function catalogueServicePhotoFields(service, business) {
  if (typeof business?.id !== 'string' || typeof service?.name !== 'string' || typeof service?.category !== 'string') return {}
  const photoId = specificServicePhotoKey(associations.get(key(business.id, service.category, service.name)))
  return photoId ? { illustrativePhotoKey: photoId } : {}
}

export function catalogueDetailsWithServicePhotos(business, now) {
  const details = catalogueBusinessDetails(business, now)
  return { ...details, services: details.services.map(service => ({ ...service, ...catalogueServicePhotoFields(service, business) })) }
}
