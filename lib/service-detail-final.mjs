import { discoveryServicePhotoIdentity } from './discovery-photo-identity.mjs'
import generated from './service-detail-final-generated.json' with { type: 'json' }
import mechanical from './service-detail-final-mechanical.json' with { type: 'json' }
import wellness from './service-detail-final-wellness.json' with { type: 'json' }
import lessons from './service-detail-final-lessons.json' with { type: 'json' }

const key = (businessId, service) => businessId + '\0' + service
const exact = new Map()
for (const photo of [...generated, ...mechanical, ...wellness, ...lessons]) {
  for (const [category, name, businessId] of photo.services) {
    if (!businessId) continue
    const id = key(businessId, discoveryServicePhotoIdentity({ category, name }))
    const candidates = exact.get(id) || []
    if (!candidates.some(candidate => candidate.src === photo.src)) {
      candidates.push(photo)
      exact.set(id, candidates)
    }
  }
}

// In this last wave, even seemingly generic names are scoped to an actual
// catalogue branch. A cover or failed source is still excluded by the shared
// detail resolver, regardless of how the candidate was assigned.
export function serviceDetailFinalPhotos(service, business) {
  if (business?.source !== 'catalogue' || !business.id) return []
  return exact.get(key(business.id, discoveryServicePhotoIdentity(service, business))) || []
}
