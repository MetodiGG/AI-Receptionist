// Exact scope of the owner's 2026-11-22 follow-up. Historical baseline commits
// stay intact: only these presentation/navigation paths may change, and only
// twelve new siblings may enter the media inventory. Old images stay frozen.
export const REFINED_CATEGORY_IDS = Object.freeze(['fitness', 'pets', 'beauty', 'barber'])
export const REFINEMENT_CHANGED_FILES = new Set([
  'lib/discovery/home.mjs',
  'components/inline-category-grid.js',
  'components/discovery-search.js',
  'components/discovery-business-card.js',
  'app/premium-discovery-cards.css',
  'lib/discovery/copy.mjs',
])
export const REFINEMENT_NEW_MEDIA = Object.freeze(REFINED_CATEGORY_IDS.flatMap(id => ['', '-2x', '-large'].map(suffix => `public/category-photos/${id}${suffix}-v3.webp`)))
export const refinementAllowsNewMedia = path => REFINEMENT_NEW_MEDIA.includes(path)
