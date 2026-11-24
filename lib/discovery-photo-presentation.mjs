import assignments from './discovery-photo-ownership.json' with { type:'json' }
import { businessCoverPhoto } from './business-cover-photo.mjs'
import { serviceThumbnail } from './service-thumbnail.mjs'
import { reviewedPartnerServicePhoto } from './partner-service-photos.mjs'
import { discoveryServicePhotoIdentity, partnerServicePhotoIdentity, staticDiscoveryPhotoPath } from './discovery-photo-identity.mjs'

// A dedicated trusted photo is still allowed for its exact partner service.
// Generated assets are available only to the reviewed owning entity. New text,
// a misleading fallback or a failed image cannot borrow another entity's photo.
export function publicServiceThumbnail(service,{business,locale='bg',trustedServiceImage,unavailableSources=[]}={}) {
  const identity=discoveryServicePhotoIdentity(service,business)
  const reviewed=reviewedPartnerServicePhoto(service,business)
  const partnerIdentity=reviewed && partnerServicePhotoIdentity(service,business)
  const unavailable=new Set(Array.isArray(unavailableSources)?unavailableSources:[])
  const absent={type:'unavailable',photoMatch:'none',src:null,srcSet:null}
  for (let i=0; i<6; i++) {
    const photo=serviceThumbnail(service,{business,locale,trustedServiceImage,unavailableSources:[...unavailable]})
    if (!photo.src || photo.photoMatch==='neutral' || unavailable.has(photo.src)) return {...absent,kind:photo.kind,icon:photo.icon}
    // The legacy resolver validates (rights, tenant, service ID and source)
    // of real media. No uploaded business/gallery images are rewritten.
    if (photo.source==='provided' || (!photo.source && photo.photoMatch==='exact')) return photo
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
  return { category:selection.category,size:selection.size,
    src:own(path)?selection.src:null,
    ...(own(fallback)?{fallbackSrc:selection.fallbackSrc}:{}),
    ...(own(path)&&selection.activityPhotoKey?{activityPhotoKey:selection.activityPhotoKey}:{}),
  }
}
