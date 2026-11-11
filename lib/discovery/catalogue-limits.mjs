// Primitive-only bounds shared with the browser rail: no catalogue data,
// schema library, server module or provider SDK belongs in this module.
export const CATALOGUE_MAX_RECORDS = 20000
// readInternalCandidates remains independently bounded to 100 partners.
// Reserve their space without clipping the tail of a full local catalogue.
export const CATALOGUE_PARTNER_CAPACITY = 100
export const CATALOGUE_MAX_SEARCH_ROWS = CATALOGUE_MAX_RECORDS + CATALOGUE_PARTNER_CAPACITY
