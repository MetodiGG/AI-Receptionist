import { readFile, writeFile } from 'node:fs/promises'
const read = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url)))
const before = await read('docs/search-quality-before.json'), after = await read('docs/search-quality-after.json')
const labels = await read('tests/fixtures/search-quality-category-labels.json')
if (before.rows.length !== 172 || after.rows.length !== 172) throw new Error('Missing corpus observations')
const rows = before.rows.map((row, index) => {
  const next = after.rows[index]
  if (row.id !== next.id || row.query !== next.query) throw new Error('Corpus changed')
  const expected = labels.categoriesByCaseOrder[index]
  return { id: row.id, query: row.query, expectedCategory: expected,
    beforeCategory: row.parsedIntent?.category || null, afterCategory: next.parsedIntent?.category || null,
    beforeCategoryMatch: (row.parsedIntent?.category || null) === expected, afterCategoryMatch: (next.parsedIntent?.category || null) === expected,
    beforeClarification: row.parsedIntent?.clarification?.field || null, afterClarification: next.parsedIntent?.clarification?.field || null,
    parserLatencyDeltaMs: Math.round((next.parserLatencyMs - row.parserLatencyMs) * 1000) / 1000,
    liveApiCallsBefore: 0, liveApiCallsAfter: 0, relevanceImprovement: null,
    fullScenarioOutcome: 'BLOCKED', remaining: 'Live retrieval/candidate relevance and full scenario verification still required.' }
})
const summary = { beforeCategoryMatches: rows.filter(row => row.beforeCategoryMatch).length, afterCategoryMatches: rows.filter(row => row.afterCategoryMatch).length, total: rows.length, caveat: labels.evidence, rows }
await writeFile(new URL('../docs/search-quality-comparison.json', import.meta.url), JSON.stringify(summary, null, 2) + '\n')
await writeFile(new URL('../docs/search-quality-comparison.md', import.meta.url), `# Search quality: before/after\n\n**Category/selected-intent checks only; not 172 complete end-to-end passes.**\n\nManual category-label agreement: ${summary.beforeCategoryMatches}/172 → ${summary.afterCategoryMatches}/172.\n\n${labels.evidence}\n\nNo live Google/AI requests were made. Precision@5, real relevance, wrong-location rate, real appointment correctness and live p95 remain unmeasured. The older baseline file was captured before backend changes and is preserved.\n\n| ID | Before category | After category | Before clarification | After clarification | Full scenario |\n| --- | --- | --- | --- | --- | --- |\n${rows.map(row => `| ${row.id} | ${row.beforeCategory || '—'} | ${row.afterCategory || '—'} | ${row.beforeClarification || '—'} | ${row.afterClarification || '—'} | BLOCKED: live/fixture scenario review pending |`).join('\n')}\n`)
console.info(JSON.stringify({ beforeCategoryMatches: summary.beforeCategoryMatches, afterCategoryMatches: summary.afterCategoryMatches, total: rows.length }))
