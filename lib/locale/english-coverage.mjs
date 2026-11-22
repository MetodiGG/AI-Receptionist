// Offline editorial check, not a translation engine or source-data mutation.
const cyrillic = /[а-яѝ]/iu
const ownText = (map, key) => Object.hasOwn(map || {}, key) && typeof map[key] === 'string' ? map[key] : ''
const quantities = value => (value.normalize('NFKC').match(/\d+(?:[.,]\d+)?/gu) || [])
  .map(item => String(Number(item.replace(',', '.')))).sort()
const sameQuantities = (source, target) => JSON.stringify(quantities(source)) === JSON.stringify(quantities(target))

const qualificationMarkers = [
  ['only', /(?:^|[^\p{L}])само(?=$|[^\p{L}])/iu, /\bonly\b|solely|exclusiv|\bjust\b/iu],
  ['total', /(?:^|[^\p{L}])(?:обща|общо|общата|цели[яй]|цялата)(?=$|[^\p{L}])/iu, /total|entire|whole|full|complete|overall|throughout|general/iu],
  ['confirmation', /потвър/iu, /confirm/iu],
  ['exclusion', /(?:^|[^\p{L}])не (?:е включен|са включени|включва)/iu, /not|n.t|exclud|without|\bno\b/iu],
  ['separate', /отделн/iu, /separat|extra|additional|not includ|individual/iu],
  ['indicative', /ориентиров/iu, /indicativ|estimat|approx|guide|rough|tentativ/iu],
  ['advance arrangement', /предварител/iu, /advan|prior|pre-|preliminary|before|appointment|prebook|prearrang|prepay|previously/iu],
  ['VAT', /ДДС/u, /VAT|value.added/iu],
  ['negation', /(?:^|[^\p{L}])(?:не|без)(?=$|[^\p{L}])/iu, /\bnot\b|n.t\b|\bno\b|without|exclud|non-|free of|free from|at least/iu],
]

export function englishQualificationIssues(source, target) {
  return qualificationMarkers.filter(([, bg, en]) => bg.test(source) && !en.test(target)).map(([label]) => label)
}

export function auditEnglishInventory(inventory, dictionary) {
  const missing = [], invalid = [], quantityChanges = [], qualificationChanges = [], totals = {}
  for (const field of ['names', 'descriptions', 'units']) {
    const entries = inventory?.entries?.[field] || []
    let reviewed = 0
    for (const entry of entries) {
      if (!cyrillic.test(entry.text)) continue
      const base = ownText(dictionary?.[field], entry.text)
      const contexts = field === 'names' ? entry.categories?.length ? entry.categories : [''] : ['']
      for (const category of contexts) {
        const target = field === 'names' ? ownText(dictionary?.contextual?.[category], entry.text) || base : base
        const ref = { field, source: entry.text, ...(category ? { category } : {}) }
        if (!target.trim()) missing.push(ref)
        else {
          if (cyrillic.test(target) || /English translation pending|⁇|�|<unk>/iu.test(target)) invalid.push({ ...ref, target })
          if (!sameQuantities(entry.text, target)) quantityChanges.push({ ...ref, target, sourceQuantities: quantities(entry.text), targetQuantities: quantities(target) })
          if (field === 'descriptions') {
            const issues = englishQualificationIssues(entry.text, target)
            if (issues.length) qualificationChanges.push({ ...ref, target, issues })
          }
        }
      }
      reviewed++
    }
    totals[field] = { unique: entries.length, requiringEnglish: reviewed }
  }
  return { complete: missing.length === 0 && invalid.length === 0 && quantityChanges.length === 0 && qualificationChanges.length === 0,
    totals, missing, invalid, quantityChanges, qualificationChanges,
    limitation: 'Coverage and literal quantities do not establish semantic translation quality. Domain, negation, exclusions and pricing qualifications still require editorial review.' }
}
