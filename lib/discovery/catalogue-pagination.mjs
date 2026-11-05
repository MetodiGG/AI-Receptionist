// A local catalogue page never carries a Google plan or switches providers.
// Keep old cards on a failed retry and deduplicate when curation changes
// between requests. A new query is guarded separately by the UI generation.
export function mergeCataloguePage(current, next) {
  if (!['catalogue', 'sofia_only'].includes(current?.externalStatus) || next?.externalStatus !== current.externalStatus ||
    current.external || current.furtherExternal || next.external || next.furtherExternal ||
    current.cataloguePage?.nextOffset == null || next.cataloguePage?.offset !== current.cataloguePage.nextOffset ||
    next.rankingVersion !== current.rankingVersion || JSON.stringify(next.intent) !== JSON.stringify(current.intent) ||
    !Array.isArray(next.results) || next.results.some(row => !['gorez', 'catalogue'].includes(row?.source) || !row.id) ||
    (next.cataloguePage.nextOffset !== null && (!Number.isSafeInteger(next.cataloguePage.nextOffset) || next.cataloguePage.nextOffset <= next.cataloguePage.offset))) {
    throw new Error('INVALID_CATALOGUE_PAGE')
  }
  const unique = new Map((current.results || []).map(row => [`${row.source}:${row.id}`, row]))
  for (const row of next.results) if (!unique.has(`${row.source}:${row.id}`)) unique.set(`${row.source}:${row.id}`, row)
  return { ...current, results: [...unique.values()], cataloguePage: next.cataloguePage }
}
