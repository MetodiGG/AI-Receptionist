import { discoveryServicePhotoIdentity } from './discovery-photo-identity.mjs'
import home from './service-detail-gap-followup-home.json' with { type: 'json' }
import beauty from './service-detail-gap-followup-beauty.json' with { type: 'json' }
import lessons from './service-detail-gap-followup-lessons.json' with { type: 'json' }
import generated from './service-detail-gap-followup-generated.json' with { type: 'json' }
import exclusions from './service-detail-gap-followup-exclusions.json' with { type: 'json' }

const keyFor = (category, name) => discoveryServicePhotoIdentity({ category, name })
const choices = new Map()
const block = new Map()
// These exact bindings fill previously empty detail slots only. Aliases are
// reviewed catalog titles, not a pattern match against free-form partner data.
for (const photo of [...generated, ...beauty, ...home, ...lessons]) {
  for (const [category, name] of photo.services) {
    const key = keyFor(category, name)
    const options = choices.get(key) || []
    if (!options.some(option => option.src === photo.src)) options.push(photo)
    choices.set(key, options)
  }
}
for (const [businessId, category, name, src] of exclusions) {
  const key = businessId + '\0' + keyFor(category, name)
  const sources = block.get(key) || new Set()
  sources.add(src)
  block.set(key, sources)
}

export function detailGapFollowupPhotos(service, business) {
  if (business?.source !== 'catalogue') return []
  const key = discoveryServicePhotoIdentity(service, business)
  const options = choices.get(key) || []
  const blocked = block.get(business.id + '\0' + key)
  return blocked ? options.filter(photo => !blocked.has(photo.src)) : options
}
