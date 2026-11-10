import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueCoverage, auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'

// Read-only local report. No external requests, source writes, automatic
// import, Supabase access, deployments, Google keys or paid services.
const { values } = parseArgs({ options: { input: { type: 'string' }, 'pricing-reviews': { type: 'string' } } })
const report = { coverage: catalogueCoverage(SOFIA_CATALOGUE) }
if (values.input) {
  const batch = JSON.parse(await readFile(values.input, 'utf8'))
  report.batch = auditCatalogueBatch(SOFIA_CATALOGUE, batch)
  const reviews = values['pricing-reviews'] ? JSON.parse(await readFile(values['pricing-reviews'], 'utf8')) : []
  if (!Array.isArray(reviews) || new Set(reviews.map(row => row.id)).size !== reviews.length) throw Error('Expected unique, dated pricing source reviews')
  const byId = new Map(reviews.map(row => [row.id, row]))
  report.batch.readyForReview = report.batch.readyForReview.filter(id => {
    const state = assessPricingReview(batch.find(row => row.id === id), byId.get(id))
    if (state.state === 'reviewed') return true
    report.batch.pending.push({ id, reason: state.reason })
    return false
  })
}
console.log(JSON.stringify(report, null, 2))
if (report.batch?.rejected.length || report.batch?.pending.length) process.exitCode = 1
