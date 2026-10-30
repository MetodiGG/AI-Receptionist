import { mediaUrl, publicMedia } from './business-media.mjs'

// Curated photos supplied by the business/operator. Match the stable business
// ID, never a display name or a user-chosen slug, so photos cannot move tenants.
const PHOTOS = {
  '450c5c2f-db41-476b-a21e-98cf5ee29194': [
    {
      src: '/businesses/vesi-studio/interior-20261026.webp', width: 1200, height: 1600,
      position: '50% 68%',
      alt: { bg: 'Интериорът на ВЕСИ СТУДИО с места за маникюр, педикюр и изчакване', en: 'VESI STUDIO interior with manicure, pedicure and waiting areas' },
      caption: { bg: 'В студиото', en: 'Inside the studio' },
    },
    {
      src: '/businesses/vesi-studio/entrance-20261026.webp', width: 1200, height: 1600,
      position: '50% 56%',
      alt: { bg: 'Стъклената витрина и входът на ВЕСИ СТУДИО', en: 'The glass storefront and entrance to VESI STUDIO' },
      caption: { bg: 'Входът', en: 'The entrance' },
    },
  ],
}

const copyPhoto = photo => ({ ...photo, alt: { ...photo.alt }, caption: { ...photo.caption } })

export function getCuratedBusinessPhoto(businessId, source) {
  const photo = Object.hasOwn(PHOTOS, businessId) ? PHOTOS[businessId].find(item => item.src === source) : null
  return photo ? copyPhoto(photo) : null
}

export function getBusinessPhotos(business) {
  if (business?.media_gallery_managed) {
    const rows = (business.media || []).filter(row => !row.curated_src || getCuratedBusinessPhoto(business.id, row.curated_src))
    const byUrl = new Map(rows.map(row => [mediaUrl(row.id), row]))
    return publicMedia(rows).map(photo => {
      const row = byUrl.get(photo.src), curated = getCuratedBusinessPhoto(business.id, row?.curated_src)
      return curated ? { ...curated, src: photo.src, ...(row.alt_text ? { alt: photo.alt } : {}) } : photo
    })
  }
  const photos = Object.hasOwn(PHOTOS, business?.id) ? PHOTOS[business.id] : []
  return photos.map(copyPhoto)
}

export function getStaffPhoto(business, staffId) { return publicMedia(business?.media, staffId)[0] || null }

export function nextPhotoIndex(current, direction, count) {
  return count > 0 ? ((current + direction) % count + count) % count : 0
}

export function photoSwipeDirection(start, end) {
  if (!start || !end) return 0
  const dx = end.x - start.x, dy = end.y - start.y
  return Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5 ? (dx < 0 ? 1 : -1) : 0
}
