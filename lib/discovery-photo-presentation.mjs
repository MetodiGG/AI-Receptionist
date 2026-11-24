import assignments from './discovery-photo-ownership.json' with { type:'json' }
import { businessCoverPhoto } from './business-cover-photo.mjs'
import { serviceThumbnail } from './service-thumbnail.mjs'
import { reviewedPartnerServicePhoto } from './partner-service-photos.mjs'
import { discoveryServicePhotoIdentity, partnerServicePhotoIdentity, staticDiscoveryPhotoPath } from './discovery-photo-identity.mjs'

// Separate scenes for the cover and service, restricted to the named branch
// and exact service. Never assign these to a navigation tile or another row.
const catalogueIllustrations = Object.freeze({
  'sofia-nosia-todor-alexandrov17': {
    cover: '/business-cover-photos/go-nosia-todor-alexandrov-20261125-v1.webp',
    service: '/service-photos/go-nosia-folk-dance-beginners-20261125-v1.webp',
    identity: '["fitness","български народни танци · група за начинаещи"]',
  },
  'sofia-latin-force-centre': {
    cover: '/business-cover-photos/go-latin-force-centre-20261125-v1.webp',
    service: '/service-photos/go-latin-force-individual-dance-20261125-v1.webp',
    identity: '["fitness","индивидуален урок по танци"]',
  },
})
const branchArt = business => Object.hasOwn(catalogueIllustrations,business?.id) ? catalogueIllustrations[business.id] : null

// A dedicated trusted photo is still allowed for its exact partner service.
// Generated assets are available only to the reviewed owning entity. New text,
// a misleading fallback or a failed image cannot borrow another entity's photo.
export function publicServiceThumbnail(service,{business,locale='bg',trustedServiceImage,unavailableSources=[]}={}) {
  const identity=discoveryServicePhotoIdentity(service,business)
  const reviewed=reviewedPartnerServicePhoto(service,business)
  const partnerIdentity=reviewed && partnerServicePhotoIdentity(service,business)
  const unavailable=new Set(Array.isArray(unavailableSources)?unavailableSources:[])
  const absent={type:'unavailable',photoMatch:'none',src:null,srcSet:null}
  const bespoke=branchArt(business)
  for (let i=0; i<6; i++) {
    const photo=serviceThumbnail(service,{business,locale,trustedServiceImage,unavailableSources:[...unavailable]})
    // The legacy resolver validates (rights, tenant, service ID and source)
    // of real media. No uploaded business/gallery images are rewritten.
    if (photo.source==='provided' || (!photo.source && photo.photoMatch==='exact')) return photo
    if (bespoke?.identity===identity && !unavailable.has(bespoke.service)) {
      return { kind:photo.kind,icon:photo.icon,type:'photo',source:'illustrative',photoMatch:'activity',src:bespoke.service,srcSet:null,
        alt:locale==='en'?'Illustration of the dance lesson, not a photograph of this business':'Илюстрация на урока по танци, не е снимка от бизнеса' }
    }
    if (!photo.src || photo.photoMatch==='neutral' || unavailable.has(photo.src)) return {...absent,kind:photo.kind,icon:photo.icon}
    const path=staticDiscoveryPhotoPath(photo.src)
    const owner=path && Object.hasOwn(assignments.owners,path) ? assignments.owners[path] : null
    if (owner && (owner===identity || owner===partnerIdentity)) return photo
    unavailable.add(photo.src)
  }
  return absent
}

// A branded gallery is handled by the callers before this illustration
// fallback. Never render stock photography for a bare category or generic
// future business. Re-encoding the same service photo is not a new photo.
export function publicBusinessCoverPhoto(business,{unavailableSources=[]}={}) {
  const selection=businessCoverPhoto(business,{unavailableSources})
  const path=staticDiscoveryPhotoPath(selection.src), fallback=staticDiscoveryPhotoPath(selection.fallbackSrc)
  const own=source=>source && Object.hasOwn(assignments.coverOwners,source) && assignments.coverOwners[source]===business?.id
  const bespoke=branchArt(business)
  if (bespoke && !unavailableSources.includes(bespoke.cover)) {
    return {category:selection.category,src:bespoke.cover,size:720,height:540}
  }
  return { category:selection.category,size:selection.size,
    src:own(path)?selection.src:null,
    ...(own(fallback)?{fallbackSrc:selection.fallbackSrc}:{}),
    ...(own(path)&&selection.activityPhotoKey?{activityPhotoKey:selection.activityPhotoKey}:{}),
  }
}
