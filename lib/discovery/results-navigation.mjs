export function focusDiscoveryResults(heading, reduceMotion = false) {
  if (!heading) return false
  heading.focus({ preventScroll: true })
  heading.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start', inline: 'nearest' })
  return true
}
