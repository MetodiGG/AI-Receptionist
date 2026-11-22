import 'server-only'
import { cache } from 'react'
import { PUBLIC_CATALOGUE } from './discovery/public-catalogue.mjs'
import { approvedCatalogueRecord } from './discovery/catalogue-policy.mjs'
import { catalogueProfilePath, catalogueProfileView, catalogueNativePartner, indexableCatalogueRecord, relatedCatalogueProfiles } from './catalogue-profile.mjs'
import { readPublicCataloguePhotos } from './catalogue-photo-server'
import { getSupabaseAdmin } from './supabase-admin'

const records = new Map(PUBLIC_CATALOGUE.map(row => [row.id, row]))
const publicPartners = cache(async () => {
  const rows = [], db = getSupabaseAdmin()
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from('businesses').select('id,slug,name,active,platform_status,phone,address,city,city_ekatte,neighborhood,website_url').eq('active', true).eq('platform_status', 'enabled').order('slug').range(offset, offset + 499)
    if (error) throw Error('PUBLIC_PROFILE_UNAVAILABLE')
    rows.push(...(data || []))
    if (!data || data.length < 500) return rows
  }
})
export const readCatalogueSeoProfile = cache(async id => {
  if (!catalogueProfilePath(id)) return null
  const now = Date.now(), raw = approvedCatalogueRecord(records.get(id), now)
  if (!raw) return null
  let partners = []
  try { partners = await publicPartners() } catch { /* Public source content remains usable without account or private data. */ }
  const partner = catalogueNativePartner(raw, partners, now)
  if (partner) return { partner }
  const row = indexableCatalogueRecord(raw, now)
  if (!row) return null
  let photos = []
  try { photos = await readPublicCataloguePhotos([id]) } catch { /* Verified text and illustrative fallback remain usable. */ }
  return { row, business: catalogueProfileView(row, { now, photos }), related: relatedCatalogueProfiles(PUBLIC_CATALOGUE, row, { now }), now }
})
