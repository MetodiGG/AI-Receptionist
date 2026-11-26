import { discoveryServicePhotoIdentity } from './discovery-photo-identity.mjs'
import mechanical from './service-detail-tail-mechanical.json' with { type: 'json' }
import wellness from './service-detail-tail-wellness.json' with { type: 'json' }
import lessons from './service-detail-tail-lessons.json' with { type: 'json' }
import generated from './service-detail-tail-generated.json' with { type: 'json' }
import exclusions from './service-detail-tail-exclusions.json' with { type: 'json' }

const identity = (category, name) => discoveryServicePhotoIdentity({ category, name })
const choices = new Map()
for (const photo of [...generated, ...mechanical, ...wellness, ...lessons]) {
  for (const [category, name, businessId] of photo.services) {
    const key = identity(category, name)
    const options = choices.get(key) || []
    if (!options.some(option => option.photo.src === photo.src && option.businessId === businessId)) {
      options.push({ photo, businessId })
    }
    choices.set(key, options)
  }
}

const blocked = new Map()
for (const [businessId, category, name, src] of exclusions) {
  const key = businessId + '\0' + identity(category, name)
  const sources = blocked.get(key) || new Set()
  sources.add(src)
  blocked.set(key, sources)
}

// Review receipts name exact public service titles. An optional branch makes
// a context-dependent offer such as "Пробен урок" safe without inferring its
// activity for different venues that happen to use the same wording.
export function serviceDetailTailPhotos(service, business) {
  if (business?.source !== 'catalogue') return []
  const key = discoveryServicePhotoIdentity(service, business)
  const options = choices.get(key) || []
  const banned = blocked.get(business.id + '\0' + key)
  return options.filter(({ photo, businessId }) => (!businessId || businessId === business.id) && !banned?.has(photo.src))
    .map(({ photo }) => photo)
}
