import { INDUSTRY_KEYS, getIndustryLabel, normalizeLocale } from './public-locale.mjs'

// Use the same business industries as onboarding and the public directory.
// Unknown legacy values remain discoverable under Other, never silently lost.
export function partnerIndustry(value) {
  return INDUSTRY_KEYS.includes(value) ? value : 'other'
}

export function partnerCategorySelection(value) {
  return value === 'all' || INDUSTRY_KEYS.includes(value) ? value : ''
}

export function partnerCategories(businesses = [], locale = 'bg') {
  const counts = new Map()
  for (const business of businesses) {
    const industry = partnerIndustry(business.industry)
    counts.set(industry, (counts.get(industry) || 0) + 1)
  }
  return INDUSTRY_KEYS.filter(id => counts.has(id)).map(id => ({
    id, label: getIndustryLabel(id, locale), count: counts.get(id),
  }))
}

export function partnersInCategory(businesses = [], category = '') {
  const selection = partnerCategorySelection(category)
  if (selection === 'all') return businesses
  if (!selection) return []
  return businesses.filter(business => partnerIndustry(business.industry) === selection)
}

export function partnerCategoryHref(category, locale = 'bg', basePath = '/partners') {
  // The alternate path is exclusively for the guarded, non-production QA page.
  const path = basePath === '/dev/partner-categories' ? basePath : '/partners'
  const params = new URLSearchParams({ lang: normalizeLocale(locale) })
  const selection = partnerCategorySelection(category)
  if (selection) params.set('category', selection)
  return `${path}?${params}`
}
