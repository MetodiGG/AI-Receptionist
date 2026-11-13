import { attachCataloguePhotos, catalogueIdPattern, cataloguePhotoView } from './catalogue-photo-view.mjs'

// Reviewed chain identity and the existing owner-authorized logo revision.
// This registry is imported by server adapters only, never the card renderers.
// A later source upload is not implicitly permission to share another image.
export const GPOINT_SHARED_COVER = Object.freeze({
  sourceCatalogueId: 'sofia-gpoint-manastirski-zapad',
  sourcePhotoId: 'eebc21d3-2f13-42cd-9f81-877eb6bc5736',
  catalogueIds: Object.freeze([
    'sofia-gpoint-five-corners', 'sofia-gpoint-borovo', 'sofia-gpoint-studentski-zimen-dvorets',
    'sofia-gpoint-ovcha-kupel-nbu', 'sofia-gpoint-geo-milev', 'sofia-gpoint-lyulin-10',
    'sofia-gpoint-mladost-1', 'sofia-gpoint-dondukov', 'sofia-gpoint-lozenets', 'sofia-gpoint-hladilnika',
    'sofia-gpoint-suhata-reka', 'sofia-gpoint-nadezhda-5', 'sofia-gpoint-zona-b19', 'sofia-gpoint-mladost-4',
    'sofia-gpoint-lyulin-7', 'sofia-gpoint-dianabad', 'sofia-gpoint-stadion-vasil-levski',
    'sofia-gpoint-manastirski-iztok', 'sofia-gpoint-reduta', 'sofia-gpoint-nadezhda-2',
    'sofia-gpoint-sadebna-palata', 'sofia-gpoint-druzhba-2', 'sofia-gpoint-manastirski-zapad',
    'sofia-gpoint-dragalevtsi', 'sofia-gpoint-iztok', 'sofia-gpoint-vma', 'sofia-gpoint-ovcha-kupel-2',
    'sofia-gpoint-hadzhi-dimitar', 'sofia-gpoint-mladost-2', 'sofia-gpoint-sveta-troitsa',
    'sofia-gpoint-darvenitsa', 'sofia-gpoint-banishora', 'sofia-gpoint-ovcha-kupel-lyublyana',
    'sofia-gpoint-lyulin-8', 'sofia-gpoint-studentski-nikola-gabrovski', 'sofia-gpoint-vitosha',
    'sofia-gpoint-druzhba-1', 'sofia-gpoint-mladost-3', 'sofia-gpoint-belite-brezi',
    'sofia-gpoint-krasna-polyana', 'sofia-gpoint-levski-g', 'sofia-gpoint-ovcha-kupel-mizia',
    'sofia-gpoint-nadezhda-1',
  ]),
})

const chainIds = new Set(GPOINT_SHARED_COVER.catalogueIds)
const sourceKey = `catalogue/${GPOINT_SHARED_COVER.sourceCatalogueId}/${GPOINT_SHARED_COVER.sourcePhotoId}.webp`

// Preserve the caller's bounded page in a single metadata query, adding at most
// one source ID. Admin reads deliberately keep using the original store reader.
export function sharedCataloguePhotoIds(ids, { sourceApproved = true } = {}) {
  const requested = [...new Set((Array.isArray(ids) ? ids : []).filter(id => typeof id === 'string' && catalogueIdPattern.test(id)))]
  if (sourceApproved === true && requested.some(id => chainIds.has(id)) && !requested.includes(GPOINT_SHARED_COVER.sourceCatalogueId)) {
    requested.push(GPOINT_SHARED_COVER.sourceCatalogueId)
  }
  return requested
}

export function attachSharedCataloguePhotos(results, photos = [], { sourceApproved = true } = {}) {
  const records = (Array.isArray(photos) ? photos : []).filter(row => row && typeof row === 'object')
  const attached = attachCataloguePhotos(Array.isArray(results) ? results : [], records)
  if (sourceApproved !== true) return attached
  const source = records.find(row => row.catalogue_id === GPOINT_SHARED_COVER.sourceCatalogueId &&
    row.photo_id === GPOINT_SHARED_COVER.sourcePhotoId && row.object_key === sourceKey)
  const cover = cataloguePhotoView(source)
  if (!cover) return attached
  return attached.map(row => row.source === 'catalogue' && chainIds.has(row.id) &&
    row.website === 'https://gpoint.bg/' && !row.photo
    ? { ...row, photo: { ...cover, alt: 'G Point' } } : row)
}
