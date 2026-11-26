import { execFileSync } from 'node:child_process'
import { registerHooks } from 'node:module'
import { pathToFileURL } from 'node:url'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueDetailsWithServicePhotos } from '../lib/catalogue-service-photo-keys.mjs'
import { businessActivityPhotoKey } from '../lib/business-cover-photo.mjs'
import { staticDiscoveryPhotoPath } from '../lib/discovery-photo-identity.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import generated from '../lib/service-detail-gap-generated.json' with { type: 'json' }
import followupGenerated from '../lib/service-detail-gap-followup-generated.json' with { type: 'json' }

const sourcePath = 'lib/service-detail-photo-presentation.mjs'
const sourceUrl = new URL('../' + sourcePath, import.meta.url)
const baselines = { first: '882a71d', followup: 'a62d5c6' }

async function readBaseline(wave) {
  const baselineUrl = new URL(sourceUrl)
  baselineUrl.searchParams.set('before-detail-wave', wave)
  const source = execFileSync('git', ['show', baselines[wave] + ':' + sourcePath], { cwd: new URL('../', import.meta.url), encoding: 'utf8' })
  const registration = registerHooks({
    load(url, context, nextLoad) {
      return url === baselineUrl.href ? { format: 'module', source, shortCircuit: true } : nextLoad(url, context)
    },
  })
  try {
    return (await import(baselineUrl.href)).publicDetailServiceThumbnail
  } finally { registration.deregister() }
}

export async function auditServiceDetailGapWave({ now = Date.parse('2026-11-26T12:00:00Z'), verbose = false, wave = 'first' } = {}) {
  if (!Object.hasOwn(baselines, wave)) throw Error('Unknown service-photo wave: ' + wave)
  const before = await readBaseline(wave)
  const generatedSources = new Set((wave === 'followup' ? followupGenerated : generated).map(photo => photo.src))
  const byCategory = {}, bySource = {}
  const retained = [], repeats = [], newRows = []
  let withoutPhoto = 0, gained = 0, gainedFromGenerated = 0
  for (const raw of PUBLIC_CATALOGUE) {
    const row = approvedCatalogueRecord(raw, now)
    if (!row) continue
    const business = { ...row, source: 'catalogue', businessCategory: row.category, details: catalogueDetailsWithServicePhotos(row, now) }
    business.illustrativeCoverPhotoKey = businessActivityPhotoKey(business)
    const rows = business.details.services.map(service => ({
      service, before: before(service, { business }).src, after: publicDetailServiceThumbnail(service, { business }).src,
    }))
    const occupied = new Set(rows.filter(item => item.before).map(item => staticDiscoveryPhotoPath(item.before)))
    for (const { service, before, after } of rows) {
      const key = [business.id, service.category, service.name, after]
      if (before) {
        if (before !== after) retained.push(key)
        continue
      }
      if (!after) { withoutPhoto++; continue }
      const src = staticDiscoveryPhotoPath(after)
      if (occupied.has(src)) repeats.push(key)
      occupied.add(src)
      gained++
      if (generatedSources.has(after)) gainedFromGenerated++
      byCategory[service.category] = (byCategory[service.category] || 0) + 1
      bySource[after] = (bySource[after] || 0) + 1
      if (verbose) newRows.push(key)
    }
  }
  return { gained, gainedFromGenerated, withoutPhoto, byCategory, ...(verbose ? { bySource, newRows } : {}), retained, repeats }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await auditServiceDetailGapWave({ verbose: process.argv.includes('--verbose'), wave: process.argv.includes('--followup') ? 'followup' : 'first' })
  console.log(JSON.stringify(result, null, 2))
  if (result.retained.length || result.repeats.length) process.exitCode = 1
}
