// Runs only behind the existing secret-authenticated daily cron. Exact,
// database-generated object keys, never a user prefix or recursive bucket wipe.
export async function cleanupBusinessMedia(db) {
  const queue = await db.from('business_media_cleanup').select('object_key').lte('not_before', new Date().toISOString()).order('not_before').limit(25)
  if (queue.error) throw queue.error
  const keys = (queue.data || []).map(row => row.object_key)
  if (!keys.length) return { removed: 0 }
  if (keys.some(key => !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/.test(key))) throw new Error('INVALID_MEDIA_KEY')
  const registered = await db.from('business_media').select('object_key').in('object_key', keys)
  if (registered.error) throw registered.error
  const keep = new Set((registered.data || []).map(row => row.object_key)), remove = keys.filter(key => !keep.has(key))
  if (remove.length) { const result = await db.storage.from('business-media').remove(remove); if (result.error) throw result.error }
  // Metadata vanished before enqueueing; new registrations never reuse keys.
  // A committed photo with an ambiguous upload response is preserved above.
  const done = await db.from('business_media_cleanup').delete().in('object_key', keys)
  if (done.error) throw done.error
  return { removed: remove.length }
}
