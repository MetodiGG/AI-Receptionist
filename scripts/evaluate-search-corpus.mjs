// Offline observation only. No env/credentials, fetch, database or billable calls.
// The supplied prose scenarios are NOT an independently labelled relevance set.
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { performance } from 'node:perf_hooks'
import { DateTime } from 'luxon'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { discoverySearchInput } from '../lib/discovery/search-ui.mjs'
import { googleSearchRequest } from '../lib/discovery/google-places.mjs'
import { DISCOVERY_CATEGORIES } from '../lib/discovery/categories.mjs'

const [corpusPath, outputStem] = process.argv.slice(2)
if (!corpusPath || !outputStem) throw new Error('Usage: node scripts/evaluate-search-corpus.mjs <corpus.json> <output-stem>')
const corpus = JSON.parse(await readFile(resolve(corpusPath), 'utf8'))
const labels = JSON.parse(await readFile(new URL('../tests/fixtures/search-quality-category-labels.json', import.meta.url), 'utf8'))
if (corpus.cases?.length !== 172 || new Set(corpus.cases.map(row => row.id)).size !== 172) throw new Error('Expected 172 distinct definitions')
if (labels.categoriesByCaseOrder.length !== 172) throw new Error('Expected 172 manually reviewed labels')
const now = DateTime.fromISO('2026-10-30T12:00:00', { zone: 'Europe/Sofia' })
const rows = corpus.cases.map((definition, index) => {
  const started = performance.now()
  let intent = null, request = null, providerPlan = null, error = null
  try {
    request = discoveryRequestSchema.parse(discoverySearchInput({ query: definition.query }))
    intent = parseIntent(request, now, { v2: process.argv.includes('--v2') })
    if (!intent.clarification) providerPlan = googleSearchRequest(intent)
  } catch (failure) { error = failure.name }
  return {
    id: definition.id, query: definition.query, scenario: definition.scenario, expected: definition.expected_behavior,
    evidence: 'offline rules parser + request plan; not live or mocked provider results',
    expectedCategory: labels.categoriesByCaseOrder[index],
    categoryVerdict: (intent?.category || null) === labels.categoriesByCaseOrder[index] ? 'PASS' : 'FAIL',
    input: request, parsedIntent: intent, plannedProviderMethod: providerPlan?.method || null,
    plannedProviderQuery: providerPlan?.body.textQuery || null,
    effectiveRadiusKm: intent?.coordinates ? intent.radiusKm : null,
    radiusMeaning: intent?.coordinates ? 'strict consented-coordinate radius' : 'city/neighborhood text search, not a 2 km city circle',
    internalCandidates: null, googleCandidates: null, removedByFilter: null, finalRelevantResults: null,
    expectedServiceVerified: null, locationConstraintVerified: null, appointmentConstraintVerified: null,
    parserLatencyMs: Math.round((performance.now() - started) * 1000) / 1000,
    actualProviderRequests: 0, actualProviderCost: 0, error,
    outcome: error ? 'FAIL' : 'BLOCKED',
    reason: error ? 'Parser execution error' : 'Full scenario needs labelled fixtures/live retrieval/UI verification; parsing alone does not establish relevance.',
  }
})
const latencies = rows.map(row => row.parserLatencyMs).sort((a, b) => a - b)
const report = {
  fixedTestClock: now.toISO(), categorySource: 'lib/discovery/categories.mjs', categories: DISCOVERY_CATEGORIES.map(({ id, bg }) => ({ id, bg })),
  totalDefinitions: rows.length, parserErrors: rows.filter(row => row.error).length,
  categoryRecognized: rows.filter(row => row.parsedIntent?.category).length,
  categoryMatchesManualLabels: rows.filter(row => row.categoryVerdict === 'PASS').length,
  labelReview: labels.evidence,
  clarificationRequested: rows.filter(row => row.parsedIntent?.clarification).length,
  parserLatencyP50Ms: latencies[Math.floor(rows.length * .5)], parserLatencyP95Ms: latencies[Math.floor(rows.length * .95)],
  liveProviderRequests: 0, endToEndPasses: 0, precisionAt5: null, correctIntentRate: null,
  limitation: 'This is a PARTIAL offline evaluation, not completion of the attached Search Engine 2.0 audit. Category labels have one reviewer only; independent candidate judgments are pending. No claims of live Google quality, availability or end-to-end latency.',
  rows,
}
const safeCell = value => String(value ?? '—').replaceAll('|', '\\|').replaceAll('\n', ' ')
const markdown = `# Search quality — offline observations\n\n${report.limitation}\n\nFixed clock: ${report.fixedTestClock}. No network, database, bookings, email or paid API activity.\n\n- Definitions executed through the actual rules parser: ${rows.length}.\n- Parser errors: ${report.parserErrors}.\n- Category recognized: ${report.categoryRecognized}/${rows.length} (NOT a correctness rate).\n- Clarification requested: ${report.clarificationRequested}.\n- Parser p50/p95: ${report.parserLatencyP50Ms}/${report.parserLatencyP95Ms} ms, not end-to-end latency.\n- Precision@5, relevance, provider counts and actual availability: **unmeasured**, not zero.\n- Near-me scenarios have no geolocation consent in this offline run; city fallback observations are not successful geolocation tests.\n- Taxonomy currently has Therapies/physiotherapy, not medical-specialty categories. Neurologists, dentists, vets, restaurants and other conditional cases require taxonomy review, not invented automatic classifications.\n\n| ID | Query | Category | Neighborhood | Clarification | E2E status |\n| --- | --- | --- | --- | --- | --- |\n${rows.map(row => `| ${[row.id, row.query, row.parsedIntent?.category, row.parsedIntent?.neighborhood, row.parsedIntent?.clarification?.field, row.outcome].map(safeCell).join(' | ')} |`).join('\n')}\n`
await mkdir(dirname(resolve(outputStem)), { recursive: true })
await writeFile(`${outputStem}.json`, JSON.stringify(report, null, 2) + '\n')
await writeFile(`${outputStem}.md`, markdown)
console.info(JSON.stringify({ definitions: rows.length, parserErrors: report.parserErrors, categoryRecognized: report.categoryRecognized, clarificationRequested: report.clarificationRequested, liveProviderRequests: 0, report: `${outputStem}.json` }))
