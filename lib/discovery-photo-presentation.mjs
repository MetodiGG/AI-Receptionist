import assignments from './discovery-photo-ownership.json' with { type:'json' }
import { serviceThumbnail } from './service-thumbnail.mjs'
import { reviewedPartnerServicePhoto } from './partner-service-photos.mjs'
import { discoveryServicePhotoIdentity, partnerServicePhotoIdentity, staticDiscoveryPhotoPath } from './discovery-photo-identity.mjs'
import { catalogueBranchIllustration } from './public-business-cover-photo.mjs'

export { publicBusinessCoverPhoto, businessCoverPhotoSources, matchesBusinessCoverPhoto } from './public-business-cover-photo.mjs'

// A dedicated trusted photo is still allowed for its exact partner service.
// Generated assets are available only to the reviewed owning entity. New text,
// a misleading fallback or a failed image cannot borrow another entity's photo.
export function publicServiceThumbnail(service,{business,locale='bg',trustedServiceImage,unavailableSources=[]}={}) {
  const identity=discoveryServicePhotoIdentity(service,business)
  const reviewed=reviewedPartnerServicePhoto(service,business)
  const partnerIdentity=reviewed && partnerServicePhotoIdentity(service,business)
  const unavailable=new Set(Array.isArray(unavailableSources)?unavailableSources:[])
  const absent={type:'unavailable',photoMatch:'none',src:null,srcSet:null}
  const bespoke=catalogueBranchIllustration(business)
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
