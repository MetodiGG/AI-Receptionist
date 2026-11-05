// Global PAYG list checked 2026-11-05. USD; shared billing-account/SKU caps,
// not per visitor/project. No assumption that the free allowance is unused.
// https://developers.google.com/maps/billing-and-pricing/pricing
export const GOOGLE_CARD_PRICING_CHECKED = '2026-11-05'
const tiers = {
  uiKitPro: [[5000, 0], [100000, 5000], [500000, 4000], [1000000, 3000], [5000000, 1500], [Infinity, 380]],
  nearbyPro: [[5000, 0], [100000, 32000], [500000, 25600], [1000000, 19200], [5000000, 9600], [Infinity, 2400]],
  textPro: [[5000, 0], [100000, 32000], [500000, 25600], [1000000, 19200], [5000000, 9600], [Infinity, 2400]],
}
const count = value => { if (!Number.isSafeInteger(value) || value < 0 || value > 10000000) throw new Error('INVALID_USAGE_COUNT'); return value }
function accumulatedCost(sku, events) {
  let total = 0, start = 0
  for (const [end, cost] of tiers[sku]) { total += Math.max(0, Math.min(events, end) - start) * cost; start = end; if (events <= end) break }
  return total
}
export function estimateGoogleCardCosts({ visibleCards = 0, contactOpens = 0, nearbySearches = 0, textProSearches = 0, idsOnlySearches = 0, prior = {} } = {}) {
  const events = { uiKitPro: count(visibleCards) + count(contactOpens), nearbyPro: count(nearbySearches), textPro: count(textProSearches) }
  const sku = Object.fromEntries(Object.entries(events).map(([name, value]) => {
    const existing = count(prior[name] ?? 0)
    return [name, { events: value, priorEvents: existing, remainingFreeBefore: Math.max(0, 5000 - existing), usd: (accumulatedCost(name, existing + value) - accumulatedCost(name, existing)) / 1000000 }]
  }))
  return { currency: 'USD', checkedAt: GOOGLE_CARD_PRICING_CHECKED, sku, idsOnlySearches: count(idsOnlySearches), totalUsd: Object.values(sku).reduce((sum, value) => sum + value.usd, 0), providerReservations: Object.values(events).reduce((sum, value) => sum + value, 0) + idsOnlySearches }
}
