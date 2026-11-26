import assignments from './discovery-photo-ownership.json' with { type:'json' }
import { businessCoverPhoto } from './business-cover-photo.mjs'
import { serviceThumbnail } from './service-thumbnail.mjs'
import { reviewedPartnerServicePhoto } from './partner-service-photos.mjs'
import { catalogueIdPattern, isCataloguePhotoSource } from './catalogue-photo-view.mjs'
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

// A real gallery stays first, in the caller. A published catalogue business
// may use reviewed local activity artwork as its explicitly labelled cover.
// Related businesses may share that illustrative scene when they provide the
// pictured activity. This does not transfer its ownership to any other
// category, subcategory or service thumbnail. Bare category fallbacks and
// unknown service text are not evidence of a specific pictured activity.
export function publicBusinessCoverPhoto(business,{unavailableSources=[]}={}) {
  const selection=businessCoverPhoto(business,{unavailableSources})
  const path=staticDiscoveryPhotoPath(selection.src), fallback=staticDiscoveryPhotoPath(selection.fallbackSrc)
  const own=source=>source && Object.hasOwn(assignments.coverOwners,source) && assignments.coverOwners[source]===business?.id
  const bespoke=branchArt(business)
  if (bespoke) {
    return {category:selection.category,src:unavailableSources.includes(bespoke.cover)?null:bespoke.cover,size:720,height:540}
  }
  const reviewedActivity = Boolean(path && selection.activityPhotoKey && business?.source === 'catalogue' && catalogueIdPattern.test(business.id || ''))
  return { category:selection.category,size:selection.size,
    src:own(path)||reviewedActivity?selection.src:null,
    ...(fallback && (own(fallback)||reviewedActivity)?{fallbackSrc:selection.fallbackSrc}:{}),
    ...((own(path)||reviewedActivity)&&selection.activityPhotoKey?{activityPhotoKey:selection.activityPhotoKey}:{}),
    ...(reviewedActivity && !own(path)?{representativeActivity:true}:{}),
  }
}

// The detail menu suppresses the active hero image and its small derivative,
// so a relevant service visual never just prints the business cover again.
export function businessCoverPhotoSources(business) {
  const actual = business?.source === 'catalogue' && isCataloguePhotoSource(business.photo?.src)
    ? business.photo.src : business?.photos?.[0]?.src
  if (typeof actual === 'string' && actual) return [actual]
  const { src, fallbackSrc } = publicBusinessCoverPhoto(business)
  return [src, fallbackSrc].filter(Boolean)
}

export function matchesBusinessCoverPhoto(source, coverSources) {
  if (typeof source !== 'string' || !source || !coverSources?.length) return false
  const canonical = staticDiscoveryPhotoPath(source)
  return coverSources.some(cover => cover === source || Boolean(canonical && canonical === staticDiscoveryPhotoPath(cover)))
}
