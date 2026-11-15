// A purpose-specific preference, never a person/session identifier. Previous
// click/flow consent does not silently grant the newly added search purpose.
const CONSENT_KEY = 'gorez-search-measurement-v1'
export function searchAnalyticsConsent() {
  try { return localStorage.getItem(CONSENT_KEY) === 'yes' } catch { return false }
}
export function setSearchAnalyticsConsent(allowed) {
  try { localStorage.setItem(CONSENT_KEY, allowed ? 'yes' : 'no') } catch { /* Optional measurement stays off. */ }
}
