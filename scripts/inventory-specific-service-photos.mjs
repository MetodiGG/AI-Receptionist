import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
const rows = []
for (const raw of SOFIA_CATALOGUE) {
  const business = approvedCatalogueRecord(raw, Date.parse('2026-11-12T00:00:00Z'))
  if (!business) continue
  for (const [index, service] of business.services.entries()) {
    const photo = serviceThumbnail(service, { business })
    if (photo.photoMatch !== 'neutral') continue
    rows.push({ businessId: business.id, businessName: business.name, businessCategory: business.category, website: business.website,
      index, name: service.name, category: service.category, description: service.description || '', appointmentModel: service.appointmentModel })
  }
}
console.log(JSON.stringify({ count: rows.length, categories: Object.fromEntries([...new Set(rows.map(r => r.category))].map(category => [category, rows.filter(r => r.category === category).length])), rows }, null, 2))
