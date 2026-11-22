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
export const CAR_WASH_REFINEMENT_NEW_MEDIA = Object.freeze(['', '-2x', '-large'].map(suffix => `public/category-photos/car_wash${suffix}-v5.webp`))
export const DISCOVERY_NEW_MEDIA = Object.freeze([...REFINEMENT_NEW_MEDIA, ...CAR_WASH_REFINEMENT_NEW_MEDIA])
export const refinementAllowsNewMedia = path => DISCOVERY_NEW_MEDIA.includes(path)

// Later owner-approved compact breadcrumb/service controls and three audited
// photo slugs. This is an exact path list, not a refreshed data/media baseline.
export const COMPACT_SELECTION_CHANGED_FILES = new Set([
  'app/inline-discovery.css',
  'app/premium-discovery-cards.css',
  'components/discovery-business-card.js',
  'components/discovery-subcategories.js',
  'components/inline-discovery-summary.js',
  'lib/discovery/inline-copy.mjs',
  'lib/discovery/home.mjs',
  'lib/discovery/subcategories.mjs',
  'components/partner-categories.js',
  'app/solar.css',
])
export const reviewedDiscoveryFileChange = path => REFINEMENT_CHANGED_FILES.has(path) || COMPACT_SELECTION_CHANGED_FILES.has(path)

// The owner separately requested an in-Codex responsive review wrapper. These
// exact development-only files do not permit changes to any production source.
export const RESPONSIVE_PREVIEW_FILES = Object.freeze([
  'app/dev/site-preview/page.js',
  'app/dev/site-preview/preview.js',
  'app/dev/site-preview/preview.css',
])
export const responsivePreviewAllowsNewFile = path => RESPONSIVE_PREVIEW_FILES.includes(path)
