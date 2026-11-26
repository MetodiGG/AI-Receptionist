import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/sofia-location-image-integrity-20261124-approval.json' with { type: 'json' }
import subcategoryReceipt from './fixtures/subcategory-photo-disclosure-20261126-approval.json' with { type: 'json' }
import { sofiaRpcAllowsFileChange, sofiaRpcAllowsNewFile, sofiaRpcMatchesPriorHash, sofiaRpcPriorSource } from './sofia-location-rpc-isolation-20261125-scope.mjs'
import { posterPolishKeepsEarlierAddedMenuFile } from './poster-polish-20261126-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = content => createHash('sha256').update(content).digest('hex')
const prior = new Map()
const priorSubcategoryDisclosure = new Map()

export function preSubcategoryDisclosureSource(path, source) {
  if (!Object.hasOwn(subcategoryReceipt.changed, path)) return source
  const { before, after } = subcategoryReceipt.changed[path]
  if (sha(source) !== after) return source
  if (!priorSubcategoryDisclosure.has(path)) {
    const original = execFileSync('git', ['show', subcategoryReceipt.baseline + ':' + path], { cwd: root })
    if (sha(original) !== before) throw Error('Subcategory disclosure baseline does not match pinned source: ' + path)
    priorSubcategoryDisclosure.set(path, original)
  }
  const original = priorSubcategoryDisclosure.get(path)
  return typeof source === 'string' ? original.toString('utf8') : Buffer.from(original)
}

export function subcategoryDisclosureAllowsFileChange(path) {
  if (!Object.hasOwn(subcategoryReceipt.changed, path)) return false
  try { return sha(readFileSync(new URL('../' + path, import.meta.url))) === subcategoryReceipt.changed[path].after }
  catch { return false }
}

function exactFile(path, map, pick) {
  if (!Object.hasOwn(map, path)) return false
  try {
    const current = readFileSync(new URL('../' + path, import.meta.url))
    return sha(sofiaRpcPriorSource(path, preSubcategoryDisclosureSource(path, current))) === pick(map[path])
  }
  catch { return false }
}
export const sofiaIntegrityAllowsFileChange = path => Object.hasOwn(receipt.changed, path)
  ? exactFile(path, receipt.changed, value => value.after) : sofiaRpcAllowsFileChange(path)
export const sofiaIntegrityAllowsNewFile = path => Object.hasOwn(receipt.added, path)
  ? exactFile(path, receipt.added, value => value) : sofiaRpcAllowsNewFile(path) || posterPolishKeepsEarlierAddedMenuFile(path)
export const sofiaIntegrityMatchesPriorHash = (path, hash) => Object.hasOwn(receipt.changed, path)
  ? Boolean(hash && receipt.changed[path].before === hash && sofiaIntegrityAllowsFileChange(path))
  : sofiaRpcMatchesPriorHash(path, hash)

// Replay the reviewed baseline before each older phase's own literal inverse.
// Every later byte must be pinned; unrelated changes are never hidden and an
// in-scope file with append-only tampering cannot be canonicalized.
export function sofiaIntegrityPriorSource(path, source) {
  source = preSubcategoryDisclosureSource(path, source)
  if (Object.hasOwn(receipt.changed, path) && sha(source) === receipt.changed[path].before) return source
  source = sofiaRpcPriorSource(path, source)
  if (!Object.hasOwn(receipt.changed, path)) return source
  const { before, after } = receipt.changed[path], digest = sha(source)
  if (digest === before) return source
  if (digest !== after) throw Error('Unreviewed 24 Nov Sofia location/image source delta: ' + path)
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root, maxBuffer: 8 * 1024 * 1024 })
    if (sha(original) !== before) throw Error('Sofia location/image baseline does not match pinned source: ' + path)
    prior.set(path, original)
  }
  return typeof source === 'string' ? prior.get(path).toString('utf8') : prior.get(path)
}
