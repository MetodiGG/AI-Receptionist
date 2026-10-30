import { normalizeSearchText } from './discovery/categories.mjs'

export const CATEGORY_ART_ASSETS = Object.freeze(['hair','barber','nails','car','carwash','repair','sports','beauty','education','consulting','home','pets','health','appointments'])
const CATEGORIES = Object.freeze({ barber:'barber',hair:'hair',nails:'nails',beauty:'beauty',car_wash:'carwash',detailing:'car',auto_repair:'repair',fitness:'sports',education:'education',consulting:'consulting',home_services:'home',pets:'pets',health:'health',other:'appointments' })
const INDUSTRIES = Object.freeze({ beauty:'beauty',auto:'auto_repair',fitness:'fitness',education:'education',consulting:'consulting',home_services:'home_services',pets:'pets',health:'health',other:'other' })

export function categoryArtSource(category, small = false) {
  const asset = Object.hasOwn(CATEGORIES, category) ? CATEGORIES[category] : 'appointments'
  return `/category-art/${asset}${small ? '-sm' : ''}-v1.webp`
}

export function businessArtCategory(business) {
  if (!business || !Object.hasOwn(INDUSTRIES, business.industry)) return 'other'
  if (business.industry !== 'beauty') return INDUSTRIES[business.industry]
  // A category illustration, not a business logo/photo or a new classification
  // written to the database. Use known public services; never a tenant ID hack.
  const name = normalizeSearchText(business.name)
  if (/barber|барб[еъ]р|бръснар/u.test(name)) return 'barber'
  const services = (business.services || []).filter(row => row.active !== false).map(row => normalizeSearchText(`${row.name || ''} ${row.category || ''}`))
  const count = pattern => services.filter(text => pattern.test(text)).length
  const nails = count(/маникюр|педикюр|нокт|manicure|pedicure|nail/u)
  const hair = count(/подстриг|фризьор|боядис|haircut|hairdress|hair salon|hairstyl/u)
  if (nails > hair || /маникюр|педикюр|nail/u.test(name)) return 'nails'
  if (count(/брада|бръсн|beard|shav/u)) return 'barber'
  if (hair || /фризьор|hair salon|hairdress/u.test(name)) return 'hair'
  return 'beauty'
}
