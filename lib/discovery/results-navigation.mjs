export function focusDiscoveryResults(heading, reduceMotion = false) {
  if (!heading) return false
  heading.focus({ preventScroll: true })
  heading.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start', inline: 'nearest' })
  return true
}

// Initial browsing, typing and pagination never call these helpers. A chosen
// category can focus its real heading before the business facets arrive.
export function focusDiscoverySubcategories(section, reduceMotion = false, { stablePanel = false } = {}) {
  if (!section) return false
  // The outer panel's top does not depend on grid height or on image loading.
  // It also avoids asking the browser to scroll a clipped loading placeholder.
  const anchor = (stablePanel && section.closest?.('.inline-discovery-panel')) || section
  section.focus({ preventScroll: true })
  // Let the browser animate from the current position, including on longer
  // mobile layouts. No timeout ties the start to the catalogue request.
  anchor.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start', inline: 'nearest' })
  return true
}

export function focusFirstDiscoveryBusiness(heading, reduceMotion = false) {
  const first = heading?.closest?.('.home-businesses')?.querySelector('.home-business-grid > li:first-child')
  if (!first) return focusDiscoveryResults(heading, reduceMotion)
  const control = first.querySelector('a[href], button:not(:disabled)')
  ;(control || heading).focus({ preventScroll: true })
  first.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start', inline: 'nearest' })
  return true
}
