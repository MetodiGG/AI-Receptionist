import approved from '../../public/catalogue-official-address-points-20261113.json' with { type: 'json' }
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_DATA_SHA256 } from './official-sofia-address-source.mjs'

// Frozen review results only. The full municipal register and the comparison
// helper are maintenance tools, never an on-request geocoder or customer bundle.
if (approved.source !== OFFICIAL_SOFIA_SOURCE_URL || approved.sourceSha256 !== OFFICIAL_SOFIA_DATA_SHA256 ||
  approved.pointCount !== approved.points.length) throw Error('Invalid reviewed municipal address subset')
const updates = new Map(approved.points.map(row => [row.id, row]))
if (updates.size !== approved.points.length) throw Error('Duplicate reviewed municipal address binding')
const samePreviousPoint = (point, previous) => previous === null ? point == null : Boolean(point &&
  point.latitude === previous.latitude && point.longitude === previous.longitude && point.method === previous.method && point.source === previous.source)

export function applyOfficialCatalogueLocations(records) {
  return records.map(row => {
    const update = updates.get(row.id), point = update?.coordinates
    // A changed address, quarter, website or a newly reviewed owner point must
    // not silently inherit/overwrite an older municipal match.
    if (!point || row.locationKind !== 'premises' || point.sourceAddress !== row.address ||
      point.sourceCityCode !== row.cityCode || point.sourceNeighborhood !== row.neighborhood ||
      point.sourceWebsite !== row.website || !samePreviousPoint(row.coordinates, update.previousCoordinates)) return row
    return { ...row, coordinates: point }
  })
}
