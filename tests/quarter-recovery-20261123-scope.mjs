import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { intakeAllowsFileChange, intakeAllowsNewFile, intakePriorSource, intakePriorCatalogue } from './catalogue-intake-20261123-scope.mjs'
import { autoAreaAllowsFileChange, autoAreaAllowsNewFile, autoAreaPriorSource, autoAreaPriorCatalogue } from './catalogue-auto-20261123-scope.mjs'

// Historical receipts may ignore only these two verified corrections, not other edits.
export const QUARTER_RECOVERY_BASE = '35a67bf61b7217f73339f39fc3c843a3ae15225e'
export const QUARTER_RECOVERY_SOURCE = 'lib/discovery/sofia-catalogue.mjs'
const oldSourceHash = 'b5400424942bc1e65b69cb2ba0847aeb522c847d2f951bb0eaba0b52c9768d8e'
const newSourceHash = '67282fdb678066b94c0e6c46b58fe7e42e38fa808186718ce1d40c8d97b0309f'
const reviewedNewFiles = Object.freeze({
  'lib/discovery/catalogue-data/neighborhood-recovery-20261123.mjs': '41b22a52acf2a509ce38d24f51b618f4cbca5b63b227e0c3056abb541557f623',
  'docs/catalogue-coverage/quarter-recovery-20261123.json': '3b867044edfbe28e3053b99c35b101bedaa97d82244509aa9e21ef13efd81958',
})
const pairs = Object.freeze({
  'sofia-e-dental-clinic': ['32457e7adf34325f9a18fc366c1916b61eb75ee11e82f865fb6d72857fb3aef0', 'f52b50646c0484c24b87c06d698e7beea26326e742a23759d2c09e9dc1163ab9'],
  'sofia-asd-autoservice-lihachov33': ['07367e8b291fc267e9cfffb13c48a3765c9af36361d3e07305402cbd3f232fee', '24f9d955db65a4f8005967d5401d8d9727b2a7977ec76bcbf0a5ea9fd83d2fe8'],
})
const digest = value => createHash('sha256').update(value).digest('hex')
const fileMatches = (path, expectation) => {
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === expectation } catch { return false }
}
export const quarterRecoveryAllowsFileChange = path => autoAreaAllowsFileChange(path) || intakeAllowsFileChange(path) || (path === QUARTER_RECOVERY_SOURCE && fileMatches(path, newSourceHash))
export const quarterRecoveryAllowsNewFile = path => autoAreaAllowsNewFile(path) || intakeAllowsNewFile(path) || (Object.hasOwn(reviewedNewFiles, path) && fileMatches(path, reviewedNewFiles[path]))

export function quarterRecoveryPriorSource(path, current) {
  const source = intakePriorSource(path, autoAreaPriorSource(path, current))
  if (path !== QUARTER_RECOVERY_SOURCE || digest(source) === oldSourceHash) return source
  if (digest(source) !== newSourceHash) throw Error('Unreviewed 23 Nov quarter recovery source delta: ' + path)
  const edits = [
    ["import { applyReviewedNeighborhoodRecovery20261123 } from './catalogue-data/neighborhood-recovery-20261123.mjs'\n", ''],
    ['export const RAW_SOFIA_CATALOGUE = validateCatalogue(applyReviewedNeighborhoodRecovery20261123(applyReviewedNearbyAddressPoints20261122(',
      'export const RAW_SOFIA_CATALOGUE = validateCatalogue(applyReviewedNearbyAddressPoints20261122('],
    ['), BOOKING_REVIEWED_PRICING, { includeReviewedDescriptions: true })))))))\n',
      '), BOOKING_REVIEWED_PRICING, { includeReviewedDescriptions: true }))))))\n'],
  ]
  let prior = source
  for (const [after, before] of edits) {
    if (prior.split(after).length !== 2) throw Error('Ambiguous 23 Nov quarter recovery source delta: ' + path)
    prior = prior.replace(after, () => before)
  }
  if (digest(prior) !== oldSourceHash) throw Error('Quarter recovery must restore every prior source byte: ' + path)
  return prior
}

export function quarterRecoveryPriorCatalogue(rows) {
  const seen = new Set()
  return intakePriorCatalogue(autoAreaPriorCatalogue(rows)).map(row => {
    if (!Object.hasOwn(pairs, row?.id)) return row
    if (seen.has(row.id)) throw Error('Duplicate quarter recovery record: ' + row.id)
    seen.add(row.id)
    const [oldHash, newHash] = pairs[row.id]
    const currentHash = digest(JSON.stringify(row))
    if (currentHash === oldHash) return row
    if (currentHash !== newHash) throw Error('Unreviewed 23 Nov quarter recovery record delta: ' + row.id)
    const prior = { ...row, neighborhood: null, coordinates: { ...row.coordinates, sourceNeighborhood: null } }
    if (digest(JSON.stringify(prior)) !== oldHash) throw Error('Quarter recovery must restore every prior record field: ' + row.id)
    return prior
  })
}
