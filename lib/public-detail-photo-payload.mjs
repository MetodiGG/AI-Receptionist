import { businessCoverPhotoSources, matchesBusinessCoverPhoto } from './public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from './service-detail-photo-presentation.mjs'
import { businessDetailServices } from './discovery/business-details.mjs'

// Server-side only. Keep the catalog-wide resolver out of the browser's
// dialog chunk; send only choices the same reviewed resolver allows today.
export function publicDetailPhotoPayload(business, services = businessDetailServices(business)) {
  const coverSources = businessCoverPhotoSources(business)
  const shared = { business, coverSources }
  return services.map(service => {
    const candidates = [], unavailableSources = []
    for (let attempt = 0; attempt < 3; attempt++) {
      const bg = publicDetailServiceThumbnail(service, { ...shared, unavailableSources })
      if (!bg.src || unavailableSources.includes(bg.src) || matchesBusinessCoverPhoto(bg.src, coverSources)) break
      const en = publicDetailServiceThumbnail(service, { ...shared, locale: 'en', unavailableSources })
      candidates.push({ src: bg.src, srcSet: bg.srcSet || null, type: bg.type, kind: bg.kind,
        photoMatch: bg.photoMatch, illustration: bg.source === 'illustrative', alt: { bg: bg.alt, en: en.src === bg.src ? en.alt : '' } })
      unavailableSources.push(bg.src)
    }
    return candidates
  })
}
