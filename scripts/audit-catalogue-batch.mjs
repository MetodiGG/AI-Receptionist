import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueCoverage, auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'

// Read-only local report. No external requests, source writes, automatic
// import, Supabase access, deployments, Google keys or paid services.
const { values } = parseArgs({ options: { input: { type: 'string' } } })
const report = { coverage: catalogueCoverage(SOFIA_CATALOGUE) }
if (values.input) report.batch = auditCatalogueBatch(SOFIA_CATALOGUE, JSON.parse(await readFile(values.input, 'utf8')))
console.log(JSON.stringify(report, null, 2))
if (report.batch?.rejected.length) process.exitCode = 1
