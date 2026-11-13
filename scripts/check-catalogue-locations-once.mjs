// Explicitly approved ONE-TIME public-address comparison, 2026-11-13.
// Not an application geocoder, POI harvester, recurring job or client endpoint.
// Policy: https://operations.osmfoundation.org/policies/nominatim/
import { readFile, writeFile, open, unlink } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { parseArgs } from 'node:util'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import approvedTargets from '../docs/catalogue-geocoding/approved-location-targets-20261113.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueLocationReviewRequest, reviewCatalogueLocation } from '../lib/discovery/catalogue-location-review.mjs'

export const LOCATION_REVIEW_APPROVAL = 'public-address-integrity-20261113'
export const MAX_LOCATION_REVIEW_REQUESTS = 165
const PUBLIC_DIRECTORY = 'https://www.gorez.co/api/public/businesses'
const checkedOn = '2026-11-13'
const clock = Date.parse(`${checkedOn}T12:00:00Z`)
const legacyPaths = [
  '../docs/catalogue-geocoding/nominatim-address-cache-20261106.json',
  '../docs/catalogue-geocoding/nominatim-structured-cache-20261106.json',
  '../docs/catalogue-geocoding/nominatim-named-cache-20261106.json',
]
const cleanAddress = value => typeof value === 'string' && value.length <= 250 && !/[\u0000-\u001f@]|https?:|\d{2}\.\d+\s*[,;]\s*\d{2}\.\d+/iu.test(value) ? value.replace(/\s+/gu, ' ').trim() : ''
const pointOK = value => value && Number.isFinite(value.latitude) && value.latitude >= 42.45 && value.latitude <= 42.9 && Number.isFinite(value.longitude) && value.longitude >= 23.1 && value.longitude <= 23.65

export function locationReviewTargets(records, nativeSnapshot) {
  if (nativeSnapshot?.source !== PUBLIC_DIRECTORY || nativeSnapshot.observedOn !== checkedOn || !Array.isArray(nativeSnapshot.businesses) || nativeSnapshot.businesses.length > 20) throw Error('Expected a dated public-directory location-only snapshot')
  const catalogue = records.filter(row => approvedCatalogueRecord(row, clock) &&
    (row.coordinates?.method === 'first_party_coordinates' || row.id === 'sofia-in-beauty' || row.id === 'sofia-san-krasi-barber'))
    .map(row => ({ ...row, source: 'catalogue' }))
  const native = nativeSnapshot.businesses.filter(row => row.coordinates).map(row => {
    if (!/^[a-f0-9-]{36}$/i.test(row.id || '') || row.cityCode !== '68134' || !pointOK(row.coordinates) || !cleanAddress(row.address)) throw Error('Invalid public native location fixture')
    return { id: row.id, name: row.name, source: 'gorez', cityCode: row.cityCode, neighborhood: row.neighborhood,
      address: row.address, locationKind: 'premises',
      // Source binds only the currently public row, not geographic accuracy.
      coordinates: { ...row.coordinates, method: 'first_party_coordinates', source: PUBLIC_DIRECTORY, sourceAddress: row.address } }
  })
  const targets = [...catalogue, ...native].sort((a, b) => Number(b.id === 'sofia-in-beauty') - Number(a.id === 'sofia-in-beauty') || a.id.localeCompare(b.id))
  if (!targets.length || targets.length > MAX_LOCATION_REVIEW_REQUESTS || new Set(targets.map(row => row.id)).size !== targets.length) throw Error('The approved one-time address scope is limited to 165 existing public records')
  for (const row of targets) if (!cleanAddress(row.address) || row.locationKind !== 'premises') throw Error('Only existing public premises addresses can be sent')
  return targets
}

export function locationReviewQuery(row) {
  const request = catalogueLocationReviewRequest(row)
  const address = cleanAddress(row.address)
  if (!address) throw Error('Invalid public address')
  // A literal block/landmark address may be looked up, but an unsupported or
  // vague response still remains unresolved in the conservative review helper.
  return request?.query || `${address}${/(?:^|[,;])\s*България\s*$/iu.test(address) ? '' : ', България'}`
}

export async function main(args = process.argv.slice(2)) {
  const { values } = parseArgs({ args, options: { 'approved-one-time': { type: 'boolean' }, 'dry-run': { type: 'boolean' }, offline: { type: 'boolean' },
    native: { type: 'string' }, cache: { type: 'string' }, output: { type: 'string' } } })
  if (!values['approved-one-time'] || ![values.native, values.cache, values.output].every(path => path?.startsWith('/')) || new Set([values.native, values.cache, values.output]).size !== 3) throw Error('Explicit one-time approval and three distinct absolute snapshot/cache/report paths required')
  if (approvedTargets.networkClosed && !values.offline && !values['dry-run']) throw Error('The approved one-time batch is completed; only offline reclassification is permitted')
  const snapshot = JSON.parse(await readFile(values.native, 'utf8'))
  if (snapshot.source !== PUBLIC_DIRECTORY || snapshot.observedOn !== checkedOn) throw Error('Expected original dated public native snapshot')
  // Freeze the original points too: comparing an enriched point to its own
  // new source would make a circular, falsely successful review.
  const targets = approvedTargets.records
  const identity = createHash('sha256').update(JSON.stringify(targets)).digest('hex')
  if (approvedTargets.approval !== LOCATION_REVIEW_APPROVAL || approvedTargets.maximumRequests !== MAX_LOCATION_REVIEW_REQUESTS || approvedTargets.targetCount !== 165 || targets.length !== 165 || approvedTargets.identity !== identity) throw Error('Changed approved address cohort')
  const allowed = new Map(targets.map(row => [row.id, row.query]))
  const allowedQueries = new Set(allowed.values())
  async function loadCache() {
    let value = { approval: LOCATION_REVIEW_APPROVAL, maximumRequests: MAX_LOCATION_REVIEW_REQUESTS, targetIdentity: identity, requestsMade: 0, requestLog: [], lookups: {} }
    try { value = JSON.parse(await readFile(values.cache, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
    if (value.approval !== LOCATION_REVIEW_APPROVAL || value.maximumRequests !== MAX_LOCATION_REVIEW_REQUESTS || !Number.isInteger(value.requestsMade) || value.requestsMade < 0 || value.requestsMade > MAX_LOCATION_REVIEW_REQUESTS || !Array.isArray(value.requestLog) || value.requestLog.length !== value.requestsMade || !value.lookups || Array.isArray(value.lookups) ||
      (value.targetIdentity && value.targetIdentity !== identity) || value.requestLog.some(entry => allowed.get(entry.id) !== entry.query) || Object.keys(value.lookups).some(query => !allowedQueries.has(query))) throw Error('Invalid durable one-time request ledger or changed cohort')
    if (!value.targetIdentity && value.requestsMade && !values.offline && !values['dry-run']) throw Error('Legacy completed ledger requires offline binding, never new requests')
    value.targetIdentity = identity
    return value
  }
  let cache = await loadCache()
  const legacy = {}
  for (const path of legacyPaths) Object.assign(legacy, JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8')))
  const cachedFor = row => {
    const query = row.query, request = catalogueLocationReviewRequest(row)
    if (Object.hasOwn(cache.lookups, query)) return cache.lookups[query]
    if (Object.hasOwn(legacy, query)) return { origin: 'saved_20261106_query', observedOn: '2026-11-06', candidates: legacy[query] }
    const structured = request && JSON.stringify({ street: `${request.house} ${request.road}`, city: 'София', country: 'България' })
    return structured && Object.hasOwn(legacy, structured) ? { origin: 'saved_20261106_structured', observedOn: '2026-11-06', candidates: legacy[structured] } : null
  }
  if (values['dry-run']) {
    process.stdout.write(JSON.stringify({ dryRun: true, approval: cache.approval, maximumRequests: MAX_LOCATION_REVIEW_REQUESTS, spentRequests: cache.requestsMade,
      targetCount: targets.length, targetIdentity: identity, networkClosed: approvedTargets.networkClosed, targets: targets.map(row => ({ id: row.id, sourceAddress: row.address, query: row.query, cached: Boolean(cachedFor(row)), strictStreetMatchSupported: Boolean(catalogueLocationReviewRequest(row)) })) }, null, 2) + '\n')
    return
  }
  const lockPath = `${values.cache}.lock`, lock = await open(lockPath, 'wx')
  try {
    // Another maintenance invocation could have changed the ledger while
    // this process waited. Never spend an unlocked/stale request counter.
    cache = await loadCache()
    if (cache.networkClosed && !values.offline) throw Error('One-time network access is closed')
    await lock.writeFile(JSON.stringify({ approval: cache.approval, pid: process.pid, startedAt: new Date().toISOString() }))
    const reports = [], count = {}, started = Date.now()
    let lastStart = 0
    for (const row of targets) {
      const query = row.query
      let receipt = cachedFor(row)
      if (!receipt) {
        if (values.offline) { receipt = { origin: 'not_requested_offline', candidates: null } }
        else {
          if (cache.requestsMade >= MAX_LOCATION_REVIEW_REQUESTS) throw Error('Approved request budget exhausted; no further address sent')
          await delay(Math.max(0, 2100 - (Date.now() - lastStart)))
          const url = new URL('https://nominatim.openstreetmap.org/search')
          for (const [key, value] of Object.entries({ q: query, format: 'jsonv2', addressdetails: '1', limit: '5', countrycodes: 'bg', 'accept-language': 'bg', viewbox: '23.1,42.9,23.65,42.45', bounded: '1' })) url.searchParams.set(key, value)
          lastStart = Date.now()
          cache.requestsMade++
          cache.requestLog.push({ id: row.id, query, requestedAt: new Date(lastStart).toISOString() })
          // Count failures too, and never silently retry on a restart.
          cache.lookups[query] = { origin: 'failed_or_interrupted_request', observedOn: checkedOn, candidates: null }
          await writeFile(values.cache, JSON.stringify(cache, null, 2) + '\n')
          const response = await fetch(url, { headers: { 'User-Agent': 'GoRezAddressIntegrityReview/1.0 (+https://www.gorez.co)', Accept: 'application/json' }, signal: AbortSignal.timeout(15000) })
          if (!response.ok) throw Error(`Nominatim HTTP ${response.status}; stopped without retries`)
          const raw = await response.text()
          if (Buffer.byteLength(raw) > 300000) throw Error('Unexpected geocoder response size; stopped')
          const candidates = JSON.parse(raw)
          if (!Array.isArray(candidates) || candidates.length > 5) throw Error('Unexpected geocoder response; stopped')
          receipt = { origin: 'one_time_nominatim_20261113', observedOn: checkedOn, candidates }
          cache.lookups[query] = receipt
          await writeFile(values.cache, JSON.stringify(cache, null, 2) + '\n')
        }
      }
      const review = reviewCatalogueLocation(row, receipt.candidates, checkedOn)
      reports.push({ ...review, source: row.source, evidenceOrigin: receipt.origin, responseObservedOn: receipt.observedOn || null })
      count[review.status] = (count[review.status] || 0) + 1
      await writeFile(values.output, JSON.stringify({ approval: cache.approval, checkedOn, maximumRequests: MAX_LOCATION_REVIEW_REQUESTS, requestsMade: cache.requestsMade, targetIdentity: identity, networkClosed: approvedTargets.networkClosed,
        targetCount: targets.length, processed: reports.length, count, automaticReplacement: false, records: reports }, null, 2) + '\n')
      if (reports.length === 1 || reports.length % 10 === 0 || reports.length === targets.length) process.stdout.write(JSON.stringify({ processed: reports.length, total: targets.length, requestsMade: cache.requestsMade, count, elapsedSeconds: Math.round((Date.now() - started) / 1000) }) + '\n')
    }
    cache.networkClosed = true
    await writeFile(values.cache, JSON.stringify(cache, null, 2) + '\n')
  } finally { await lock.close(); await unlink(lockPath) }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
