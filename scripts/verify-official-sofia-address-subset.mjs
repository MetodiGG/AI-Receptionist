import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { parseArgs } from 'node:util'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import approved from '../public/catalogue-official-address-points-20261113.json' with { type: 'json' }
import { indexOfficialSofiaAddresses, matchOfficialSofiaAddress } from '../lib/discovery/official-sofia-address.mjs'
import { OFFICIAL_SOFIA_DATA_SHA256 } from '../lib/discovery/official-sofia-address-source.mjs'

// Read-only, offline replay against the exact public municipal snapshot. No
// download, production adapter, arbitrary output file, or automatic publishing.
export function verifyOfficialSubset(bytes) {
  if (createHash('sha256').update(bytes).digest('hex') !== OFFICIAL_SOFIA_DATA_SHA256) throw Error('Official source snapshot hash mismatch')
  const index = indexOfficialSofiaAddresses(JSON.parse(bytes.toString('utf8')))
  let unique = 0, manuallyDisambiguated = 0
  for (const row of approved.points) {
    const p = row.coordinates
    const result = matchOfficialSofiaAddress(index, { id: row.id, address: p.sourceAddress, cityCode: p.sourceCityCode,
      neighborhood: p.sourceNeighborhood, website: p.sourceWebsite, locationKind: 'premises' })
    const candidate = result.candidates.find(value => value.rn === p.addressId)
    if (!candidate || candidate.coordinates.latitude !== p.latitude || candidate.coordinates.longitude !== p.longitude ||
      Object.entries(row.officialAddress).some(([key, value]) => candidate[key] !== value)) throw Error(`Changed official source point: ${row.id}`)
    if (row.review.decision === 'manual_duplicate_disambiguation') {
      if (row.id !== 'sofia-in-beauty' || p.addressId !== '113534' || result.status !== 'ambiguous' || result.candidates.length !== 2) throw Error('Unexpected manual duplicate approval')
      manuallyDisambiguated++
    } else {
      if (result.status !== 'unique' || result.unique.rn !== p.addressId) throw Error(`Address no longer uniquely matches: ${row.id}`)
      unique++
    }
  }
  return { checked: approved.points.length, unique, manuallyDisambiguated, sourceFeatures: index.counts.total, sourceSha256: OFFICIAL_SOFIA_DATA_SHA256 }
}

export async function main(args = process.argv.slice(2)) {
  const { values } = parseArgs({ args, options: { dataset: { type: 'string' } } })
  if (!values.dataset || !values.dataset.startsWith('/')) throw Error('Use --dataset with an absolute path to the already downloaded public GeoJSON snapshot')
  process.stdout.write(JSON.stringify(verifyOfficialSubset(await readFile(values.dataset)), null, 2) + '\n')
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
