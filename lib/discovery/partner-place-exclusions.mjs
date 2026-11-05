import { verifiedPartnerPlaceLink } from './partner-ratings.mjs'

// Exclude ALL exact, reviewed links to currently public partners, not just
// partners that happened to fit this query's service or the first six cards.
// A chain name, address similarity or a private/draft account is not a match.
export function publicPartnerPlaceExclusions(rows = [], requestedIds = [], now = Date.now()) {
  const requested = new Set(requestedIds), excluded = new Set()
  for (const row of rows) {
    const business = row.business
    if (!business || business.id !== row.business_id || business.active !== true || business.platform_status !== 'enabled') continue
    const id = verifiedPartnerPlaceLink(row, business.id)
    if (id && Date.parse(row.verified_at) <= now && requested.has(id)) excluded.add(id)
  }
  return excluded
}
