// An allowlist, rather than a private-route denylist, keeps future account URLs out.
const PUBLIC_PATHS = new Set(['/', '/search', '/partners', '/businesses', '/for-businesses', '/faq', '/privacy', '/terms', '/contact'])
const PUBLIC_HOSTS = new Set(['www.gorez.co', 'gorez.co'])
const PRIVATE_QUERY = /token|code|password|secret|email|phone|authorization|access_key/i

export function publicAnalyticsUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !PUBLIC_HOSTS.has(url.hostname) || url.port || url.username || url.password || url.hash) return null
    const path = url.pathname.replace(/\/$/, '') || '/'
    if (!PUBLIC_PATHS.has(path) && !/^\/book\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)) return null
    if ([...url.searchParams.keys()].some(key => PRIVATE_QUERY.test(key))) return null
    return `${url.origin}${path}`
  } catch {
    return null
  }
}

export function allowAnalyticsReferrer(value) {
  if (!value) return true
  try {
    const url = new URL(value)
    // The SDK also reads document.referrer. Do not send an event if it could carry
    // another site's personal path/query; normal origin-only referrers are safe.
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/'
  } catch {
    return false
  }
}

export function filterWebAnalyticsEvent(event, { currentUrl, referrer = '', doNotTrack, globalPrivacyControl = false } = {}) {
  if (event?.type !== 'pageview' || doNotTrack === '1' || doNotTrack === 'yes' || globalPrivacyControl) return null
  const current = publicAnalyticsUrl(currentUrl)
  const url = publicAnalyticsUrl(event.url)
  if (!current || !url || new URL(current).pathname !== new URL(url).pathname || !allowAnalyticsReferrer(referrer)) return null
  // Do not forward optional payloads, custom events, account identifiers or flags.
  return { type: 'pageview', url }
}
