import 'server-only'
import { getSupabaseAdmin } from './supabase-admin'
import { SOFIA_CATALOGUE } from './discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from './discovery/catalogue-policy.mjs'
import { isCataloguePartnerDuplicate } from './discovery/catalogue-search.mjs'
import { DISCOVERY_CATEGORIES, normalizeSearchText } from './discovery/categories.mjs'
import { cataloguePhotoView } from './catalogue-photo-view.mjs'
import { CATALOGUE_PHOTO_FIELDS, readCataloguePhotos, removeCataloguePhoto, uploadCataloguePhoto } from './catalogue-photo-store.mjs'

const entries = new Map(SOFIA_CATALOGUE.map(row => [row.id, row]))
export const findCatalogueEntry = id => entries.get(id)
export const findApprovedCatalogueEntry = id => approvedCatalogueRecord(entries.get(id))
const checked = result => { if (result.error) throw result.error; return result.data }
async function partners(db) {
  return checked(await db.from('businesses').select('id,phone,address,city,neighborhood,website_url').eq('active', true).eq('platform_status', 'enabled').limit(5000)) || []
}
function entryView(entry, photo, members) {
  const partner = Boolean(entry.gorezBusinessId) || isCataloguePartnerDuplicate(entry, members)
  return { id: entry.id, name: entry.name, address: entry.address, neighborhood: entry.neighborhood, category: entry.category,
    website: entry.website, partner, editable: Boolean(approvedCatalogueRecord(entry)) && !partner,
    revision: photo?.revision || 0, photo: cataloguePhotoView(photo), rightsReference: photo?.rights_reference || '' }
}
export async function cataloguePhotoDetail(id) {
  const db = getSupabaseAdmin(), entry = entries.get(id)
  if (!entry) throw Error('CATALOGUE_PHOTO_NOT_FOUND')
  const [photos, members] = await Promise.all([readCataloguePhotos(db, [id]), partners(db)])
  return entryView(entry, photos[0], members)
}
export async function catalogueAdminList({ q, category, offset }) {
  if (category && !DISCOVERY_CATEGORIES.some(row => row.id === category)) throw Error('VALIDATION_ERROR')
  const db = getSupabaseAdmin(), members = await partners(db), needle = normalizeSearchText(q)
  const eligible = SOFIA_CATALOGUE.filter(entry => !entry.gorezBusinessId && !isCataloguePartnerDuplicate(entry, members))
  const categories = DISCOVERY_CATEGORIES.map(item => ({ id: item.id, bg: item.bg, en: item.en, count: eligible.filter(row => row.category === item.id).length })).filter(row => row.count)
  const rows = eligible.filter(row => (!category || row.category === category) && (!needle || normalizeSearchText([row.name,row.address,row.neighborhood,...row.services.map(item => item.name)].join(' ')).includes(needle)))
    .sort((a, b) => a.name.localeCompare(b.name, 'bg') || a.id.localeCompare(b.id))
  const page = rows.slice(offset, offset + 40), photos = new Map((await readCataloguePhotos(db, page.map(row => row.id))).map(row => [row.catalogue_id, row]))
  return { entries: page.map(row => entryView(row, photos.get(row.id), members)), categories, total: rows.length, offset, nextOffset: offset + page.length < rows.length ? offset + page.length : null }
}
export const readPublicCataloguePhotos = ids => readCataloguePhotos(getSupabaseAdmin(), ids)
export const saveCataloguePhoto = input => uploadCataloguePhoto(getSupabaseAdmin(), input)
export const clearCataloguePhoto = input => removeCataloguePhoto(getSupabaseAdmin(), input)
export const readCatalogueImage = id => getSupabaseAdmin().from('catalogue_photos').select(CATALOGUE_PHOTO_FIELDS).eq('photo_id', id).maybeSingle().then(checked)
export async function downloadCatalogueImage(key) { return checked(await getSupabaseAdmin().storage.from('business-media').download(key)) }
