import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { PUBLIC_CATALOGUE, PUBLIC_CATALOGUE_PRICE_REVIEWS } from '../lib/discovery/public-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { auditCataloguePricing } from '../lib/discovery/catalogue-pricing-review.mjs'
import { classifyExpiredCatalogueOffers } from '../lib/discovery/catalogue-expired-offer-holds.mjs'

// Offline only. The optional output is a local work queue, not a publisher.
const { values } = parseArgs({ options: { output: { type: 'string' } } })
const baseline = JSON.parse(await readFile(new URL('../lib/discovery/catalogue-data/pricing-review-baseline-20261110.json', import.meta.url), 'utf8'))
const reviews = [...BOOKING_PRICE_REVIEWS, ...PUBLIC_CATALOGUE_PRICE_REVIEWS]
const now = Date.now()
const report = classifyExpiredCatalogueOffers(auditCataloguePricing(PUBLIC_CATALOGUE, baseline, reviews, now), PUBLIC_CATALOGUE, reviews, now)
if (values.output) await writeFile(values.output, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ ...report.summary, archivedExpiredOffers: report.withheldExpiredOffers, blockedNewOrChangedListings: report.blocking, notice: report.notice }, null, 2))
if (report.blocking.length) process.exitCode = 1
