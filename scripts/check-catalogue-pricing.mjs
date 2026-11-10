import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { auditCataloguePricing } from '../lib/discovery/catalogue-pricing-review.mjs'

// Offline only. The optional output is a local work queue, not a publisher.
const { values } = parseArgs({ options: { output: { type: 'string' } } })
const baseline = JSON.parse(await readFile(new URL('../lib/discovery/catalogue-data/pricing-review-baseline-20261110.json', import.meta.url), 'utf8'))
const report = auditCataloguePricing(SOFIA_CATALOGUE, baseline, BOOKING_PRICE_REVIEWS)
if (values.output) await writeFile(values.output, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ ...report.summary, blockedNewOrChangedListings: report.blocking, notice: report.notice }, null, 2))
if (report.blocking.length) process.exitCode = 1
