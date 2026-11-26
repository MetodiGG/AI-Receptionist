import { writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { categoryArtSource } from '../lib/category-art.mjs'
import { catalogueDetailsWithServicePhotos } from '../lib/catalogue-service-photo-keys.mjs'
import { discoveryServicePhotoIdentity, staticDiscoveryPhotoPath } from '../lib/discovery-photo-identity.mjs'
import { businessCoverPhotoSources, matchesBusinessCoverPhoto, publicServiceThumbnail } from '../lib/discovery-photo-presentation.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { homeCategories } from '../lib/discovery/home.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { DISCOVERY_SUBCATEGORIES } from '../lib/discovery/subcategories.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from './discovery-photo-fingerprint.mjs'

const localPublicDirectory = fileURLToPath(new URL('../public/', import.meta.url))
const scope = 'Published checked-in catalogue services and local catalogue covers; no production media, customer data, or live partner inventory fetched.'
const by = (a, b) => a < b ? -1 : a > b ? 1 : 0
const newScenePrefix = '/service-photos/go-detail-'
const navigationPhotos = () => new Set([
  ...homeCategories('bg').flatMap(item => [item.photo, item.photo2x, item.photoLarge, categoryArtSource(item.id), categoryArtSource(item.id, true)]),
  ...DISCOVERY_SUBCATEGORIES.map(item => item.photo),
].map(staticDiscoveryPhotoPath).filter(Boolean))

function counts() {
  return { rows: 0, before: 0, after: 0, afterVerified: 0, missingPicture: 0, sameCoverBefore: 0, newSceneRows: 0 }
}

function compareExact(photo, reference) {
  return photo.sha256 === reference.sha256 ? 'identical-bytes'
    : photo.decoded === reference.decoded ? 'identical-decoded' : null
}

export async function auditDetailServicePhotos({
  now = Date.now(), records = PUBLIC_CATALOGUE, publicDirectory = localPublicDirectory, near = false,
} = {}) {
  if (!Number.isFinite(now)) throw new Error('A valid audit time is required.')
  const navigation = navigationPhotos()
  const localFiles = new Set(navigation)
  const nonLocalReferences = new Set()
  const byCategory = Object.create(null)
  const totals = counts()
  const rows = []
  const unresolved = new Map()
  let publishedBusinesses = 0
  for (const raw of records) {
    const record = approvedCatalogueRecord(raw, now)
    if (!record) continue
    publishedBusinesses++
    const details = catalogueDetailsWithServicePhotos(record, now)
    const business = { ...record, source: 'catalogue', businessCategory: record.category, details }
    const coverSources = businessCoverPhotoSources(business)
    const localCovers = [...new Set(coverSources.map(staticDiscoveryPhotoPath).filter(Boolean))]
    localCovers.forEach(src => localFiles.add(src))
    for (const src of coverSources) if (!staticDiscoveryPhotoPath(src)) nonLocalReferences.add(src)
    for (const service of details.services) {
      const legacy = publicServiceThumbnail(service, { business })
      const sameCoverBefore = matchesBusinessCoverPhoto(legacy.src, coverSources)
      const before = Boolean(legacy.src && !sameCoverBefore)
      const selected = publicDetailServiceThumbnail(service, { business, coverSources })
      const source = selected.src
      const localSource = staticDiscoveryPhotoPath(source)
      const category = service.category || record.category
      const counters = byCategory[category] ??= counts()
      const sharesHeroPath = matchesBusinessCoverPhoto(source, coverSources)
      for (const set of [counters, totals]) {
        set.rows++
        if (before) set.before++
        if (sameCoverBefore) set.sameCoverBefore++
        if (source) set.after++
        else set.missingPicture++
        if (source?.startsWith(newScenePrefix)) set.newSceneRows++
      }
      if (localSource) localFiles.add(localSource)
      else if (source) nonLocalReferences.add(source)
      const entity = discoveryServicePhotoIdentity(service, business)
      if (!source) {
        const gap = unresolved.get(entity) ?? { entity, category, service: service.name, missingRows: 0, sameCoverBefore: 0, exampleBusinesses: [] }
        gap.missingRows++
        if (sameCoverBefore) gap.sameCoverBefore++
        if (gap.exampleBusinesses.length < 3 && !gap.exampleBusinesses.includes(record.id)) gap.exampleBusinesses.push(record.id)
        unresolved.set(entity, gap)
      } else {
        rows.push({ entity, category, businessId: record.id, service: service.name, source, localSource, localCovers,
          directCoverCollision: sharesHeroPath })
      }
    }
  }

  const disk = new Map(), unreadable = []
  const sources = [...localFiles].sort(by)
  for (let i = 0; i < sources.length; i += 12) {
    await Promise.all(sources.slice(i, i + 12).map(async path => {
      try {
        const photo = await fingerprintDiscoveryPhoto(await readDiscoveryImage(publicDirectory, path))
        disk.set(path, photo)
      } catch (error) {
        unreadable.push({ path, issue: error.code || error.message || 'Unreadable image' })
      }
    }))
  }
  const navByBytes = new Map(), navByPixels = new Map()
  function recordIndex(index, key, path) {
    if (!index.has(key)) index.set(key, [])
    index.get(key).push(path)
  }
  for (const path of navigation) {
    const photo = disk.get(path)
    if (!photo) continue
    recordIndex(navByBytes, photo.sha256, path)
    recordIndex(navByPixels, photo.decoded, path)
  }
  const dupeGroups = new Map(), nearGroups = new Map(), selectedPaths = new Set()
  const checkedPairs = new Map()
  const countFinding = (map, finding, row) => {
    const key = JSON.stringify([row.source, finding.reference, finding.placement, finding.kind])
    if (!map.has(key)) map.set(key, { selected: row.source, ...finding, rows: 0, exampleBusiness: row.businessId })
    map.get(key).rows++
  }
  const comparePair = (source, path, placement) => {
    const key = JSON.stringify([source, path, placement])
    if (checkedPairs.has(key)) return checkedPairs.get(key)
    const first = disk.get(source), reference = disk.get(path)
    const exact = first && reference && compareExact(first, reference)
    let finding = exact ? { kind: exact, reference: path, placement } : null
    // Optional and bounded: all same-listing cover pairs, and only new
    // alternate files across the complete navigation inventory.
    if (!finding && near && first && reference && (placement === 'cover' || source.startsWith(newScenePrefix))) {
      const candidate = compareDiscoveryPhotos(first, reference)
      if (candidate) finding = { ...candidate, reference: path, placement }
    }
    checkedPairs.set(key, finding)
    return finding
  }
  for (const row of rows) {
    if (row.directCoverCollision) countFinding(dupeGroups, { kind: 'same-source', reference: row.source, placement: 'cover' }, row)
    if (!row.localSource) continue
    selectedPaths.add(row.localSource)
    const photo = disk.get(row.localSource)
    if (!photo) continue
    totals.afterVerified++
    byCategory[row.category].afterVerified++
    const navReferences = near && row.localSource.startsWith(newScenePrefix)
      ? [...navigation]
      : [...new Set([...(navByBytes.get(photo.sha256) || []), ...(navByPixels.get(photo.decoded) || [])])]
    for (const [paths, placement] of [[row.localCovers, 'cover'], [navReferences, 'navigation']]) {
      for (const path of paths) {
        // A direct same-source hero conflict is already included once above.
        if (placement === 'cover' && path === row.localSource && row.directCoverCollision) continue
        const finding = comparePair(row.localSource, path, placement)
        if (finding) countFinding(finding.kind === 'visual-review-candidate' ? nearGroups : dupeGroups, finding, row)
      }
    }
  }
  const tallies = {
    scope, asOf: new Date(now).toISOString(), publishedBusinesses,
    totals, categories: Object.fromEntries(Object.entries(byCategory).sort(([a], [b]) => by(a, b))),
    assets: {
      navigation: navigation.size, inspected: sources.length, physicallyVerified: disk.size,
      distinctSelectedLocalPhotos: selectedPaths.size, unreadable: unreadable.length,
      nonLocalReferencesNotRead: nonLocalReferences.size, collisionGroups: dupeGroups.size,
      perceptualReviewCandidates: near ? nearGroups.size : null,
    },
    unresolvedServiceIdentities: unresolved.size,
  }
  return {
    ...tallies,
    missingServiceImages: [...unresolved.values()].sort((a, b) => b.missingRows - a.missingRows || by(a.service, b.service)),
    unreadableAssets: unreadable.sort((a, b) => by(a.path, b.path)),
    duplicateGroups: [...dupeGroups.values()].sort((a, b) => b.rows - a.rows || by(a.selected, b.selected)),
    perceptualCandidates: [...nearGroups.values()].sort((a, b) => b.rows - a.rows || by(a.selected, b.selected)),
    nonLocalReferences: [...nonLocalReferences].sort(by),
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { values } = parseArgs({ options: { 'as-of': { type: 'string' }, report: { type: 'string' }, near: { type: 'boolean' } } })
  const now = values['as-of'] ? Date.parse(values['as-of'] + 'T12:00:00.000Z') : Date.now()
  if (values['as-of'] && (!Number.isFinite(now) || new Date(now).toISOString().slice(0, 10) !== values['as-of'])) {
    throw new Error('--as-of must be a valid YYYY-MM-DD date.')
  }
  const report = await auditDetailServicePhotos({ now, near: values.near })
  const { missingServiceImages, unreadableAssets, duplicateGroups, perceptualCandidates, nonLocalReferences, ...summary } = report
  if (values.report) await writeFile(values.report, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
  console.log(JSON.stringify(summary, null, 2))
  if (unreadableAssets.length || duplicateGroups.length) {
    console.error(JSON.stringify({ unreadableAssets, duplicateGroups }, null, 2))
    process.exitCode = 1
  }
}
