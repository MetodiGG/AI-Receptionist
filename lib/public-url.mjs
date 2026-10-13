export function resolvePublicOrigin(configuredOrigin, requestOrigin = '') {
  const candidates = [configuredOrigin, requestOrigin]

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue

    try {
      const url = new URL(candidate.trim())
      if (url.protocol === 'http:' || url.protocol === 'https:') return url.origin
    } catch {
      // Ignore invalid configuration and continue with the runtime origin.
    }
  }

  return ''
}

export function buildPublicBookingUrl(origin, slug) {
  const normalizedOrigin = resolvePublicOrigin(origin)
  if (!normalizedOrigin) return `/book/${encodeURIComponent(slug)}`
  return `${normalizedOrigin}/book/${encodeURIComponent(slug)}`
}

