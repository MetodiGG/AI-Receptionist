import { MEDIA_BUCKET } from './business-media.mjs'
const checked = result => { if (result.error) throw result.error; return result.data }
export const CATALOGUE_PHOTO_FIELDS = 'catalogue_id,revision,photo_id,object_key,width,height,byte_size,alt_text,rights_basis,rights_reference,updated_at'
export const readCataloguePhotos = async (db, ids) => ids.length ? checked(await db.from('catalogue_photos').select(CATALOGUE_PHOTO_FIELDS).in('catalogue_id', ids)) || [] : []
export async function uploadCataloguePhoto(db, input) {
  const { catalogueId, actorId, mediaId, image, revision, rightsReference, alt } = input
  const key = `catalogue/${catalogueId}/${mediaId}.webp`
  // Register exact-object cleanup and capacity before sending any bytes. Keep
  // ambiguous failures queued; never delete an image which may have committed.
  checked(await db.rpc('reserve_catalogue_photo', { p_catalogue: catalogueId, p_photo: mediaId, p_bytes: image.bytes }))
  checked(await db.storage.from(MEDIA_BUCKET).upload(key, image.data, { contentType: 'image/webp', upsert: false, cacheControl: '0' }))
  try {
    checked(await db.rpc('change_catalogue_photo', { p_catalogue: catalogueId, p_actor: actorId, p_revision: revision, p_action: 'upload', p_photo: mediaId,
      p_image: { width: image.width, height: image.height, bytes: image.bytes, alt, rightsReference, consent: true } }))
  } catch (error) {
    try {
      const saved = await db.from('catalogue_photos').select('photo_id').eq('catalogue_id', catalogueId).maybeSingle()
      if (!saved.error && saved.data?.photo_id === mediaId) return
    } catch { /* The reserved private object is reconciled by the cleanup job. */ }
    throw error
  }
}
export async function removeCataloguePhoto(db, { catalogueId, actorId, revision }) {
  checked(await db.rpc('change_catalogue_photo', { p_catalogue: catalogueId, p_actor: actorId, p_revision: revision, p_action: 'remove' }))
}
export async function cleanupCataloguePhotos(db) {
  const queue = checked(await db.from('catalogue_photo_cleanup').select('object_key').lte('not_before', new Date().toISOString()).order('not_before').limit(25)) || []
  const keys = queue.map(row => row.object_key)
  if (!keys.length) return { removed: 0 }
  if (keys.some(key => !/^catalogue\/sofia-[a-z0-9-]{3,80}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/.test(key))) throw new Error('INVALID_CATALOGUE_MEDIA_KEY')
  const current = checked(await db.from('catalogue_photos').select('object_key').in('object_key', keys)) || []
  const keep = new Set(current.map(row => row.object_key)), remove = keys.filter(key => !keep.has(key))
  if (remove.length) checked(await db.storage.from(MEDIA_BUCKET).remove(remove))
  checked(await db.from('catalogue_photo_cleanup').delete().in('object_key', keys))
  return { removed: remove.length }
}
