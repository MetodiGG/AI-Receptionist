// Sharing artwork has its own revision so social caches refresh without
// invalidating the site's already-correct logo, favicon or PWA assets.
export const SOCIAL_PREVIEW_TITLE = 'Online Booking Made Easy'
export const SOCIAL_PREVIEW_VERSION = '20261110-1'
export const SOCIAL_PREVIEW_ARTWORK = '/brand/gorez-social-banner-v1.jpg'
export const SOCIAL_PREVIEW_SIZE = Object.freeze({ width: 1200, height: 630 })

export function socialPreviewImage(locale = 'bg', page = 'home') {
  const language = locale === 'en' ? 'en' : 'bg'
  const scope = page === 'business' ? 'business' : 'home'
  return {
    url: `/share-image?lang=${language}&page=${scope}&v=${SOCIAL_PREVIEW_VERSION}${scope === 'business' ? '&offer=free' : ''}`,
    ...SOCIAL_PREVIEW_SIZE, type: 'image/png', alt: `GoRez — ${SOCIAL_PREVIEW_TITLE}`,
  }
}
