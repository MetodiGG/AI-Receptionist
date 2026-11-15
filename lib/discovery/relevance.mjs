import { searchTextEvidence } from './text-match.mjs'
import { createServiceEvidenceMatcher, isGenericSearchService } from './service-lexicon.mjs'

// Relevance is the primary ordering key, separate from the existing bounded
// local partner preference and real distance. No reviews/popularity invented.
export function createBusinessSearchRelevance(intent) {
  const query = intent.service, evidence = createServiceEvidenceMatcher(query)
  return row => {
    if (intent.businessNameQuery) {
      const name = searchTextEvidence(row.name, intent.businessNameQuery)
      if (name?.tier === 4) return { tier: 7, kind: 'exact_business' }
      if (name?.kind === 'typo') return { tier: 3, kind: 'business_typo' }
      return { tier: 6, kind: 'business_words' }
    }
    if (intent.browse === true || !intent.service || isGenericSearchService(intent.service, intent.category)) return { tier: 0, kind: 'category' }
    if (intent.addressQuery) return { tier: 1, kind: 'address' }
    let best = { tier: 0, kind: 'category' }
    for (const service of row.services || []) {
      const exact = searchTextEvidence(service.name, query)
      const candidate = exact?.tier === 4 ? { tier: 6, kind: 'exact_service' }
        : exact?.tier >= 2 ? { tier: 5, kind: 'service_words' }
          : evidence(service.name) ? { tier: 4, kind: 'service_synonym' }
            : exact?.kind === 'typo' ? { tier: 3, kind: 'service_typo' }
              : { tier: 2, kind: 'service_description' }
      if (candidate.tier > best.tier) best = candidate
    }
    return best
  }
}

export function businessSearchRelevance(row, intent) { return createBusinessSearchRelevance(intent)(row) }
