import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/poster-polish-20261126-approval.json' with { type: 'json' }
import priceReceipt from './fixtures/discovery-price-23px-20261126-approval.json' with { type: 'json' }
import { SERVICE_PRICE_CARDS_NEW_HASHES } from './services-price-cards-scope.mjs'
import { preServiceDetailPhotoCoverageSource } from './service-detail-photo-coverage-20261126-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const prior = new Map()
let priorPrice

export function prePriceTypographySource(path, source) {
  if (path !== priceReceipt.path || sha(source) !== priceReceipt.after) return source
  if (!priorPrice) {
    const original = execFileSync('git', ['show', priceReceipt.baseline + ':' + path], { cwd: root })
    if (sha(original) !== priceReceipt.before) throw Error('Price typography baseline does not match pinned source: ' + path)
    priorPrice = original
  }
  return typeof source === 'string' ? priorPrice.toString('utf8') : Buffer.from(priorPrice)
}

function exactFile(path, expected) {
  try {
    const source = readFileSync(new URL('../' + path, import.meta.url))
    return sha(prePriceTypographySource(path, preServiceDetailPhotoCoverageSource(path, source))) === expected
  }
  catch { return false }
}

export const posterPolishAllowsFileChange = path => Object.hasOwn(receipt.changed, path) && exactFile(path, receipt.changed[path].after)
export const posterPolishAllowsNewFile = path => Object.hasOwn(receipt.added, path) && exactFile(path, receipt.added[path])
export const posterPolishMatchesPriorHash = (path, hash) => Boolean(hash && Object.hasOwn(receipt.changed, path)
  && receipt.changed[path].before === hash && posterPolishAllowsFileChange(path))
export const posterPolishKeepsEarlierAddedMenuFile = path => posterPolishMatchesPriorHash(path, SERVICE_PRICE_CARDS_NEW_HASHES[path])

// Retain original receipts. Only replay reviewed bytes for this UI layer.
export function posterPolishPriorSource(path, source) {
  if (!Object.hasOwn(receipt.changed, path)) return source
  source = prePriceTypographySource(path, preServiceDetailPhotoCoverageSource(path, source))
  const { before, after } = receipt.changed[path], digest = sha(source)
  if (digest === before) return source
  if (digest !== after) throw Error('Unreviewed 26 Nov poster polish source delta: ' + path)
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root, maxBuffer: 8 * 1024 * 1024 })
    if (sha(original) !== before) throw Error('Poster polish baseline does not match pinned source: ' + path)
    prior.set(path, original)
  }
  return typeof source === 'string' ? prior.get(path).toString('utf8') : Buffer.from(prior.get(path))
}
