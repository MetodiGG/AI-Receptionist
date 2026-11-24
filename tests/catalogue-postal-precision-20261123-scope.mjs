import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import quickfit from '../docs/catalogue-coverage/quickfit-verified-location-20261123.json' with { type: 'json' }
import agron from '../docs/catalogue-coverage/agron-verified-location-20261123.json' with { type: 'json' }
import risuvam from '../docs/catalogue-coverage/risuvam-verified-location-20261123.json' with { type: 'json' }
import { lowCoverageAllowsFileChange, lowCoverageAllowsNewFile, lowCoveragePriorCatalogue, lowCoveragePriorSource } from './catalogue-low-coverage-20261123-scope.mjs'

// Invert only the location-only delta for earlier test cohorts; runtime never
// uses this to select a point or to approve new or altered source files.
const root = fileURLToPath(new URL('../', import.meta.url))
const base = quickfit.baseline
const cataloguePath = 'lib/discovery/sofia-catalogue.mjs'
const sourceBaseline = 'f1941c7492438d23c31c4aea67144a7617618c72cf9b156ab41ca6aec9b6a980'
const sourceAfter = '6d1e5c95939af8408a81a3f8cccd9cf5cd5b431225db58dc44d55fab95197303'
const newFiles = {
  'docs/catalogue-coverage/postal-precision-20261123.json': '96e3fffc215a35a2777a668e74410ca019978a77b52afa3a80560f82ef18ab28',
  'docs/catalogue-coverage/quickfit-verified-location-20261123.json': '42fe07cfad3d492ff2b060d440892d1cbe871aa18db15f99b61b43f8892912c3',
  'docs/catalogue-coverage/agron-verified-location-20261123.json': 'b491dca89eafe6359a2858c0250c9e8f1807041d6f11be0a48c40e808c358d65',
  'docs/catalogue-coverage/risuvam-verified-location-20261123.json': 'cea6780c39947bd8c16a56e8fb67d3d080e7fc1fd07ee0db4dbacf30b7cb8c19',
  'lib/discovery/catalogue-data/quickfit-verified-location-20261123.mjs': '2770596b816c0730f0668ff4d0a98eafc0d55b3e424f9cc99215d5e4c37bffb4',
  'lib/discovery/catalogue-data/agron-verified-location-20261123.mjs': 'ad26ac7314f1becc3286f37e2677a9d445f7555bfc289bf9878f1a9954abff90',
  'lib/discovery/catalogue-data/risuvam-verified-location-20261123.mjs': '9e0f5b1a1bead3cfeb4b662322f644cd77765e02d2cebce8207f56d2bdc0055b',
}
const located = new Map([
  [quickfit.id, [quickfit.previousRowSha256, quickfit.reviewedRowSha256]],
  [agron.id, agron.normalizedRecordSha256],
  [risuvam.business.id, [risuvam.identities.normalizedPriorRowSha256, risuvam.identities.normalizedAfterRowSha256]],
])
const digest = value => createHash('sha256').update(value).digest('hex')
function matchesFile(path, sha) {
  if (!sha) return false
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === sha } catch { return false }
}

export const postalPrecisionAllowsFileChange = path => lowCoverageAllowsFileChange(path) || path === cataloguePath && matchesFile(path, sourceAfter)
export const postalPrecisionAllowsNewFile = path => lowCoverageAllowsNewFile(path) || Object.hasOwn(newFiles, path) && matchesFile(path, newFiles[path])

let earlier
export function postalPrecisionPriorSource(path, source) {
  source = lowCoveragePriorSource(path, source)
  if (path !== cataloguePath || !source.includes('applyReviewedQuickFitLocation20261123')) return source
  if (digest(source) !== sourceAfter) throw Error('Unreviewed 23 Nov postal-precision source delta: ' + path)
  if (earlier === undefined) {
    const prior = execFileSync('git', ['show', base + ':' + path], { cwd: root, encoding: 'utf8' })
    if (digest(prior) !== sourceBaseline) throw Error('Postal-precision replay did not restore every source byte')
    earlier = prior
  }
  return earlier
}

export function postalPrecisionPriorCatalogue(rows) {
  const seen = new Set()
  return lowCoveragePriorCatalogue(rows).map(row => {
    const exact = located.get(row.id)
    if (!exact) return row
    if (seen.has(row.id)) throw Error('Duplicate 23 Nov postal-precision listing: ' + row.id)
    seen.add(row.id)
    const [before, after] = exact
    const sha = digest(JSON.stringify(row))
    if (sha === before) return row
    if (sha !== after) throw Error('Unreviewed 23 Nov postal-precision listing: ' + row.id)
    const prior = { ...row, coordinates: null }
    if (digest(JSON.stringify(prior)) !== before) throw Error('Postal-precision replay changed more than the point: ' + row.id)
    return prior
  })
}
