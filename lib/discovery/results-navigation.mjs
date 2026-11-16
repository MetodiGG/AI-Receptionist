export function focusDiscoveryResults(heading, reduceMotion = false) {
  if (!heading) return false
  heading.focus({ preventScroll: true })
  heading.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start', inline: 'nearest' })
  return true
}

// Deliberate category choices navigate only after their current response has
// committed. Initial browsing, typing and pagination never call these helpers.
export function focusDiscoverySubcategories(section, reduceMotion = false) {
  if (!section) return false
  section.focus({ preventScroll: true })
  section.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start', inline: 'nearest' })
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
