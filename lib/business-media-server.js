import 'server-only'
import { MEDIA_BUCKET, MEDIA_FIELDS } from './business-media.mjs'
import { getSupabaseAdmin } from './supabase-admin'

export const checked = result => { if (result.error) throw result.error; return result.data }
export async function mediaAccess(id) {
  return checked(await getSupabaseAdmin().from('businesses').select('id,owner_id,content_revision,platform_status').eq('id', id).maybeSingle())
}
export async function mediaList(id) {
  const db = getSupabaseAdmin()
  const business = checked(await db.from('businesses').select('id,content_revision,media_gallery_managed').eq('id', id).single())
  const media = checked(await db.from('business_media').select(MEDIA_FIELDS).eq('business_id', id).order('sort_order').order('id'))
  const staff = checked(await db.from('staff').select('id,name,active').eq('business_id', id).order('sort_order').order('name'))
  return { business, media, staff }
}
export async function mutateBusinessMedia({ businessId, actorId, admin, revision, action, mediaId, image = null, application = false }) {
  checked(await getSupabaseAdmin().rpc('change_business_media', { p_business: businessId, p_actor: actorId, p_admin: admin, p_revision: revision, p_action: action, p_media: mediaId, p_image: image, p_application: application }))
}
export async function uploadBusinessMedia({ businessId, actorId, admin, revision, staffId, alt, image, mediaId, application = false }) {
  const db = getSupabaseAdmin(), key = `${businessId}/${mediaId}.webp`
  // Reserve a durable cleanup record before sending any bytes to Storage. A
  // crash/lost response cannot leave an untracked upload or issue a public URL.
  checked(await db.from('business_media_cleanup').insert({ object_key: key, not_before: new Date(Date.now() + 86400000).toISOString() }))
  checked(await db.storage.from(MEDIA_BUCKET).upload(key, image.data, { contentType: 'image/webp', upsert: false, cacheControl: '0' }))
  try {
    await mutateBusinessMedia({ businessId, actorId, admin, revision, mediaId, application, action: 'upload', image: { width: image.width, height: image.height, bytes: image.bytes, staffId, alt } })
    await db.from('business_media_cleanup').delete().eq('object_key', key)
  } catch (error) {
    // A lost RPC response is ambiguous. Never remove a committed photo. Only
    // clean up this request's newly generated private object after proving it
    // was not registered; keep the original error if Storage is unavailable.
    try {
      const row = await db.from('business_media').select('id').eq('id', mediaId).maybeSingle()
      if (!row.error && !row.data) await db.storage.from(MEDIA_BUCKET).remove([key])
      if (!row.error && row.data) return
    } catch { /* Private orphan can be reconciled by an operator. */ }
    throw error
  }
}
