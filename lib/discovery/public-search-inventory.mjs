import { visiblePublicServices } from '../public-service-eligibility.mjs'

// Shared cheap search index, not a second directory or a booking read. Only
// public matching/filter facts are selected; image, staff and schedule payloads
// are hydrated for the final candidates by the existing search adapter.
const SERVICE_INDEX_FIELDS = 'id,name,description,category,price,currency,price_details,duration_min,active'
export const PUBLIC_SEARCH_INDEX_FIELDS = `id,name,slug,active,platform_status,city_ekatte,city,neighborhood,address,industry,booking_mode,phone,website_url,description:public_profile->description,latitude:public_profile->latitude,longitude:public_profile->longitude,payments:public_profile->payments,services(${SERVICE_INDEX_FIELDS})`
const inventories = new WeakMap()
const CITY_CACHE_LIMIT = 16
const PAGE_SIZE = 500
const publicId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// PostgREST embeds are bounded. Only a menu that actually hits that boundary
// needs additional reads; ordinary businesses incur no service-table query.
// Reuse this completion for both the cheap index and final rich hydration.
export async function completeSearchServices(db, rows) {
  const complete = []
  for (const row of rows || []) {
    if (!Array.isArray(row.services) || row.services.length < PAGE_SIZE || !publicId.test(row.id || '')) { complete.push(row); continue }
    const services = [], seen = new Set()
    let cursor = null
    for (;;) {
      let query = db.from('services').select(SERVICE_INDEX_FIELDS).eq('business_id', row.id).eq('active', true).order('id').limit(PAGE_SIZE)
      if (cursor) query = query.gt('id', cursor)
      const { data, error } = await query
      if (error) throw error
      const page = Array.isArray(data) ? data : []
      for (const service of page) if (service.active === true && !seen.has(service.id)) { services.push(service); seen.add(service.id) }
      if (page.length < PAGE_SIZE) break
      const next = page.at(-1)?.id
      if (typeof next !== 'string' || next === cursor) throw Error('SEARCH_INDEX_UNAVAILABLE')
      cursor = next
    }
    complete.push({ ...row, services })
  }
  return complete
}

function publicRows(rows) {
  return (rows || []).filter(row => row.active === true && row.platform_status === 'enabled')
    .map(row => ({ ...row, services: visiblePublicServices(row).filter(service => service.active === true) }))
}

async function loadInventory(db, cityCode) {
  const result = []
  let cursor = null
  for (;;) {
    let query = db.from('businesses').select(PUBLIC_SEARCH_INDEX_FIELDS)
      .eq('active', true).eq('platform_status', 'enabled').eq('services.active', true)
      .order('id').limit(PAGE_SIZE).limit(500, { referencedTable: 'services' })
    if (cityCode) query = query.eq('city_ekatte', cityCode)
    if (cursor) query = query.gt('id', cursor)
    const { data, error } = await query
    if (error) throw error
    const page = Array.isArray(data) ? data : []
    result.push(...publicRows(await completeSearchServices(db, page)))
    if (page.length < PAGE_SIZE) return result
    const next = page.at(-1)?.id
    if (typeof next !== 'string' || next === cursor) throw Error('SEARCH_INDEX_UNAVAILABLE')
    cursor = next
  }
}

// A small metadata cache is city-scoped, never keyed by a person's query, GPS,
// IP or account. Final candidates must be revalidated before public output.
export async function readPublishedSearchInventory(db, { cityCode = '', now = Date.now, ttlMs = 30000 } = {}) {
  if (cityCode && !/^\d{5}$/.test(cityCode)) return []
  let cache = inventories.get(db)
  if (!cache) { cache = new Map(); inventories.set(db, cache) }
  const key = cityCode || '*', time = now(), previous = cache.get(key)
  if (previous?.pending) return previous.pending
  if (previous && previous.expiresAt > time) return previous.rows
  const entry = { rows: null, expiresAt: 0, pending: null }
  entry.pending = loadInventory(db, cityCode).then(rows => {
    entry.rows = rows; entry.expiresAt = now() + Math.max(0, Math.min(30000, ttlMs)); entry.pending = null
    return rows
  }).catch(error => { if (cache.get(key) === entry) cache.delete(key); throw error })
  cache.delete(key); cache.set(key, entry)
  while (cache.size > CITY_CACHE_LIMIT) cache.delete(cache.keys().next().value)
  return entry.pending
}

// Recheck publication and active services after a cached index match. A profile
// revoked moments ago, or a stale service, is never emitted from that cache.
export async function readPublishedSearchCandidates(db, ids) {
  const selected = [...new Set(ids || [])].filter(id => publicId.test(id)).slice(0, 24)
  if (!selected.length) return []
  const { data, error } = await db.from('businesses').select(PUBLIC_SEARCH_INDEX_FIELDS)
    .in('id', selected).eq('active', true).eq('platform_status', 'enabled').eq('services.active', true)
    .limit(24).limit(500, { referencedTable: 'services' })
  if (error) throw error
  return publicRows(await completeSearchServices(db, (data || []).filter(row => selected.includes(row.id) && row.active === true && row.platform_status === 'enabled')))
}
