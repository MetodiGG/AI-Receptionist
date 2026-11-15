import { transliterate } from '../business-location.mjs'

// A shared deterministic key for public search and suggestions. No user text
// is retained, sent to a provider, or used as a database expression.
export function normalizedSearchKey(value = '') {
  return transliterate(String(value ?? '').normalize('NFKC')).normalize('NFKD')
    .replace(/\p{M}/gu, '').toLocaleLowerCase('bg')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/gu, ' ').trim()
}

export function oneSearchEditApart(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++edits > 1) return false
    if (a.length >= b.length) i++
    if (b.length >= a.length) j++
  }
  return edits + Number(i < a.length || j < b.length) <= 1
}

const insignificant = new Set(['na', 'za', 'v', 'vav', 's', 'sas', 'i', 'the', 'a', 'an', 'of', 'for', 'in', 'and'])
function wordForms(word) {
  const result = [word]
  // Conservative Bulgarian articles/plurals after transliteration; short
  // roots are not broadened. Domain synonyms stay in the reviewed lexicon.
  if (word.length >= 6) {
    const root = word.replace(/(?:ovete|evete|ite|ata|yata|ove|eva|ta|te|at|yat|i)$/u, '')
    if (root.length >= 4 && root !== word) result.push(root)
  }
  return result
}

// Higher tiers are deliberately explainable: exact > alias > all-token
// prefix/morphology > conservative typo. All meaningful query tokens must
// have evidence; one coincidental word cannot satisfy a longer request.
export function searchTextEvidence(actual, query, { aliases = [], fuzzy = true } = {}) {
  const value = normalizedSearchKey(actual), key = normalizedSearchKey(query)
  if (key.length < 2 || !value) return null
  if (value === key) return { tier: 4, score: 100, kind: 'exact' }
  if (aliases.some(alias => normalizedSearchKey(alias) === key)) return { tier: 3, score: 85, kind: 'alias' }
  const requested = key.split(' ').filter(word => !insignificant.has(word))
  if (!requested.length || requested.length > 24) return null
  const words = value.split(' '), tokens = [...new Set(requested)]
  let typos = 0, prefixes = 0
  for (const token of tokens) {
    if (words.includes(token)) continue
    if (words.some(word => word.startsWith(token) || wordForms(word).some(form => wordForms(token).includes(form)))) { prefixes++; continue }
    if (fuzzy && token.length >= 4 && words.some(word => word.length >= 4 && oneSearchEditApart(word, token))) { typos++; continue }
    return null
  }
  if (typos > 1 || typos && tokens.length > 1 && typos === tokens.length) return null
  if (typos) return { tier: 1, score: Math.max(30, 55 - prefixes), kind: 'typo' }
  return { tier: 2, score: Math.max(60, 78 - prefixes), kind: prefixes ? 'prefix' : 'words' }
}
