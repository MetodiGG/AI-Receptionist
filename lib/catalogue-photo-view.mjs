const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
export const catalogueIdPattern = /^sofia-[a-z0-9-]{3,80}$/
const publicPhoto = new RegExp(`^/api/catalogue-media/${uuid}$`, 'i')
export function isCataloguePhotoSource(value) {
  return typeof value === 'string' && (/^\/catalogue-media\/[a-z0-9-]+\.webp$/.test(value) || publicPhoto.test(value))
}
export function cataloguePhotoView(row) {
  if (!row || !catalogueIdPattern.test(row.catalogue_id || '') || !new RegExp(`^${uuid}$`, 'i').test(row.photo_id || '') ||
    row.rights_basis !== 'owner_permission' || typeof row.rights_reference !== 'string' || row.rights_reference.trim().length < 5 ||
    !Number.isInteger(row.width) || row.width < 1 || row.width > 2000 || !Number.isInteger(row.height) || row.height < 1 || row.height > 2000) return null
  return { src: `/api/catalogue-media/${row.photo_id}`, alt: typeof row.alt_text === 'string' ? row.alt_text.slice(0, 160) : '', width: row.width, height: row.height }
}
export function attachCataloguePhotos(results, photos = []) {
  const indexed = new Map(photos.map(row => [row.catalogue_id, cataloguePhotoView(row)]))
  return results.map(row => row.source === 'catalogue' && indexed.get(row.id) ? { ...row, photo: indexed.get(row.id) } : row)
}
