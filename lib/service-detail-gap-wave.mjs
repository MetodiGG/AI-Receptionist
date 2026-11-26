import { discoveryServicePhotoIdentity } from './discovery-photo-identity.mjs'
import beauty from './service-detail-gap-reviewed-beauty.json' with { type: 'json' }
import motor from './service-detail-gap-reviewed-motor.json' with { type: 'json' }
import activity from './service-detail-gap-reviewed-activity.json' with { type: 'json' }
import generated from './service-detail-gap-generated.json' with { type: 'json' }
import exclusions from './service-detail-gap-wave-exclusions.json' with { type: 'json' }

const keyFor = (category, name) => discoveryServicePhotoIdentity({ category, name })
const choices = new Map()
// Exact reviewed existing photographs win over a newly generated alternative.
// Larger cards, listings, existing thumbnails and partner originals are not
// modified by this fallback: it is consulted only for an unillustrated detail.
for (const photo of [...beauty, ...motor, ...activity, ...generated]) {
  for (const [category, name] of photo.services) {
    const key = keyFor(category, name)
    if (!choices.has(key)) choices.set(key, [])
    const items = choices.get(key)
    if (!items.some(item => item.src === photo.src)) items.push(photo)
  }
}

const exclusionKey = (businessId, identity) => businessId + '\0' + identity
const blocked = new Map()
for (const [businessId, category, name, source] of exclusions) {
  const key = exclusionKey(businessId, keyFor(category, name))
  if (!blocked.has(key)) blocked.set(key, new Set())
  blocked.get(key).add(source)
}

export function detailGapWavePhotos(service, business) {
  if (business?.source !== 'catalogue') return []
  const key = discoveryServicePhotoIdentity(service, business)
  const photos = choices.get(key)
  if (!photos) return []
  const excluded = blocked.get(exclusionKey(business.id, key))
  return excluded ? photos.filter(photo => !excluded.has(photo.src)) : photos
}
