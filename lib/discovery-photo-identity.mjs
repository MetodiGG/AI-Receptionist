// No transliteration or fuzzy service equivalence: word changes, punctuation
// and category remain meaningful. The same exact name/category may share its
// representative photo between a card and profile, or between catalogue rows.
export function discoveryServicePhotoIdentity(service, business) {
  if (typeof service?.name !== 'string') return null
  const name = service.name.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('bg')
  if (!name) return null
  const category = service.category || business?.businessCategory || business?.category || business?.industry || 'other'
  return JSON.stringify([category, name])
}

export function partnerServicePhotoIdentity(service, business) {
  if (typeof service?.id !== 'string' || typeof business?.id !== 'string') return null
  return JSON.stringify(['partner', business.id, service.id])
}

export function staticDiscoveryPhotoPath(src) {
  if (typeof src !== 'string' || !src.startsWith('/') || src.startsWith('//') || src.includes('\\') || src.length > 2048) return null
  try {
    const plain = src.split(/[?#]/u, 1)[0]
    if (plain.includes('%') || plain.split('/').some(segment => segment === '.' || segment === '..')) return null
    const parsed = new URL(src, 'https://gorez.invalid')
    if (parsed.pathname === '/_next/image') {
      const original = parsed.searchParams.get('url')
      return original?.startsWith('/_next/') ? null : staticDiscoveryPhotoPath(original)
    }
    return /^\/(?:category-photos|category-art|service-photos|business-cover-photos|businesses)\/[a-z0-9/_-]+\.(?:webp|avif|png|jpe?g)$/iu.test(parsed.pathname)
      ? parsed.pathname : null
  } catch { return null }
}
